"use client";

import { useState } from "react";
import JobList from "./components/JobList";
import MockInterview from "./components/MockInterview";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { MoonIcon, SunIcon, ArrowLeftIcon } from "lucide-react";

function App() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [theme, setTheme] = useState("light");

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setShowMockInterview(false);
  };

  const handleStartMockInterview = () => {
    setShowMockInterview(true);
  };

  const handleBackToJobs = () => {
    setShowMockInterview(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeProvider defaultTheme={theme}>
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <header className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-md sticky top-0 z-10`}>
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {showMockInterview && (
                <button
                  onClick={handleBackToJobs}
                  className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"} transition-colors`}
                >
                  <ArrowLeftIcon className={`h-5 w-5 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`} />
                </button>
              )}
              <img src="/download.png" className="h-12" alt="logo" />
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700 text-yellow-300" : "bg-gray-100 text-gray-700"} transition-all hover:scale-105`}
            >
              {theme === "dark" ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {!showMockInterview ? (
            <div className="space-y-8">
              <div className={`${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                <h1 className="text-3xl font-bold mb-2">Find Your Next Role</h1>
                <p className="text-lg opacity-75">Select a job to see details and practice with a mock interview</p>
              </div>
              
              <JobList onSelectJob={handleJobSelect} selectedJob={selectedJob} theme={theme} />

              {selectedJob && (
                <div className={`mt-6 p-6 rounded-xl ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} shadow-lg transition-all duration-300 transform hover:shadow-xl`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {selectedJob.title}
                      </h2>
                      <p className={`text-lg ${theme === "dark" ? "text-blue-300" : "text-blue-600"}`}>{selectedJob.company}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                      {selectedJob.location}
                    </div>
                  </div>
                  
                  <div className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-700"} leading-relaxed max-h-80 overflow-y-auto pr-2 scrollbar-thin`}>
                    {selectedJob.description
                      .split("\n")
                      .map((paragraph, index) =>
                        paragraph ? (
                          <p key={index} className="mb-4">
                            {paragraph}
                          </p>
                        ) : null
                      )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleStartMockInterview}
                      className={`flex items-center gap-2 ${theme === "dark" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white font-medium py-3 px-6 rounded-lg transition-all hover:scale-105 hover:shadow-md`}
                    >
                      <span>Start Mock Interview</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <MockInterview job={selectedJob} onBack={handleBackToJobs} theme={theme} />
          )}
        </main>
        
        <footer className={`py-6 ${theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"} mt-auto`}>
          <div className="container mx-auto px-4 text-center text-sm">
            © {new Date().getFullYear()} Interview Prep Assistant. All rights reserved.
          </div>
        </footer>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;