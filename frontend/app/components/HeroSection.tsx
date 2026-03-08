import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="min-h-screen">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-20 py-6">
        <h1 className="text-3xl font-extrabold tracking-wide">
          <span className="text-gray-900">Job</span>
          <span className="text-[#2563EB]">ie</span>
        </h1>

        <div className="hidden md:flex space-x-8 text-gray-600">
          <a href="#" className="text-[#2563EB] font-medium">Home</a>
          <a href="#">How it Works</a>
          <a href="#">About Us</a>
          <a href="#">Contact Us</a>
        </div>

        <div className="space-x-6">
          <button className="text-gray-700 hover:text-[#2563EB]">Log in</button>
          <button className="bg-[#2563EB] text-white px-5 py-2 rounded-full hover:bg-[#1D4ED8]">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
            <section className="flex items-center justify-between px-20 pt-0 pb-0 gap-12">




        {/* Left Text */}
        <div className="max-w-xl ml-10">
          <h1 className="text-[42px] font-bold leading-tight text-gray-800">
            Find Your <span className="text-[#2563EB]">Dream Job</span>
            <br />
            With Your Interest
            <br />
            And Skills
          </h1>

          <p className="mt-6 text-gray-600">
            Discover thousands of opportunities that match your skills
            and interests. Start your career journey today.
          </p>

          <div className="flex items-center mt-8 space-x-6">
            <button className="bg-[#2563EB] text-white px-6 py-3 rounded-full hover:bg-[#1D4ED8]">
              Browse Jobs
            </button>
            <p className="text-gray-600">
              <span className="font-semibold text-gray-800">20k+</span> daily active users
            </p>
          </div>
        </div>

        {/* Right Image with card */}
        <div className="relative w-full h-[650px]">
  <Image
    src="/hero.png"
    alt="hero"
    fill
    className="object-cover object-top"
  />

          {/* Floating Card */}
          <div className="absolute top-8 left-[350px] bg-white shadow-xl px-8 py-4 rounded-lg border z-10">
            <p className="text-sm font-semibold text-gray-900">250+ Jobs</p>
            <p className="text-gray-500 text-sm">Post Daily</p>
          </div>
        </div>
      </section>
    </div>
  );
}
