import Image from "next/image";

export default function ServicesSection() {
  return (
    <section className="flex flex-col md:flex-row items-center justify-center pt-8 pb-16 px-40 gap-0 bg-gray-50">

      {/* Left Side Image */}
      <div className="flex-1">
        <Image
  src="/services.png" // apna actual image path
  alt="Our Services"
  width={400}
  height={400}
  className="rounded-lg object-cover w-[400px] h-[400px] object-top"
/>

      </div>

      {/* Right Side Content */}
      <div className="flex-1 max-w-xl">
        <h2 className="text-4xl font-bold text-gray-800 leading-snug">
          Our Services Is To Help You To Get Hired By Great Company
        </h2>

        <p className="mt-6 text-gray-600">
          Find the perfect job that matches your skills and ambitions. 
Jobie connects talented individuals with top companies, making the hiring 
process simple, fast, and efficient. Whether you're looking for your first job 
or the next big step in your career, we help you discover opportunities that 
fit your goals and help you grow professionally.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div>
            <p className="text-2xl font-bold text-[#2563EB]">86K+</p>
            <p className="text-gray-600">Total Jobs Created</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#2563EB]">81K+</p>
            <p className="text-gray-600">Total Employers Hired</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#2563EB]">97%</p>
            <p className="text-gray-600">Company Satisfaction</p>
          </div>
        </div>

        {/* Button */}
        <button className="mt-10 bg-[#2563EB] text-white px-8 py-3 rounded-full hover:bg-[#1D4ED8]">
          Get Started
        </button>
      </div>
    </section>
  );
}
