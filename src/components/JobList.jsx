"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Clock } from "lucide-react"
import { Input } from "./ui/input"
import { ThemeProvider } from "../components/theme-provider";
import axios from "axios"

// Predefined fallback jobs
const fallbackJobs = [
  {
    id: "fallback-1",
    title: "Senior Frontend Developer",
    company: "TechCorp Solutions",
    location: "Remote, USA",
    description: "We're looking for an experienced Frontend Developer with strong React skills to join our team. You'll be working on user-facing features, optimizing applications for maximum speed and scalability, and ensuring high-quality UI implementation.",
    logo: "/placeholder.svg?height=50&width=50",
    apply_link: "https://example.com/apply/senior-frontend",
    questions: []
  },
  {
    id: "fallback-2",
    title: "Full Stack Engineer",
    company: "Innovative Systems",
    location: "New York, NY",
    description: "Join our growing team as a Full Stack Engineer working with React, Node.js, and modern cloud infrastructure. You'll help build and maintain scalable applications that serve thousands of users daily.",
    logo: "/placeholder.svg?height=50&width=50",
    apply_link: "https://example.com/apply/fullstack",
    questions: []
  },
  {
    id: "fallback-3",
    title: "UI/UX Designer with Frontend Skills",
    company: "Creative Digital Agency",
    location: "Remote, Europe",
    description: "We're seeking a talented UI/UX Designer with coding abilities to create beautiful, intuitive interfaces for our clients. Ideal candidates have experience with design tools and can implement their designs using HTML, CSS, and React.",
    logo: "/placeholder.svg?height=50&width=50",
    apply_link: "https://example.com/apply/uiux-designer",
    questions: []
  }
];

const JobList = ({ onSelectJob, selectedJob, theme }) => {
  // Search parameters
  const [searchQuery, setSearchQuery] = useState("Frontend Developer")
  const [location, setLocation] = useState("Remote")
  const [yearsOfExperience, setYearsOfExperience] = useState("ALL")
  const [page, setPage] = useState(1)
  
  // UI states
  const [isSearching, setIsSearching] = useState(false)
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [salaryInfo, setSalaryInfo] = useState(null)
  const [usingFallbackData, setUsingFallbackData] = useState(false)

  // Filter states
  const [filterText, setFilterText] = useState("")

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true)
      setIsSearching(true)
      
      const response = await axios.get("https://ai-based-interview-questions-app.onrender.com/job-list", {
        params: {
          query: searchQuery,
          location: location,
          years_of_experience: yearsOfExperience,
          page: page
        }
      })
      
      // Process jobs data
      const fetchedJobs = response.data.jobs.data.map(job => ({
        id: job.job_id || job.employer_name + "-" + Math.random().toString(36).substr(2, 9),
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country || location,
        description: job.job_description || job.job_highlights?.Responsibilities?.join(" ") || "No description available",
        logo: job.employer_logo || "/placeholder.svg?height=50&width=50",
        apply_link: job.job_apply_link,
        questions: []
      }))
      
      // Store salary information if available
      if (response.data.estimated_salary) {
        setSalaryInfo(response.data.estimated_salary.data)
      }
      
      setJobs(fetchedJobs)
      setFilteredJobs(fetchedJobs)
      setUsingFallbackData(false)
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setError("Failed to load jobs from the server. Showing sample job listings instead.")
      
      // Use fallback jobs data
      setJobs(fallbackJobs)
      setFilteredJobs(fallbackJobs)
      setUsingFallbackData(true)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchJobs()
  }, []) // Empty dependency array means this effect runs once on mount

  // Apply text filter to jobs
  const handleFilter = (e) => {
    const term = e.target.value.toLowerCase()
    setFilterText(term)

    if (!term) {
      setFilteredJobs(jobs)
      return
    }

    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term)
    )

    setFilteredJobs(filtered)
  }

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  // Loading state
  if (loading && !isSearching) {
    return <div className="text-center py-10">Loading jobs...</div>
  }
  
  return (
    <ThemeProvider defaultTheme={theme}>
      <div>
      {/* Search form */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Find Your Next Job</h2>
        <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:flex md:gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Job title or keyword"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={usingFallbackData}
            />
          </div>
          
          <button
            type="submit"
            className="md:w-32 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSearching || usingFallbackData}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Salary information */}
      {salaryInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Estimated Salary Information</h3>
          <p>Median Annual Salary: ${salaryInfo[0].median_salary || "Not available"}</p>
          <p>Salary Range: ${salaryInfo[0].min_salary || "N/A"} - ${salaryInfo[0].max_salary || "N/A"}</p>
        </div>
      )}

      {/* Results filter */}
      <div className="mb-6">
        <h2 className={`${theme === "dark" ? "text-white" : "text-gray-800"} text-2xl font-bold mb-4`}>
          {usingFallbackData ? "Sample Jobs" : `Available Jobs ${jobs.length > 0 ? `(${jobs.length})` : ""}`}
        </h2>
        <div className={`${theme === "dark" ? "text-white" : "text-gray-800"} relative`}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Filter results..."
            className="pl-10"
            value={filterText}
            onChange={handleFilter}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg">
          {error}
        </div>
      )}

      {/* Job listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectJob(job)}
            >
              <div className="flex items-center mb-4">
                <div className="w-full">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-500 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <p>{job.location}</p>
              </div>
              <p className="text-gray-700 line-clamp-3">{job.description}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">
              {filterText 
                ? `No jobs found matching "${filterText}"` 
                : isSearching 
                  ? "Searching for jobs..." 
                  : "No jobs available with the current search criteria."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination - Only show if using real API data */}
      {jobs.length > 0 && !usingFallbackData && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => {
              if (page > 1) {
                setPage(page - 1);
                fetchJobs();
              }
            }}
            disabled={page === 1 || isSearching}
            className="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 mx-1 bg-blue-50 border border-blue-300 rounded-md">
            Page {page}
          </span>
          <button 
            onClick={() => {
              setPage(page + 1);
              fetchJobs();
            }}
            disabled={isSearching}
            className="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      
      {/* Retry button when using fallback data */}
      {usingFallbackData && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => {
              setError(null);
              fetchJobs();
            }}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry Connection
          </button>
        </div>
      )}
    </div></ThemeProvider>
  )
}

export default JobList