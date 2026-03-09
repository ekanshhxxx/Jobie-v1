"use client"

import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">

      {/* Logo */}
      <Link href="/jobs" className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
        <span className="text-xl font-semibold text-slate-900">
          Jobie
        </span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-8 text-slate-600 font-medium">

        <Link
          href="/jobs"
          className="hover:text-blue-600 transition-colors duration-200"
        >
          Find Jobs
        </Link>

        <Link
          href="/companies"
          className="hover:text-blue-600 transition-colors duration-200"
        >
          Companies
        </Link>

        <Link
          href="/applications"
          className="hover:text-blue-600 transition-colors duration-200"
        >
          Applications
        </Link>

        <Link
          href="/messages"
          className="hover:text-blue-600 transition-colors duration-200"
        >
          Messages
        </Link>

        <Link
          href="/resume-parser"
          className="hover:text-blue-600 transition-colors duration-200"
        >
          Resume Parser
        </Link>

      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">

        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
          Post a Job
        </button>

        {/* Profile Avatar */}
        <Link href="/dashboard">
          <div className="w-9 h-9 bg-slate-200 rounded-full cursor-pointer hover:bg-slate-300 transition duration-200"></div>
        </Link>

      </div>

    </nav>
  )
}