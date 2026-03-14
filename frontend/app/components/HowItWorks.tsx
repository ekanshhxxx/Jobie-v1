import { FaSearch, FaFileUpload, FaPaperPlane, FaClipboardCheck } from "react-icons/fa";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <FaClipboardCheck size={28} className="text-[#2563EB]" />,
      title: "Create Account",
      desc: "Sign up in seconds. Set up your profile to unlock personalised job recommendations right away.",
    },
    {
      number: "02",
      icon: <FaFileUpload size={28} className="text-[#2563EB]" />,
      title: "Upload Resume",
      desc: "Our AI instantly parses your resume, extracts your skills, and suggests the best-fit roles.",
    },
    {
      number: "03",
      icon: <FaSearch size={28} className="text-[#2563EB]" />,
      title: "Discover Jobs",
      desc: "Browse thousands of live opportunities curated and ranked specifically for your profile.",
    },
    {
      number: "04",
      icon: <FaPaperPlane size={28} className="text-[#2563EB]" />,
      title: "Apply & Get Hired",
      desc: "One-click applications with verified skill scores that stand out to top recruiters.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 px-8 md:px-20 bg-linear-to-b from-[#EFF6FF] via-[#F5F8FF] to-white dark:from-[#060610] dark:via-[#0d0b1e] dark:to-[#060610] relative overflow-hidden"
    >
      {/* Mesh blobs for glass effect */}
      <div className="absolute top-0 left-1/4 w-105 h-105 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-400/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-sky-300/12 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center mb-16">
        <span className="inline-block bg-[#2563EB]/10 dark:bg-violet-500/20 text-[#2563EB] dark:text-violet-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
          How It Works
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
          Four steps to your{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2563EB] to-[#7C3AED]">
            dream career
          </span>
        </h2>
      </div>

      <div className="relative z-10 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group relative bg-white/35 dark:bg-white/4 [backdrop-filter:blur(24px)_saturate(180%)] border border-white/60 dark:border-white/7 rounded-2xl p-8 shadow-[0_4px_28px_rgba(37,99,235,0.1)] dark:shadow-[0_4px_28px_rgba(124,58,237,0.08)] hover:shadow-[0_16px_48px_rgba(37,99,235,0.18)] dark:hover:shadow-[0_16px_48px_rgba(124,58,237,0.18)] hover:bg-white/50 dark:hover:bg-white/7 hover:border-[#2563EB]/25 dark:hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-2 text-center"
          >
            <span className="absolute top-4 right-5 text-5xl font-black text-gray-50 group-hover:text-[#2563EB]/10 transition-colors select-none">
              {step.number}
            </span>
            <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 shadow-[0_2px_12px_rgba(39,24,126,0.1)] flex items-center justify-center mx-auto mb-5 group-hover:bg-[#2563EB]/10 transition-colors">
              {step.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#2563EB] dark:group-hover:text-violet-400 transition-colors">
              {step.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
