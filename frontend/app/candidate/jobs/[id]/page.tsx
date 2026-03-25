"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Job } from "@/types/Job"
import { getCurrentUser } from "@/lib/user"

export default function JobDetailsPage() {

  const user = getCurrentUser()
  const params = useParams()
  const id = params?.id

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {

    if (!id) return

    fetch(`http://localhost:4000/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch(() => setJob(null))

  }, [id])

  const applyToJob = async () => {

    try {

      if (!user?.id) {
        alert("You must be logged in to apply.")
        return
      }

      setLoading(true)

      const response = await fetch(
        "http://localhost:4000/api/applications/apply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            jobId: id,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to apply")
      }

      await response.json()

      alert("Application submitted!")

    } catch (error) {

      console.error(error)
      alert("Error applying for job")

    } finally {

      setLoading(false)

    }
  }

  if (!job) {
    return (
      <p className="p-10 text-slate-500">
        Loading job details...
      </p>
    )
  }

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
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Applying..." : "Apply Now"}
        </button>

      </div>

    </div>

  )
}