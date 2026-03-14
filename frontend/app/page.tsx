import React from "react";
import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import ServicesSection from "./components/services-section";
import FeaturedJobs from "./components/featured-jobs";
import NewsScrollBelt from "./components/NewsScrollBelt";
import NewsletterSubscribe from "./components/newsletter-subscribe";
import Footer from "./components/footer";

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-[#060610]">
      <HeroSection />
      <HowItWorks />
      <ServicesSection />
      <FeaturedJobs />
      <NewsScrollBelt />
      <NewsletterSubscribe />
      <Footer />
    </div>
  );
}