import Image from "next/image";
import Link from "next/link";

export default function ServicesSection() {
  const features = [
    "AI-powered skill matching from your GitHub profile",
    "Resume parsing with smart role recommendations",
    "Real-time job alerts tailored to your skillset",
    "One-click applications with verified credentials",
  ];

  return (
    <section
      id="services"
      className="py-24 px-8 md:px-20 bg-linear-to-br from-[#EFF6FF] via-[#F5F8FF] to-white dark:from-[#060610] dark:via-[#0d0b1e] dark:to-[#060610] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-125 h-125 bg-blue-400/15 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
        {/* Left image */}
        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-linear-to-br from-[#2563EB]/20 to-[#7C3AED]/10 rounded-3xl blur-2xl" />
          <Image
            src="/amrit_job.png"
            alt="Our Services"
            width={480}
            height={480}
            className="relative rounded-3xl object-cover w-full shadow-2xl"
          />
          {/* Floating stat card */}
          <div className="absolute -bottom-6 -left-6 bg-white/55 dark:bg-white/6 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(37,99,235,0.14)] dark:shadow-[0_8px_32px_rgba(124,58,237,0.2)] px-6 py-4 border border-white/60 dark:border-white/10">
            <p className="text-3xl font-black text-[#2563EB]">97%</p>
            <p className="text-sm text-gray-500 mt-0.5">Satisfaction Rate</p>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1">
          <span className="inline-block bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
            Why Choose Jobie
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            We help you get hired by{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2563EB] to-[#7C3AED]">
              great companies
            </span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            Jobie connects talented individuals with top companies through verified
            skill scores and AI-driven matching. Whether it is your first job or your
            next big leap, we get you there faster.
          </p>

          {/* Feature list */}
          <ul className="space-y-4 mb-10">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center mt-0.5 shrink-0">
                  <svg className="w-3.5 h-3.5 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-600 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          {/* Stats row */}
          <div className="flex gap-10 pt-8 border-t border-gray-100 mb-10">
            <div>
              <p className="text-3xl font-black text-gray-900">86K+</p>
              <p className="text-sm text-gray-500">Jobs Created</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">81K+</p>
              <p className="text-sm text-gray-500">Employers Hired</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">97%</p>
              <p className="text-sm text-gray-500">Satisfaction</p>
            </div>
          </div>

          <Link
            href="/register"
            className="inline-block bg-[#2563EB] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#1D4ED8] transition shadow-lg shadow-indigo-200"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  );
}
