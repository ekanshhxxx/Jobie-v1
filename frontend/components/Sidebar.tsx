"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusSquare,
  Briefcase,
  FileText,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Post Job",
      icon: PlusSquare,
      path: "/post-job",
    },
    {
      name: "Manage Jobs",
      icon: Briefcase,
      path: "/manage-jobs",
    },
    {
      name: "Applications",
      icon: FileText,
      path: "/applications",
    },
  ];

  return (
    <div className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between bg-white border-r border-[#E5E7EB] p-6">

      {/* Logo */}

      <div>

        <h1 className="text-2xl font-bold text-[#2563EB] mb-10">
          Jobie
        </h1>

        {/* Menu */}

        <div className="flex flex-col gap-2">

          {menu.map((item) => {

            const Icon = item.icon;
            const active = pathname === item.path;

            return (

              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition

                  ${
                    active
                      ? "bg-blue-50 text-[#2563EB]"
                      : "text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#2563EB]"
                  }
                  
                `}
              >

                <Icon size={20} />

                {item.name}

              </button>

            );
          })}

        </div>

      </div>

      {/* Profile Section */}

      <div className="border-t border-[#E5E7EB] pt-4 flex items-center gap-3">

        <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-semibold">
          J
        </div>

        <div>

          <p className="text-[#111827] font-medium">
            John 
          </p>

          <p className="text-sm text-[#6B7280]">
            Recruiter
          </p>

        </div>

      </div>

    </div>
  );
}