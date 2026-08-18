import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AnalyticsShowcase } from "@/components/landing/AnalyticsShowcase";
import { Integrations } from "@/components/landing/Integrations";
import { ImpactCallouts } from "@/components/landing/ImpactCallouts";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <AnalyticsShowcase />
      <Integrations />
      <ImpactCallouts />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
