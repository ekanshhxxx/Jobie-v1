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

  useEffect(() => {
    fetch("http://localhost:4000/api/applications/user/1")
      .then((res) => res.json())
      .then((data) => setApplications(data))
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

        {/* Applications Table */}
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

              {applications.map((app) => (

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

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}