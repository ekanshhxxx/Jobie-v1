"use client"

import Link from "next/link"
import { MessageCircle } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">

      {/* Logo */}
      <Link
        href="/candidate/jobs"
        className="text-3xl font-bold text-blue-600"
      >
        Jobie
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-8 text-slate-600 font-medium">

        <Link
          href="/candidate/jobs"
          className="hover:text-blue-600 transition-colors"
        >
          Find Jobs
        </Link>

        <Link
          href="/candidate/applications"
          className="hover:text-blue-600 transition-colors"
        >
          Applications
        </Link>

        <Link
          href="/candidate/resume-parser"
          className="hover:text-blue-600 transition-colors"
        >
          Resume Parser
        </Link>

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">

        {/* Message Icon */}
        <Link
          href="/candidate/messages"
          className="text-slate-600 hover:text-blue-600 transition"
        >
          <MessageCircle size={22} />
        </Link>

        {/* Profile */}
        <Link href="/candidate/dashboard">
          <div className="w-9 h-9 bg-slate-200 rounded-full hover:bg-slate-300 transition"></div>
        </Link>

      </div>

    </nav>
  )
}