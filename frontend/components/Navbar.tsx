"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/user";

export default function Navbar() {

  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <div className="w-full bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 px-10 py-4 flex justify-between items-center">

      {/* Left logo */}
      <h1 className="text-xl font-semibold text-blue-600">
        Jobie
      </h1>


      {/* Right user section */}
      <div className="flex items-center gap-4">

        {/* Dark toggle */}
        <button className="w-10 h-10 rounded-full border flex items-center justify-center">
          🌙
        </button>

        {/* Name */}
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {user?.name}
        </span>

        {/* Role */}
        <span className="bg-blue-100 text-blue-600 px-2 py-1 text-xs rounded-full">
          recruiter
        </span>

        {/* Logout */}
        <button
          onClick={() => router.push("/login")}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg"
        >
          Logout
        </button>

      </div>

    </div>
  );
}