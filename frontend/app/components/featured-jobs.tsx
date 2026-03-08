import Image from "next/image";

export default function FeaturedJobs() {
  const jobs = [
    {
      company: "Spotify",
      location: "New York, USA",
      title: "Product Designer",
      desc: "Join Spotify’s design team to craft intuitive user experiences for millions of listeners worldwide.",
      time: "3 hours ago",
      salary: "$50k-90k",
      logo: "/spotify-logo.png",
    },
    {
      company: "Stripe",
      location: "London, UK",
      title: "Sr. UI Designer",
      desc: "Work with Stripe to design seamless payment interfaces that empower businesses globally.",
      time: "1 hour ago",
      salary: "$50k-90k",
      logo: "/stripe-logo.png",
    },
    {
      company: "Slack",
      location: "New York, USA",
      title: "Visual Designer",
      desc: "Help Slack create engaging visuals that make workplace communication smarter and friendlier.",
      time: "2 hours ago",
      salary: "$50k-90k",
      logo: "/slack-logo.png",
    },
    {
      company: "Airbnb",
      location: "Mumbai, India",
      title: "Expert Developer",
      desc: "Be part of Airbnb’s engineering team to build scalable solutions for global travelers.",
      time: "5 hours ago",
      salary: "$50k-90k",
      logo: "/airbnb-logo.png",
    },
    {
      company: "Whatsapp",
      location: "New York, USA",
      title: "Lead UX Designer",
      desc: "Shape the future of messaging by designing user‑friendly experiences at WhatsApp.",
      time: "3 hours ago",
      salary: "$50k-90k",
      logo: "/whatsapp-logo.jpg",
    },
    {
      company: "Booking.Com",
      location: "Dubai, UAE",
      title: "Product Designer",
      desc: "Collaborate with Booking.com to design travel solutions that connect millions of users.",
      time: "3 hours ago",
      salary: "$50k-90k",
      logo: "/booking-logo.png",
    },
  ];

  return (
    <section className="pt-0 px-10 py-16 bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
        Featured Job Offer
      </h2>
      <p className="text-center text-gray-700 max-w-2xl mx-auto mb-10">
        Discover hand‑picked opportunities with leading global companies. These roles are designed to help you grow, innovate, and make a lasting impact.
      </p>

      {/* Tabs */}
      <div className="flex justify-center gap-6 mb-12">
        {["All", "Design", "Marketing", "Management", "Others"].map((cat) => (
          <button
            key={cat}
            className="px-5 py-2 rounded-full border border-gray-300 text-gray-800 hover:bg-[#2563EB] hover:text-white transition duration-300 ease-in-out shadow-sm hover:shadow-md"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Job Cards Vertical */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {jobs.map((job, index) => (
          <div
            key={index}
            className="border rounded-2xl p-6 bg-white shadow-md hover:shadow-xl hover:border-[#2563EB] transition duration-300 ease-in-out transform hover:-translate-y-2 flex flex-col h-full"
          >
            {/* Logo + Title */}
            <div className="flex items-center gap-4 mb-4">
              <Image
                src={job.logo}
                alt={job.company}
                width={50}
                height={50}
                className="rounded"
              />
              <div>
                <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-800">
                  {job.company} • {job.location}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-800 text-sm mb-4">{job.desc}</p>

            {/* Time + Salary */}
            <div className="flex justify-between items-center text-sm mb-4">
              <span className="text-gray-700">{job.time}</span>
              <span className="bg-[#2563EB] text-white px-3 py-1 rounded-full text-xs font-semibold">
                {job.salary}
              </span>
            </div>

            {/* Apply Button */}
            <button className="w-full bg-[#2563EB] text-white py-2 rounded-full hover:bg-[#1D4ED8] transition duration-300 ease-in-out transform hover:scale-105 font-semibold shadow-sm hover:shadow-md">
              Apply Now
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
