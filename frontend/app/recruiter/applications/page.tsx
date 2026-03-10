"use client";

import { useEffect, useState } from "react";

export default function Applications() {

  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {

    try {

      const res = await fetch(
        "http://localhost:4000/api/applications"
      );

      const data = await res.json();

      setApplications(data);

    } catch (error) {
      console.log(error);
    }

  };

  // Status badge colors
  const getStatusColor = (status: string) => {

    if (status === "accepted")
      return "bg-[#10B981] text-white";

    if (status === "rejected")
      return "bg-[#EF4444] text-white";

    return "bg-[#F59E0B] text-white";
  };

  return (

    <div className="text-[#111827]">

      {/* Page Title */}

      <h1 className="text-3xl font-bold mb-8">
        Job Applications
      </h1>

      {/* Applications Table */}

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">

        <table className="w-full">

          <thead className="bg-[#F8FAFC] text-[#6B7280] border-b border-[#E5E7EB]">

            <tr>
              <th className="p-4 text-left">Candidate</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Job ID</th>
              <th className="p-4 text-left">Status</th>
            </tr>

          </thead>

          <tbody>

            {applications.length === 0 ? (

              <tr>

                <td
                  colSpan={4}
                  className="text-center py-8 text-[#6B7280]"
                >
                  No applications yet
                </td>

              </tr>

            ) : (

              applications.map((app) => (

                <tr
                  key={app.id}
                  className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC]"
                >

                  <td className="p-4 font-medium">
                    User {app.userId}
                  </td>

                  <td className="p-4 text-[#6B7280]">
                    user{app.userId}@email.com
                  </td>

                  <td className="p-4">
                    {app.jobId}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 text-sm rounded-full ${getStatusColor(app.status)}`}
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

    </div>

  );
}