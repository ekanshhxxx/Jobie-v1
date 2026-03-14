"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Job } from "@/types/Job"
import { currentUser } from "@/lib/user";

export default function JobDetailsPage() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:4000/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
  }, [id])

  const applyToJob = async () => {
  try {
    setLoading(true)

    const response = await fetch(
      "http://localhost:4000/api/applications/apply",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          jobId: id,
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to apply")
    }

    const data = await response.json()

    alert("Application submitted!")
  } catch (error) {
    console.error(error)
    alert("Error applying for job")
  } finally {
    setLoading(false)
  }
}

  if (!job) return <p className="p-10">Loading...</p>

  return (
    <div className="min-h-screen bg-slate-50 p-10 text-slate-900">

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border border-slate-200">

        <h1 className="text-3xl font-bold">
          {job.title}
        </h1>

        <p className="text-slate-500 mt-2">
          {job.company}
        </p>

        <p className="mt-4">
          {job.description}
        </p>

        <p className="text-sm text-slate-500 mt-4">
          Location: {job.location}
        </p>

        <button
          onClick={applyToJob}
          disabled={loading}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          {loading ? "Applying..." : "Apply Now"}
        </button>

      </div>

    </div>
  )
}