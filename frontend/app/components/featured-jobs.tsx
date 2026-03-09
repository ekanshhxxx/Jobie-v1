import Image from "next/image";
import Link from "next/link";

export default function FeaturedJobs() {
  const jobs = [
    { company: "Spotify", location: "New York, USA", title: "Product Designer", type: "Full-time", salary: "$50k-90k", logo: "/spotify-logo.png", color: "bg-green-50" },
    { company: "Stripe", location: "London, UK", title: "Sr. UI Designer", type: "Remote", salary: "$60k-100k", logo: "/stripe-logo.png", color: "bg-purple-50" },
    { company: "Slack", location: "New York, USA", title: "Visual Designer", type: "Hybrid", salary: "$55k-85k", logo: "/slack-logo.png", color: "bg-pink-50" },
    { company: "Airbnb", location: "Mumbai, India", title: "Expert Developer", type: "Full-time", salary: "$70k-110k", logo: "/airbnb-logo.png", color: "bg-red-50" },
    { company: "WhatsApp", location: "New York, USA", title: "Lead UX Designer", type: "Remote", salary: "$80k-120k", logo: "/whatsapp-logo.jpg", color: "bg-emerald-50" },
    { company: "Booking.com", location: "Dubai, UAE", title: "Product Designer", type: "Full-time", salary: "$65k-95k", logo: "/booking-logo.png", color: "bg-blue-50" },
  ];

  const typeColor: Record<string, string> = {
    "Full-time": "bg-blue-50 text-blue-700",
    "Remote": "bg-green-50 text-green-700",
    "Hybrid": "bg-orange-50 text-orange-700",
  };

  return (
    <section className="py-24 px-8 md:px-20 bg-white dark:bg-[#0d0b1e] relative overflow-hidden">
      {/* Mesh blobs */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-blue-300/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="text-center mb-14">
        <span className="inline-block bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
          Featured Opportunities
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Jobs you will{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2563EB] to-[#7C3AED]">love</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Hand-picked roles from world-class companies, matched to your skills and ambitions.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex justify-center flex-wrap gap-3 mb-12">
        {["All", "Design", "Engineering", "Marketing", "Management"].map((cat) => (
          <button
            key={cat}
            className={`px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${cat === "All" ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-indigo-200" : "border-gray-200 text-gray-600 hover:border-[#2563EB] hover:text-[#2563EB]"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job, index) => (
          <div
            key={index}
            className="group relative bg-white/40 dark:bg-white/4 [backdrop-filter:blur(20px)_saturate(160%)] border border-white/65 dark:border-white/7 rounded-2xl p-6 shadow-[0_4px_20px_rgba(37,99,235,0.08)] dark:shadow-[0_4px_20px_rgba(124,58,237,0.07)] hover:shadow-[0_14px_40px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_14px_40px_rgba(124,58,237,0.18)] hover:bg-white/55 dark:hover:bg-white/7 hover:border-[#2563EB]/25 dark:hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl ${job.color} flex items-center justify-center p-2 shrink-0`}>
                <Image src={job.logo} alt={job.company} width={40} height={40} className="object-contain rounded" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-violet-400 transition-colors">{job.title}</h3>
                <p className="text-sm text-gray-500">{job.company} &bull; {job.location}</p>
              </div>
            </div>

            {/* Tags row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColor[job.type] || "bg-gray-100 text-gray-600"}`}>
                {job.type}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                {job.salary}
              </span>
            </div>

            <div className="mt-auto">
              <Link
                href="/jobs"
                className="block w-full text-center bg-gray-50 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#2563EB] hover:text-white transition-all duration-200 border border-gray-100 hover:border-[#2563EB] hover:shadow-md hover:shadow-indigo-100"
              >
                Apply Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-[#2563EB] font-semibold hover:underline">
          Browse all jobs <span>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
