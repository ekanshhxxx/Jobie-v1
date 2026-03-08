import React from "react";
import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import ServicesSection from "./components/services-section";
import FeaturedJobs from "./components/featured-jobs";
import ArticlesSection from "./components/articles-section";
import NewsletterSubscribe from "./components/newsletter-subscribe";
import Footer from "./components/footer"; 

export default function HomePage() {
  return (
    <div className="bg-sky-100">
      <HeroSection />
      <HowItWorks />
      <ServicesSection />
      <FeaturedJobs />
      <ArticlesSection />
      <NewsletterSubscribe />
        <Footer />
    </div>
  );
}