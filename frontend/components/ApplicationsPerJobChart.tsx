"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function ApplicationsPerJobChart() {

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {

    try {

      const res = await fetch(
        "http://localhost:4000/api/jobs/recruiter?recruiterId=1"
      );

      const jobs = await res.json();

      const chartData = jobs.map((job:any) => ({
        name: job.title,
        applications: job.applicationsCount || 0
      }));

      setData(chartData);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl">

      <h2 className="text-lg font-semibold text-[#111827] mb-4">
        Applications Per Job
      </h2>

      <ResponsiveContainer width="100%" height={250}>

        <BarChart data={data}>

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="applications"
            fill="#76d3ed"
            radius={[4,4,0,0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}
