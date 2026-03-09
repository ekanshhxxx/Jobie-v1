"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { name: "Mon", applications: 4 },
  { name: "Tue", applications: 7 },
  { name: "Wed", applications: 3 },
  { name: "Thu", applications: 6 },
  { name: "Fri", applications: 9 },
  { name: "Sat", applications: 5 },
  { name: "Sun", applications: 8 }
];

export default function ApplicationsChart() {

  return (
    <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl">

      <h2 className="text-lg font-semibold text-[#111827] mb-4">
        Applications This Week
      </h2>

      <ResponsiveContainer width="100%" height={250}>

        <LineChart data={data}>

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="applications"
            stroke="#2563EB"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}