"use client"

import { useEffect, useState } from "react"
import { currentUser } from "@/lib/user";

interface Application {
  id: number
  jobId: number
  status: string
}

export default function DashboardPage() {

  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    fetch("http://localhost:4000/api/applications/user/${currentUser.id}")
      .then((res) => res.json())
      .then((data) => setApplications(data))
  }, [])

  const pending = applications.filter(a => a.status === "pending").length
  const accepted = applications.filter(a => a.status === "accepted").length

  const getStatusColor = (status: string) => {
    if (status === "accepted") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    return "bg-yellow-100 text-yellow-700"
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10 text-slate-900">

      <div className="max-w-6xl mx-auto">

        {/* Page Title */}
        <h1 className="text-4xl font-semibold mb-8">
          Candidate Dashboard
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-10">

          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition">
            <h2 className="text-sm text-slate-500">
              Total Applications
            </h2>
            <p className="text-3xl font-bold mt-2">
              {applications.length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition">
            <h2 className="text-sm text-slate-500">
              Pending
            </h2>
            <p className="text-3xl font-bold mt-2">
              {pending}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition">
            <h2 className="text-sm text-slate-500">
              Accepted
            </h2>
            <p className="text-3xl font-bold mt-2">
              {accepted}
            </p>
          </div>

        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">
              My Applications
            </h2>
          </div>

          <table className="w-full">

            <thead className="text-left border-b bg-slate-50">

              <tr>
                <th className="p-4">Application ID</th>
                <th className="p-4">Job ID</th>
                <th className="p-4">Status</th>
              </tr>

            </thead>

            <tbody>

              {applications.map((app) => (

                <tr
                  key={app.id}
                  className="border-b hover:bg-slate-50 transition"
                >

                  <td className="p-4">
                    {app.id}
                  </td>

                  <td className="p-4">
                    {app.jobId}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(app.status)}`}
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