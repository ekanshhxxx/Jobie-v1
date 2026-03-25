"use client"

import { useEffect, useState } from "react"
import { getJobs } from "../../../services/jobService"
import { Job } from "../../../types/Job"
import JobCard from "../../../components/JobCard"

export default function JobsPage() {

  const [jobs, setJobs] = useState<Job[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchJobs = async () => {

      try {

        const data = await getJobs()

        const safeArray = Array.isArray(data)
          ? data
          : data.jobs || []

        setJobs(safeArray)

      } catch (error) {

        console.error("Failed to fetch jobs:", error)
        setJobs([])

      } finally {

        setLoading(false)

      }

    }

    fetchJobs()

  }, [])

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 p-10 text-slate-900">

      <div className="max-w-6xl mx-auto">

        {/* Page Title */}
        <h1 className="text-4xl font-semibold mb-6">
          Available Jobs
        </h1>

        {/* Search */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg mb-8 flex gap-4">

          <input
            type="text"
            placeholder="Search jobs, skills, or companies"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-slate-200 rounded-md px-4 py-2"
          />

          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Search Jobs
          </button>

        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading jobs...
          </div>
        ) : (

          filteredJobs.length === 0 ? (
            <p>No jobs found</p>
          ) : (
            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )

        )}

      </div>

    </div>
  )
}