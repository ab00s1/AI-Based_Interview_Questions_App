# AI Mock Interview

A sophisticated web application that helps job seekers prepare for technical interviews through AI-generated coding challenges tailored to specific job descriptions.

## Live Demo

- **Frontend**: [https://ai-based-interview-questions-app-1.onrender.com](https://ai-based-interview-questions-app-1.onrender.com)
- **Backend**: [https://ai-based-interview-questions-app.onrender.com](https://ai-based-interview-questions-app.onrender.com)

## Features

- **Job Listings**: Browse and select from various job positions
- **AI-Generated Questions**: Get unique coding challenges based on the selected job description
- **Interactive Code Editor**: Write and test your solutions in multiple programming languages
- **Real-time Code Execution**: Run your code against test cases
- **Dark/Light Theme**: Choose your preferred visual theme
- **Responsive Design**: Works seamlessly on both desktop and mobile devices

## Technology Stack

### Frontend
- React.js
- Tailwind CSS
- Lucide Icons
- React Markdown

### Backend
- Node.js
- Express
- MongoDB
- Google Gemini AI API
- JSearch API (for job listings)

## How It Works

1. Select a job from the available listings
2. The system generates a relevant coding challenge for that position
3. Use the integrated code editor to solve the problem
4. Test your solution with custom inputs or pre-defined test cases
5. Get immediate feedback on your code

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- API keys for Google Gemini AI and JSearch

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-mock-interview.git
cd ai-mock-interview
```

2. Install dependencies
```bash
npm install
cd server
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with:
```
GENAI_API_KEY=your_google_ai_key
JSEARCH_API_KEY=your_jsearch_api_key
MONGODB_URI=your_mongodb_connection_string
```

4. Start the development server
```bash
# Start backend
cd server
npm start

# Start frontend (in a new terminal)
cd ..
npm run dev
```


## Acknowledgments

- Google Gemini AI for powering the question generation
- RapidAPI for job data
- The MERN stack community for resources and inspiration
