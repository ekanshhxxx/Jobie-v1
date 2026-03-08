import Image from "next/image";
import React from "react";

export default function ArticlesSection() {
  const articles = [
    {
      img: "/article1.jpg",
      date: "10 Feb, 2026",
      title: "Top Strategies for Social Media Growth",
      desc: "Learn how to boost engagement, grow followers, and build authentic communities with proven social media tactics.",
    },
    {
      img: "/article2.jpeg",
      date: "15 Feb, 2026",
      title: "Mastering Remote Work Productivity",
      desc: "Discover tools, habits, and techniques to stay productive and balanced while working from anywhere in the world.",
    },
    {
      img: "/article3.webp",
      date: "20 Feb, 2026",
      title: "Web Design Trends That Pay Well",
      desc: "Explore the latest design practices and development skills that employers value most in high‑paying tech roles.",
    },
  ];

  return (
    <section className="px-6 py-10 bg-white">
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
        Read Our Articles That Will Help You To Secure A Great Job
      </h2>
      <p className="text-center text-gray-700 max-w-2xl mx-auto mb-10">
        Stay updated with industry insights, career tips, and expert guidance to boost your professional journey.
      </p>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <div
            key={index}
            className="border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-2 bg-gray-50 flex flex-col"
          >
            {/* Thumbnail */}
            <Image
              src={article.img}
              alt={article.title}
              width={400}
              height={250}
              className="w-full h-55 object-cover"
            />

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
              <span className="text-sm text-gray-600 mb-2">{article.date}</span>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-gray-800 mb-4">{article.desc}</p>

              {/* Read More Button (Smaller) */}
              <div className="mt-auto">
                <button className="bg-[#2563EB] text-white px-3 py-1 text-xs rounded-full font-medium shadow-sm transition duration-300 ease-in-out hover:bg-[#1D4ED8] hover:scale-105 hover:underline">
                  Read More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
