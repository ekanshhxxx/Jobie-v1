"use client";

import { useEffect, useState } from "react";
import StatsCard from "../../../components/StatsCard";
import JobTable from "../../../components/JobTable";
import ApplicationsChart from "../../../components/ApplicationsChart";
import Header from "../../../components/Header";

import { Briefcase, BarChart3, FileText, XCircle } from "lucide-react";

export default function Dashboard() {

  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // NEW FILTER STATE
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {

    try {

      setLoading(true);

      const res = await fetch(
        "http://localhost:4000/api/jobs/recruiter?recruiterId=1"
      );

      const data = await res.json();

      setJobs(data);

      setLoading(false);

    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  // Job Counts

  const totalJobs = jobs.length;

  const activeJobs = jobs.filter(
    (job) => job.status === "active"
  ).length;

  const draftJobs = jobs.filter(
    (job) => job.status === "draft"
  ).length;

  const closedJobs = jobs.filter(
    (job) => job.status === "closed"
  ).length;

  // SEARCH FILTER

  const searchFiltered = jobs.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company.toLowerCase().includes(search.toLowerCase()) ||
    job.location.toLowerCase().includes(search.toLowerCase())
  );

  // STATUS FILTER

  const filteredJobs = searchFiltered.filter((job) => {

    if (filter === "all") return true;

    return job.status === filter;

  });

  return (

    <div>

      {/* Header */}

      <Header search={search} setSearch={setSearch} />

      {/* Loading */}

      {loading ? (

        <div className="text-center py-20 text-[#6B7280] text-lg">
          Loading dashboard...
        </div>

      ) : (

        <>

        {/* Stats */}

        <div className="grid grid-cols-4 gap-6 mb-10">

          <StatsCard
            title="Total Jobs Posted"
            value={totalJobs}
            icon={<Briefcase size={20} />}
          />

          <StatsCard
            title="Active Jobs"
            value={activeJobs}
            icon={<BarChart3 size={20} />}
          />

          <StatsCard
            title="Draft Jobs"
            value={draftJobs}
            icon={<FileText size={20} />}
          />

          <StatsCard
            title="Closed Jobs"
            value={closedJobs}
            icon={<XCircle size={20} />}
          />

        </div>

        {/* STATUS FILTER TABS */}

        <div className="flex gap-4 mb-6">

          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border
              ${filter === "all"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-600 border-gray-200"}
            `}
          >
            All ({totalJobs})
          </button>

          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border
              ${filter === "active"
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-white text-gray-600 border-gray-200"}
            `}
          >
            Active ({activeJobs})
          </button>

          <button
            onClick={() => setFilter("draft")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border
              ${filter === "draft"
                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                : "bg-white text-gray-600 border-gray-200"}
            `}
          >
            Draft ({draftJobs})
          </button>

          <button
            onClick={() => setFilter("closed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border
              ${filter === "closed"
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-white text-gray-600 border-gray-200"}
            `}
          >
            Closed ({closedJobs})
          </button>

        </div>

        {/* Job Table */}

        <div className="mb-10">
          <JobTable jobs={filteredJobs} />
        </div>

        {/* Chart */}

        <ApplicationsChart />

        </>

      )}

    </div>
  );
}