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

      // 1️⃣ Get recruiter jobs
      const jobsRes = await fetch(
        `http://localhost:4000/api/jobs/recruiter?recruiterId=${user?.id}`
      );

      const jobsData = await jobsRes.json();

      const jobs = Array.isArray(jobsData)
        ? jobsData
        : jobsData.jobs || [];

      let allApplications: any[] = [];

      // 2️⃣ Get applications for each job
      for (const job of jobs) {

        const res = await fetch(
          `http://localhost:4000/api/applications/job/${job.id}`
        );

        const appsData = await res.json();

        const apps = Array.isArray(appsData)
          ? appsData
          : appsData.applications || [];

        // attach job title
        const appsWithJob = apps.map((app: any) => ({
          ...app,
          jobTitle: job.title
        }));

        allApplications = [...allApplications, ...appsWithJob];
      }

      setApplications(allApplications);

      setLoading(false);

    } catch (error) {

      console.log(error);
      setApplications([]);
      setLoading(false);

    }
  };

  const getStatusColor = (status: string) => {

    if (status === "accepted")
      return "bg-[#10B981] text-white";

    if (status === "rejected")
      return "bg-[#EF4444] text-white";

    return "bg-[#F59E0B] text-white";
  };

  return (

    <div className="text-[#111827]">

      <h1 className="text-3xl font-bold mb-8">
        Job Applications
      </h1>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">

        <table className="w-full">

          <thead className="bg-[#F8FAFC] text-[#6B7280] border-b border-[#E5E7EB]">

            <tr>
              <th className="p-4 text-left">Candidate</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Job Title</th>
              <th className="p-4 text-left">Status</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan={4} className="text-center py-8 text-[#6B7280]">
                  Loading applications...
                </td>
              </tr>

            ) : applications.length === 0 ? (

              <tr>
                <td colSpan={4} className="text-center py-8 text-[#6B7280]">
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
                    {app.jobTitle}
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