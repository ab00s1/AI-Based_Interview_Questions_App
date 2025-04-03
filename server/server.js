import express from "express";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

app.use(cors({
  origin: 'https://ai-based-interview-questions-app-1.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const CodeReviewSchema = new mongoose.Schema({
  language: String,
  code: String,
  feedback: String,
  timestamp: { type: Date, default: Date.now },
});

const QuestionSchema = new mongoose.Schema({
  title: String,
  difficulty: String,
  description: String,
  jobTitle: String,
  jobDescription: String,
  testCases: Array,
  timestamp: { type: Date, default: Date.now },
});

const CodeReview = mongoose.model("CodeReview", CodeReviewSchema);
const Question = mongoose.model("Question", QuestionSchema);

app.get("/job-list", async (req, res) => {
  try {
    const {
      query = "Frontend Developer",
      location = "Remote",
      years_of_experience = "ALL",
      page = 1,
    } = req.query;

    // Fetch job listings
    const jobResponse = await axios.get(
      "https://jsearch.p.rapidapi.com/search",
      {
        params: { query, page, num_pages: 1, location },
        headers: {
          "X-RapidAPI-Key": process.env.JSEARCH_API_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    // Fetch estimated salary based on job title, location, and experience
    const salaryResponse = await axios.get(
      "https://jsearch.p.rapidapi.com/estimated-salary",
      {
        params: {
          job_title: query,
          location: location,
          location_type: "ANY",
          years_of_experience: years_of_experience,
        },
        headers: {
          "X-RapidAPI-Key": process.env.JSEARCH_API_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    res.json({
      jobs: jobResponse.data,
      estimated_salary: salaryResponse.data,
    });
  } catch (error) {
    console.error("Error fetching jobs or salary:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch job listings or salary data" });
  }
});

app.post("/generate-question", async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body;

    if (!jobTitle || !jobDescription) {
      return res
        .status(400)
        .json({ error: "Job title and description required" });
    }

    // Check if we already have a question for this job title and description
    const existingQuestion = await Question.findOne({
      jobTitle,
      jobDescription
    });

    if (existingQuestion) {
      return res.json({
        title: existingQuestion.title,
        difficulty: existingQuestion.difficulty,
        description: existingQuestion.description,
        testCases: existingQuestion.testCases
      });
    }

    const prompt = `
        Generate a well-structured LeetCode-style DSA problem relevant to: ${jobTitle}.
        Job description: ${jobDescription}
        
        The response should be in this exact format:
        
        # [TITLE]
        
        ## Difficulty: Medium
        
        ## Problem Statement
        [Clear problem description with context and requirements]
        
        ## Examples
        
        ### Example 1:
        Input: [example input]
        Output: [expected output]
        Explanation: [explanation if needed]
        
        ### Example 2:
        Input: [different example input]
        Output: [expected output]
        Explanation: [explanation if needed]
        
        ## Constraints
        - [constraint 1]
        - [constraint 2]
        - [any other constraints]
        
        ## Follow-up
        [Optional additional challenge or optimization]
      `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const questionText = response.text;
    
    // Extract title from the first line
    const title = questionText.split('\n')[0].replace('# ', '').trim();
    
    // Extract difficulty
    const difficultyMatch = questionText.match(/## Difficulty: (Easy|Medium|Hard)/);
    const difficulty = difficultyMatch ? difficultyMatch[1] : "Medium";

    // Generate test cases for this question
    const testCasesPrompt = `
      For the following coding problem:
      
      ${questionText}
      
      Generate 5 test cases in JSON format that can be used to validate solutions. Each test case should have:
      1. "input": A string representing the input that can be passed to the program
      2. "expectedOutput": A string representing the expected output
      3. "explanation": A brief explanation of what this test case is checking
      
      Format the response as valid JSON array only, with no additional text or markdown code blocks:
      [
        {
          "input": "...",
          "expectedOutput": "...",
          "explanation": "..."
        },
        ...
      ]
      
      Important: Return the raw JSON without any markdown formatting, code blocks, or backticks. Just the plain JSON array.
    `;

    const testCasesResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: testCasesPrompt,
    });
    
    let testCases = [];
    try {
      // Clean the response text - remove markdown code blocks if present
      let cleanedResponse = testCasesResponse.text;
      
      // Remove markdown code blocks if they exist
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Remove any other markdown formatting or extra text
      cleanedResponse = cleanedResponse.trim();
      
      // Try parsing the cleaned JSON
      testCases = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse test cases JSON:", error);
      console.error("Raw response:", testCasesResponse.text);
      // If parsing fails, create a basic structure
      testCases = [
        {
          "input": "See example 1 in problem statement",
          "expectedOutput": "See example 1 in problem statement",
          "explanation": "Basic test case"
        }
      ];
    }

    // Save the question to the database
    const newQuestion = new Question({
      title,
      difficulty,
      description: questionText,
      jobTitle,
      jobDescription,
      testCases
    });
    await newQuestion.save();

    res.json({ 
      title,
      difficulty,
      description: questionText,
      testCases
    });
  } catch (error) {
    console.error("Error generating question:", error);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

app.post("/code-execute", async (req, res) => {
  try {
    const { language, code, stdin } = req.body;

    // Judge0 language codes
    const languageMap = {
      javascript: 63,
      python: 71,
      java: 62,
      c: 50,
      cpp: 54,
    };

    if (!languageMap[language]) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // Send code to Judge0 API for execution
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions",
      {
        source_code: code,
        stdin: stdin || "",
        language_id: languageMap[language],
      },
      {
        headers: {
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    // Get submission token
    const { token } = response.data;

    // Poll Judge0 API to get execution results
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 1000; // 1 second

    const pollResult = async () => {
      try {
        const result = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        // If processing is complete or we've reached max attempts
        if (result.data.status.id !== 1 && result.data.status.id !== 2 || attempts >= maxAttempts) {
          return res.json({
            ...result.data,
            stdin: stdin // Return the input for reference
          });
        }

        // Increment attempts and try again
        attempts++;
        setTimeout(pollResult, pollInterval);
      } catch (error) {
        res.status(500).json({ error: "Error fetching execution result" });
      }
    };

    // Start polling
    setTimeout(pollResult, pollInterval);
  } catch (error) {
    console.error("Code execution error:", error);
    res.status(500).json({ error: "Execution failed" });
  }
});

app.post("/code-review", async (req, res) => {
  try {
    const { language, code, questionDescription } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required for review" });
    }

    const prompt = `
        You are an expert coding interviewer evaluating a candidate's solution. 
        
        Question: ${questionDescription || "A coding problem"}
        
        Review the following ${language} code for:
        1. **Correctness**: Does it solve the problem correctly?
        2. **Efficiency**: Analyze time and space complexity. Suggest optimizations.
        3. **Code Quality**: Is it clean, well-structured, and readable?
        4. **Edge Cases**: Does it handle edge cases properly?
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide feedback in this structured format:
        - **Overall Assessment**: (Strong Pass/Weak Pass/Fail)
        - **Correctness**: (Yes/Partially/No, with explanation)
        - **Time Complexity**: O(?) with explanation
        - **Space Complexity**: O(?) with explanation
        - **Code Quality**: Comments on readability and structure
        - **Strengths**: List key strengths
        - **Areas for Improvement**: List specific improvements
      `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const feedback = response.text;

    const review = new CodeReview({ language, code, feedback });
    await review.save();

    res.json({ feedback });
  } catch (error) {
    console.error("Error in AI review:", error);
    res.status(500).json({ error: "Failed to analyze code" });
  }
});

app.post("/run-test-cases", async (req, res) => {
  try {
    const { language, code, testCases } = req.body;

    if (!code || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({ error: "Code and test cases are required" });
    }

    // Judge0 language codes
    const languageMap = {
      javascript: 63,
      python: 71,
      java: 62,
      c: 50,
      cpp: 54,
    };

    if (!languageMap[language]) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const results = [];
    
    // Process each test case
    for (const testCase of testCases) {
      try {
        // Run the code with the test case input
        const response = await axios.post(
          "https://judge0-ce.p.rapidapi.com/submissions",
          {
            source_code: code,
            stdin: testCase.input,
            language_id: languageMap[language],
          },
          {
            headers: {
              "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              "Content-Type": "application/json",
            },
          }
        );

        // Get submission token
        const { token } = response.data;

        // Wait for execution to complete
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get the result
        const resultResponse = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        // Format the result
        const actualOutput = resultResponse.data.stdout ? resultResponse.data.stdout.trim() : "";
        const status = {
          id: resultResponse.data.status.id,
          description: resultResponse.data.status.description
        };
        
        // Check if the actual output matches the expected output
        let passed = false;
        if (status.id === 3) { // Accepted
          // Simple string comparison (you might need more sophisticated comparison depending on your problems)
          passed = actualOutput === testCase.expectedOutput.trim();
        }

        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput,
          status,
          passed,
          explanation: testCase.explanation
        });
      } catch (error) {
        console.error("Error processing test case:", error);
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: "Error executing test case",
          status: { id: -1, description: "Error" },
          passed: false,
          explanation: testCase.explanation
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error("Error running test cases:", error);
    res.status(500).json({ error: "Failed to run test cases" });
  }
});

app.get("/test-cases/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    res.json({ testCases: question.testCases });
  } catch (error) {
    console.error("Error fetching test cases:", error);
    res.status(500).json({ error: "Failed to fetch test cases" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));