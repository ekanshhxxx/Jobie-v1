import Image from "next/image";
import React from "react";

export default function NewsletterSubscribe() {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between px-6 py-12 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-xl overflow-hidden relative">
      {/* Watery Effect Background */}
      <div className="absolute inset-0 bg-[url('/water-texture.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Left Side Image (Smaller) */}
      <div className="flex-1 md:flex-none md:w-1/3 mb-6 md:mb-0 md:mr-6 relative z-10">
        <Image
          src="/newsletter-image.jpg"
          alt="Subscribe Newsletter"
          width={400}
          height={250}
          className="rounded-lg object-cover w-full h-auto shadow-lg"
        />
      </div>

      {/* Right Side Content (Bigger) */}
      <div className="flex-1 md:w-2/3 text-white relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Get Notified for Daily Jobs
        </h2>
        <p className="mb-6 text-white text-opacity-90 text-lg md:text-xl">
          Enter your email below and never miss a job alert.
        </p>

        {/* Input + Button */}
        <form className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full sm:w-auto flex-grow px-4 py-2 rounded-full border border-white bg-transparent text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white text-base md:text-lg"
          />
          <button
            type="submit"
            className="bg-white text-[#2563EB] px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition duration-300 ease-in-out text-base md:text-lg shadow-md"
          >
            Get Notified
          </button>
        </form>
      </div>
    </section>
  );
}
