import { FaSearch, FaFileUpload, FaPaperPlane, FaClipboardCheck } from "react-icons/fa";

export default function HowItWorks() {
  const steps = [
    {
      icon: <FaClipboardCheck size={42} className="text-[#2563EB] transition duration-300 group-hover:text-[#1E40AF]" />,
      title: "Create Account",
      desc: "Sign up quickly and easily to start your journey toward landing your dream job.",
    },
    {
      icon: <FaFileUpload size={42} className="text-[#2563EB] transition duration-300 group-hover:text-[#1E40AF]" />,
      title: "Upload Your Resume",
      desc: "Showcase your skills and experience by uploading your resume to our platform.",
    },
    {
      icon: <FaSearch size={42} className="text-[#2563EB] transition duration-300 group-hover:text-[#1E40AF]" />,
      title: "Search Job",
      desc: "Browse thousands of opportunities tailored to your profile and preferences.",
    },
    {
      icon: <FaPaperPlane size={42} className="text-[#2563EB] transition duration-300 group-hover:text-[#1E40AF]" />,
      title: "Apply Your Dream Job",
      desc: "Submit your application and take the next step toward your career goals.",
    },
  ];

  return (
    <section className="pt-8 py-20 px-8 md:px-16 bg-white">
      {/* Smaller heading */}
      <h2 className="text-lg md:text-xl font-semibold text-center text-gray-500 mb-3">
        HOW IT WORKS
      </h2>

      {/* Bigger, colored, two-line subheading */}
      <p className="text-center text-[#1E3A8A] text-2xl md:text-4xl font-extrabold leading-snug mb-14">
        Easy Steps To Get Your <br /> Dream Job With Our Platform
      </p>

      {/* Steps Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group bg-white p-8 rounded-xl shadow-md transition duration-500 transform hover:shadow-2xl hover:-translate-y-3 hover:scale-105 hover:bg-gray-100 text-center"
          >
            <div className="flex justify-center mb-5">{step.icon}</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 group-hover:text-[#2563EB] transition duration-300">
              {step.title}
            </h3>
            <p className="text-gray-600 text-sm md:text-base group-hover:text-gray-900 transition duration-300">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
