"use client"

import { useEffect, useState } from "react"

interface Application {
  id: number
  jobId: number
  status: string
  createdAt: string
}

export default function ApplicationsPage() {

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/applications/user/1")
        const data = await res.json()

        // ✅ Ensure applications is always an array
        if (Array.isArray(data)) {
          setApplications(data)
        } else if (Array.isArray(data.applications)) {
          setApplications(data.applications)
        } else {
          setApplications([])
        }

      } catch (error) {
        console.error("Error fetching applications:", error)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const getStatusColor = (status: string) => {
    if (status === "accepted") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    return "bg-yellow-100 text-yellow-700"
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10 text-slate-900">

      <div className="max-w-6xl mx-auto">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-8">
          My Applications
        </h1>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading applications...
          </div>
        ) : (

          <div className="bg-white rounded-lg border border-slate-200">

            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                Jobs You've Applied To
              </h2>
            </div>

            <table className="w-full">

              <thead className="text-left border-b bg-slate-50">

                <tr>
                  <th className="p-4">Application ID</th>
                  <th className="p-4">Job ID</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4">Status</th>
                </tr>

              </thead>

              <tbody>

                {applications.length === 0 ? (

                  <tr>
                    <td colSpan={4} className="text-center p-10 text-gray-500">
                      No applications yet
                    </td>
                  </tr>

                ) : (

                  applications.map((app) => (

                    <tr key={app.id} className="border-b hover:bg-slate-50">

                      <td className="p-4">
                        {app.id}
                      </td>

                      <td className="p-4">
                        {app.jobId}
                      </td>

                      <td className="p-4">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}
                        >
                          {app.status}
                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  )
}