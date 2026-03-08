import React from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-sky-100 text-gray-900 px-6 py-12 ">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Column 1: Brand Info */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-wide mb-4">
            <span className="text-gray-900">Job</span>
            <span className="text-[#2563EB]">ie</span>
          </h1>
          <p className="text-gray-700 text-sm leading-relaxed opacity-90">
            Jobie is your trusted career companion — helping job seekers connect 
            with opportunities and employers find the right talent. Discover jobs, 
            build your future, and grow with us.
          </p>
        </div>

        {/* Column 2: Company Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Company</h3>
          <ul className="space-y-2 text-gray-700 text-sm opacity-90">
            <li><a href="#" className="hover:text-black">Home</a></li>
            <li><a href="#" className="hover:text-black">About Us</a></li>
            <li><a href="#" className="hover:text-black">Browse Jobs</a></li>
            <li><a href="#" className="hover:text-black">Testimonial</a></li>
            <li><a href="#" className="hover:text-black">Contact</a></li>
          </ul>
        </div>

        {/* Column 3: Platform Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Platform</h3>
          <ul className="space-y-2 text-gray-700 text-sm opacity-90">
            <li><a href="#" className="hover:text-black">Why Jobie</a></li>
            <li><a href="#" className="hover:text-black">Job Seekers</a></li>
            <li><a href="#" className="hover:text-black">Customers</a></li>
            <li><a href="#" className="hover:text-black">Partners</a></li>
            <li><a href="#" className="hover:text-black">Job Alerts</a></li>
          </ul>
        </div>

        {/* Column 4: Social Media */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-white text-sky-600 p-2 rounded-full hover:bg-gray-200">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white text-sky-600 p-2 rounded-full hover:bg-gray-200">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-white text-sky-600 p-2 rounded-full hover:bg-gray-200">
              <FaLinkedinIn />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white text-sky-600 p-2 rounded-full hover:bg-gray-200">
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
