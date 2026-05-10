// @ts-nocheck
"use client"

import Link from "next/link"
import { Job } from "../types/Job"

export default function JobCard({ job }: { job: Job }) {

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex justify-between items-center hover:shadow-lg transition">

      <div>

        <h2 className="text-lg font-semibold">
          {job.title}
        </h2>

        <p className="text-slate-600 mt-1">
          {job.company}
        </p>

        <p className="text-slate-500 text-sm mt-2">
          {job.description}
        </p>

        <p className="text-slate-500 text-sm mt-2">
          📍 {job.location}
        </p>

      </div>

      <Link
        href={`/candidate/jobs/${job.id}`}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        View Job
      </Link>

    </div>
  )
}


