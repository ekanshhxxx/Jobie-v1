/* eslint-disable */
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api, getUser } from "../app/lib/api";

export default function ApplicationsPerJobChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const user = getUser();
      if (!user) return;

      const [jobs, applications] = await Promise.all([
        api.get(`/api/jobs/recruiter?recruiterId=${user.id}`),
        api.get(`/api/applications/recruiter/${user.id}`),
      ]);

      const counts = new Map<number, number>();
      applications.forEach((app: any) => {
        const jobId = Number(app.jobId || app.Job?.id);
        counts.set(jobId, (counts.get(jobId) || 0) + 1);
      });

      const chartData = jobs.map((job: any) => ({
        name: job.title,
        applications: counts.get(Number(job.id)) || 0,
      }));

      setData(chartData);
    } catch (error) {
      console.log(error);
      setData([]);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-[#111827] mb-4">Applications Per Job</h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="applications" fill="#76d3ed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
