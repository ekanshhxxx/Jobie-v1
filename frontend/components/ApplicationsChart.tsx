/* eslint-disable */
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api, getUser } from "../app/lib/api";

export default function ApplicationsChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const user = getUser();
      if (!user) return;
      const applications = await api.get(`/api/applications/recruiter/${user.id}`);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts: any = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

      applications.forEach((app: any) => {
        const date = new Date(app.createdAt);
        const day = days[date.getDay()];
        counts[day]++;
      });

      const chartData = days.map((day) => ({
        name: day,
        applications: counts[day],
      }));

      setData(chartData);
    } catch (error) {
      console.log(error);
      setData([]);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-[#111827] mb-4">Applications This Week</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="applications" stroke="#2563EB" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
