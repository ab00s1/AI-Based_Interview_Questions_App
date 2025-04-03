"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Play,
  FileCheck2,
  Code,
  Settings,
  Terminal,
  BookOpen,
  Beaker,
  ChevronRight,
  GitBranch,
  MoveLeft,
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ReactMarkdown from "react-markdown";
import { useToast } from "./ui/use-toast";
import axios from "axios";
import QuestionPanel from "./QuestionPanel";

const MockInterview = ({ job, onBack, theme = "light" }) => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningTestCases, setIsRunningTestCases] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [testCaseResults, setTestCaseResults] = useState(null);
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState("problem");
  const [isMobileView, setIsMobileView] = useState(false);
  const [showProblemOnMobile, setShowProblemOnMobile] = useState(true);
  const { toast } = useToast();

  // Check if we're in mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    // Fetch question from backend when component mounts
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "http://localhost:5000/generate-question",
          {
            jobTitle: job.title,
            jobDescription: job.description,
          }
        );

        const questionData = {
          title: response.data.title || `${job.title} Coding Challenge`,
          difficulty: response.data.difficulty || "Medium",
          description: response.data.description,
          testCases: response.data.testCases || [],
        };

        setQuestion(questionData);
        setTestCases(questionData.testCases || []);

        // Set default starter code for each language
        const defaultCode = {
          javascript:
            "const fs = require('fs');\n" +
            "const input = fs.readFileSync('/dev/stdin', 'utf8').trim();\n",

          python: "import sys\n\n" + "input_data = sys.stdin.read().strip()\n",

          java:
            "import java.util.*;\n" +
            "import java.io.*;\n\n" +
            "public class Main {\n" +
            "    public static void main(String[] args) throws Exception {\n" +
            "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n" +
            "        String input = br.readLine();\n" +
            "    }\n" +
            "}",

          c:
            "#include <stdio.h>\n\n" +
            "int main() {\n" +
            "    char input[1000];\n" +
            "    fgets(input, sizeof(input), stdin);\n" +
            "    return 0;\n" +
            "}",

          cpp:
            "#include <iostream>\n" +
            "#include <string>\n\n" +
            "int main() {\n" +
            "    std::string input;\n" +
            "    std::getline(std::cin, input);\n" +
            "    return 0;\n" +
            "}",
        };

        setCode(defaultCode[selectedLanguage]);
      } catch (error) {
        console.error("Error fetching question:", error);
        toast({
          title: "Error",
          description: "Failed to generate question. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [job, toast]);

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);

    // Set appropriate starter code for the selected language
    const starterCode = {
      javascript:
        "const fs = require('fs');\n" +
        "const input = fs.readFileSync('/dev/stdin', 'utf8').trim();\n",

      python: "import sys\n\n" + "input_data = sys.stdin.read().strip()\n",

      java:
        "import java.util.*;\n" +
        "import java.io.*;\n\n" +
        "public class Main {\n" +
        "    public static void main(String[] args) throws Exception {\n" +
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n" +
        "        String input = br.readLine();\n" +
        "    }\n" +
        "}",

      c:
        "#include <stdio.h>\n\n" +
        "int main() {\n" +
        "    char input[1000];\n" +
        "    fgets(input, sizeof(input), stdin);\n" +
        "    return 0;\n" +
        "}",

      cpp:
        "#include <iostream>\n" +
        "#include <string>\n\n" +
        "int main() {\n" +
        "    std::string input;\n" +
        "    std::getline(std::cin, input);\n" +
        "    return 0;\n" +
        "}",
    };

    setCode(starterCode[language]);
    setResult(null);
    setExecutionResult(null);
    setTestCaseResults(null);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleCustomInputChange = (e) => {
    setCustomInput(e.target.value);
  };

  const handleToggleMobileView = () => {
    setShowProblemOnMobile(!showProblemOnMobile);
  };

  const handleExecute = async () => {
    try {
      setExecutionResult(null);

      const response = await axios.post("http://localhost:5000/code-execute", {
        language: selectedLanguage,
        code: code,
        stdin: customInput,
      });

      setExecutionResult(response.data);

      toast({
        title: "Code Executed",
        description: "Your code has been executed with custom input.",
      });
    } catch (error) {
      console.error("Error executing code:", error);
      toast({
        title: "Execution Error",
        description: "Failed to execute code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRunTestCases = async () => {
    try {
      setIsRunningTestCases(true);
      setTestCaseResults(null);

      const response = await axios.post(
        "http://localhost:5000/run-test-cases",
        {
          language: selectedLanguage,
          code: code,
          testCases: testCases,
        }
      );

      setTestCaseResults(response.data.results);

      // Check if all test cases passed
      const allPassed = response.data.results.every((result) => result.passed);

      toast({
        title: allPassed ? "All Test Cases Passed!" : "Some Tests Failed",
        description: allPassed
          ? "Your solution passed all the test cases!"
          : "Check the results tab for details.",
        variant: allPassed ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error running test cases:", error);
      toast({
        title: "Test Execution Error",
        description: "Failed to run test cases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunningTestCases(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // First run all test cases
      await handleRunTestCases();

      // Then get code review
      const response = await axios.post("http://localhost:5000/code-review", {
        language: selectedLanguage,
        code: code,
        questionDescription: question.description,
      });

      // Get AI feedback
      const feedback = response.data.feedback;

      // Update result with feedback
      setResult({
        feedback: feedback,
        suggestions: feedback
          .split("\n")
          .filter(
            (line) => line.trim().startsWith("-") || line.trim().startsWith("*")
          )
          .map((line) => line.replace(/^[-*]\s*/, "").trim())
          .filter((line) => line.length > 0),
      });

      // Switch to results tab to show the user their submission results
      setActiveTab("results");

      // On mobile, show the results panel
      if (isMobileView) {
        setShowProblemOnMobile(false);
      }
    } catch (error) {
      console.error("Error submitting code:", error);
      toast({
        title: "Error",
        description: "Failed to submit code for review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = () => {
    switch (question?.difficulty.toLowerCase()) {
      case "easy":
        return theme === "dark"
          ? "bg-green-700 text-green-100"
          : "bg-green-100 text-green-800";
      case "medium":
        return theme === "dark"
          ? "bg-yellow-700 text-yellow-100"
          : "bg-yellow-100 text-yellow-800";
      case "hard":
        return theme === "dark"
          ? "bg-red-700 text-red-100"
          : "bg-red-100 text-red-800";
      default:
        return theme === "dark"
          ? "bg-blue-700 text-blue-100"
          : "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-64 ${
          theme === "dark" ? "text-gray-200" : "text-gray-800"
        }`}
      >
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
              theme === "dark" ? "border-blue-400" : "border-blue-600"
            } mx-auto`}
          ></div>
          <p className="mt-4 font-medium">Generating interview question...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex items-center mb-6 gap-2">
        <h2 className="text-xl font-semibold truncate">
          Interview: {job.title} at {job.company}
        </h2>
      </div>

      <div
        className={`rounded-xl shadow-lg overflow-hidden border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
            theme === "dark"
              ? "bg-gray-700 border-b border-gray-600"
              : "bg-gray-50 border-b border-gray-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-medium text-lg">{question?.title}</span>
            <span
              className={`px-3 py-1 text-xs rounded-full inline-flex items-center ${getDifficultyColor()}`}
            >
              {question?.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span
              className={`text-sm ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Language:
            </span>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`border rounded px-3 py-1.5 text-sm flex-grow sm:flex-grow-0 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        {/* Mobile View Toggle */}
        {isMobileView && (
          <div
            className={`p-2 ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Button
              onClick={handleToggleMobileView}
              variant="outline"
              size="sm"
              className={`w-full flex items-center justify-center ${
                theme === "dark"
                  ? "bg-gray-800 text-gray-200 border-gray-600"
                  : "bg-white text-gray-700"
              }`}
            >
              {showProblemOnMobile ? (
                <>
                  <Code className="h-4 w-4 mr-2" />
                  <span>Show Code Editor</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span>Show Problem</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Main Content Area - Responsive Layout */}
        <div className="flex flex-col md:flex-row h-[calc(100vh-250px)]">
          {/* Problem Panel - Hidden on mobile when showing code editor */}
          {(!isMobileView || showProblemOnMobile) && (
            <div className="w-full md:w-1/2 overflow-auto flex flex-col">
              <Tabs
                defaultValue="problem"
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col h-full"
              >
                <TabsList
                  className={`grid grid-cols-3 rounded-none ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <TabsTrigger
                    value="problem"
                    className={`flex items-center ${
                      theme === "dark" ? "data-[state=active]:bg-gray-600" : ""
                    }`}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Problem
                  </TabsTrigger>
                  <TabsTrigger
                    value="testcases"
                    className={`flex items-center ${
                      theme === "dark" ? "data-[state=active]:bg-gray-600" : ""
                    }`}
                  >
                    <Beaker className="h-4 w-4 mr-2" />
                    Tests
                  </TabsTrigger>
                  <TabsTrigger
                    value="results"
                    className={`flex items-center ${
                      theme === "dark" ? "data-[state=active]:bg-gray-600" : ""
                    }`}
                  >
                    <FileCheck2 className="h-4 w-4 mr-2" />
                    Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="problem"
                  className={`p-4 overflow-auto flex-grow ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <QuestionPanel question={question} theme={theme} />
                </TabsContent>

                <TabsContent
                  value="testcases"
                  className={`p-4 overflow-auto flex-grow ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div>
                    <h3 className="font-medium text-lg mb-4">Test Cases</h3>
                    {testCases.length > 0 ? (
                      <div className="space-y-4">
                        {testCases.map((testCase, index) => (
                          <div
                            key={index}
                            className={`border rounded-md p-3 ${
                              theme === "dark"
                                ? "bg-gray-700 border-gray-600"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">
                                Test Case {index + 1}
                              </h4>
                              <GitBranch
                                className={`h-4 w-4 ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              />
                            </div>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-medium">Input:</span>
                                <pre
                                  className={`p-2 rounded mt-1 overflow-auto font-mono text-xs ${
                                    theme === "dark"
                                      ? "bg-gray-800"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {testCase.input}
                                </pre>
                              </div>
                              <div>
                                <span className="font-medium">
                                  Expected Output:
                                </span>
                                <pre
                                  className={`p-2 rounded mt-1 overflow-auto font-mono text-xs ${
                                    theme === "dark"
                                      ? "bg-gray-800"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {testCase.expectedOutput}
                                </pre>
                              </div>
                              <div>
                                <span className="font-medium">
                                  Explanation:
                                </span>
                                <p
                                  className={`mt-1 ${
                                    theme === "dark"
                                      ? "text-gray-300"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {testCase.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className={
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }
                      >
                        No test cases available for this problem.
                      </p>
                    )}

                    <div className="mt-6">
                      <Button
                        onClick={handleRunTestCases}
                        disabled={isRunningTestCases}
                        className={`${
                          theme === "dark"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                      >
                        {isRunningTestCases ? (
                          <>
                            <div
                              className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                                theme === "dark"
                                  ? "border-white"
                                  : "border-blue-800"
                              } mr-2`}
                            ></div>
                            Running Tests...
                          </>
                        ) : (
                          <>
                            <FileCheck2 className="h-4 w-4 mr-2" />
                            Run All Tests
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="results"
                  className={`p-4 overflow-auto flex-grow ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  {testCaseResults ? (
                    <div className="mb-6">
                      <h3 className="font-medium text-lg mb-3">Test Results</h3>
                      <div className="space-y-3">
                        {testCaseResults.map((result, index) => (
                          <div
                            key={index}
                            className={`border rounded-md p-3 ${
                              result.passed
                                ? theme === "dark"
                                  ? "bg-green-900/20 border-green-800"
                                  : "bg-green-50 border-green-200"
                                : theme === "dark"
                                ? "bg-red-900/20 border-red-800"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium flex items-center">
                                {result.passed ? (
                                  <Check
                                    className={`h-4 w-4 ${
                                      theme === "dark"
                                        ? "text-green-400"
                                        : "text-green-500"
                                    } mr-2`}
                                  />
                                ) : (
                                  <AlertCircle
                                    className={`h-4 w-4 ${
                                      theme === "dark"
                                        ? "text-red-400"
                                        : "text-red-500"
                                    } mr-2`}
                                  />
                                )}
                                Test Case {index + 1}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  result.passed
                                    ? theme === "dark"
                                      ? "bg-green-900 text-green-300"
                                      : "bg-green-100 text-green-800"
                                    : theme === "dark"
                                    ? "bg-red-900 text-red-300"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {result.passed
                                  ? "Passed"
                                  : result.status.description || "Failed"}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-1 gap-3 text-sm">
                              <div>
                                <span className="font-medium">Input:</span>
                                <pre
                                  className={`p-2 rounded mt-1 overflow-auto font-mono text-xs ${
                                    theme === "dark"
                                      ? "bg-gray-900"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {result.input}
                                </pre>
                              </div>
                              <div>
                                <span className="font-medium">
                                  Expected Output:
                                </span>
                                <pre
                                  className={`p-2 rounded mt-1 overflow-auto font-mono text-xs ${
                                    theme === "dark"
                                      ? "bg-gray-900"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {result.expectedOutput}
                                </pre>
                              </div>
                              <div>
                                <span className="font-medium">
                                  Your Output:
                                </span>
                                <pre
                                  className={`p-2 rounded mt-1 overflow-auto font-mono text-xs ${
                                    theme === "dark"
                                      ? "bg-gray-900"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {result.actualOutput}
                                </pre>
                              </div>
                              {!result.passed && result.status.id === 3 && (
                                <div
                                  className={
                                    theme === "dark"
                                      ? "text-red-400"
                                      : "text-red-600"
                                  }
                                >
                                  <span className="font-medium">Error:</span>{" "}
                                  Output doesn't match expected result
                                </div>
                              )}
                              {result.status.id !== 3 && (
                                <div
                                  className={`${
                                    result.status.id === 3
                                      ? theme === "dark"
                                        ? "text-green-400"
                                        : "text-green-600"
                                      : theme === "dark"
                                      ? "text-red-400"
                                      : "text-red-600"
                                  }`}
                                >
                                  <span className="font-medium">Status:</span>{" "}
                                  {result.status.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {result && (
                    <div className="mt-4">
                      <h3 className="font-medium text-lg mb-3">Code Review</h3>
                      <div
                        className={`border rounded-md p-4 ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div
                          className={
                            theme === "dark"
                              ? "text-gray-200 prose-headings:text-gray-100 prose-code:bg-gray-800"
                              : ""
                          }
                        >
                          <ReactMarkdown>{result.feedback}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {!testCaseResults && !result && (
                    <div
                      className={`flex flex-col items-center justify-center h-64 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <FileCheck2 className="h-12 w-12 mb-4 opacity-20" />
                      <p>
                        Run your code or submit your solution to see results
                        here.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Code Editor Panel - Hidden on mobile when showing problem */}
          {(!isMobileView || !showProblemOnMobile) && (
            <div className="h-full w-full md:w-1/2 flex flex-col border-l border-gray-200 dark:border-gray-700">
                <CodeEditor
                  language={selectedLanguage}
                  value={code}
                  onChange={handleCodeChange}
                  theme={theme}
                />

              <div
                className={`p-4 ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                } border-t ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <div className="mb-4">
                  <h3
                    className={`text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <Terminal className="h-4 w-4 inline mr-2" />
                    Custom Input
                  </h3>
                  <textarea
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Enter custom input here..."
                    className={`w-full border rounded-md p-2 h-20 text-sm font-mono ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-800"
                    }`}
                  ></textarea>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleExecute}
                    className={`${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500 hover:bg-blue-600"
                    } text-white`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Code
                  </Button>
                  <Button
                    onClick={handleRunTestCases}
                    disabled={isRunningTestCases}
                    className={`${
                      theme === "dark"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-amber-500 hover:bg-amber-600"
                    } text-white`}
                  >
                    <FileCheck2 className="h-4 w-4 mr-2" />
                    Run Tests
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex-1 ${
                      theme === "dark"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Submit Solution
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Execution Results */}
              {executionResult && (
                <div className="mt-auto p-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Execution Output</h3>
                  <div className="bg-black rounded-md text-white p-3 overflow-auto max-h-40">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {executionResult.stdout ||
                        executionResult.stderr ||
                        "No output"}
                    </pre>
                  </div>
                  {executionResult.status && (
                    <div
                      className={`mt-2 text-sm ${
                        executionResult.status.id === 3
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Status: {executionResult.status.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockInterview;