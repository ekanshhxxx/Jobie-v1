"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/user";

export default function Applications() {

  const user = getCurrentUser();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, []);

  const fetchApplications = async () => {
  try {

    setLoading(true);

    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:4000/api/applications/recruiter/${user?.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    console.log("Recruiter Applications:", data);

    setApplications(Array.isArray(data) ? data : data.applications || []);

    setLoading(false);

  } catch (error) {

    console.log(error);
    setApplications([]);
    setLoading(false);

  }
};

 const updateStatus = async (id:number,status:string) => {

  try {

    const token = localStorage.getItem("token");

    await fetch(`http://localhost:4000/api/applications/${id}`,{
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        Authorization: `Bearer ${token}`
      },
      body:JSON.stringify({status})
    });

    fetchApplications();

  } catch (error) {
    console.log(error);
  }

};

  const getStatusColor = (status: string) => {

    if (status === "shortlisted")
      return "bg-green-100 text-green-700";

    if (status === "rejected")
      return "bg-red-100 text-red-700";

    return "bg-yellow-100 text-yellow-700";
  };

  const getTimeAgo = (date:string) => {

    if(!date) return "-";

    const now = new Date();
    const applied = new Date(date);

    const diff = Math.floor(
      (now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return "Today";
    if (diff === 1) return "1 day ago";

    return `${diff} days ago`;
  };

  return (

    <div className="text-[#111827]">

      <h1 className="text-3xl font-bold mb-8">
        Job Applications
      </h1>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 overflow-x-auto">

        <table className="w-full">

          <thead className="bg-[#F8FAFC] text-[#6B7280] border-b border-[#E5E7EB]">

            <tr>
              <th className="p-4 text-left">Application ID</th>
              <th className="p-4 text-left">Candidate</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Job Title</th>
              <th className="p-4 text-left">Applied</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan={7} className="text-center py-8 text-[#6B7280]">
                  Loading applications...
                </td>
              </tr>

            ) : applications.length === 0 ? (

              <tr>
                <td colSpan={7} className="text-center py-8 text-[#6B7280]">
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
                    #{app.id}
                  </td>

                  <td className="p-4 font-medium">
                    {app.User?.name}
                  </td>

                  <td className="p-4 text-[#6B7280]">
                    {app.User?.email}
                  </td>

                  <td className="p-4">
                    {app.Job?.title}
                  </td>

                  <td className="p-4 text-sm text-gray-500">
                    {getTimeAgo(app.createdAt)}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 text-xs rounded-full ${getStatusColor(app.status)}`}
                    >
                      {app.status === "shortlisted" ? "Accepted" : app.status}
                    </span>

                  </td>

                  <td className="p-4">

                    <div className="flex justify-center gap-2">

                      {app.status === "applied" && (
                        <>
                          <button
                            onClick={()=>updateStatus(app.id,"shortlisted")}
                            className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-xs transition"
                          >
                            Accept
                          </button>

                          <button
                            onClick={()=>updateStatus(app.id,"rejected")}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {app.status === "shortlisted" && (
                        <span className="text-xs text-green-700 font-medium">
                          ✓ Accepted
                        </span>
                      )}

                      {app.status === "rejected" && (
                        <span className="text-xs text-red-700 font-medium">
                          ✕ Rejected
                        </span>
                      )}

                    </div>

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