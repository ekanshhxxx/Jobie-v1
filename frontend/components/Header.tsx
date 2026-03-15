"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = {
  search: string;
  setSearch: (value: string) => void;
};

export default function Header({ search, setSearch }: Props) {

  const router = useRouter();
  const pathname = usePathname();

  return (

    <div className="flex justify-between items-center mb-10">

      {/* Search Bar */}
      <div className="flex-1 max-w-md">

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs..."
          className="w-full border border-[#E5E7EB] px-4 py-2 rounded-lg bg-white text-[#111827] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />

      </div>

      {/* Post Job Button (only recruiter dashboard) */}

      {pathname === "/recruiter/dashboard" && (

        <button
          onClick={() => router.push("/recruiter/post-job")}
          className="ml-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg font-medium"
        >
          + Post Job
        </button>

      )}

    </div>

  );
}