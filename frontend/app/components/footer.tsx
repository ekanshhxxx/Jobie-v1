import React from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-950 text-white pt-16 pb-8 px-8 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block text-3xl font-extrabold tracking-wide mb-4">
              <span className="text-white">Job</span>
              <span className="text-[#60A5FA]">ie</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your AI-powered career companion. GitHub-verified skills, smart job matching, and real opportunities.
            </p>
            <div className="flex gap-3">
              {[
                { icon: <FaFacebookF size={14} />, href: "https://facebook.com" },
                { icon: <FaInstagram size={14} />, href: "https://instagram.com" },
                { icon: <FaLinkedinIn size={14} />, href: "https://linkedin.com" },
                { icon: <FaTwitter size={14} />, href: "https://twitter.com" },
                { icon: <FaGithub size={14} />, href: "https://github.com" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#2563EB] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-5">Company</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {["Home", "About Us", "Browse Jobs", "Testimonials", "Contact"].map((l) => (
                <li key={l}><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-5">Platform</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {["Why Jobie", "For Job Seekers", "For Recruiters", "Pricing", "Job Alerts"].map((l) => (
                <li key={l}><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-5">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>hello@jobie.app</li>
              <li>support@jobie.app</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/register"
                className="inline-block bg-[#2563EB] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1D4ED8] transition"
              >
                Start for Free &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 gap-4 text-sm text-gray-500">
          <p>&copy; 2026 Jobie. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
