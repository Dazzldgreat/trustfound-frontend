import MainHeader from "../component/Landing/MainHeader";
import Hero from "../component/Landing/Hero";
import TrustedBrands from "../component/Landing/TrustedBrands";
import Statistics from "../component/Landing/Statistics";
import Features from "../component/Landing/Features";
import DashboardPreview from "../component/Landing/DashboardPreview";
import HowItWorks from "../component/Landing/HowItWorks";
import AISection from "../component/Landing/AISection";
import WhyChooseUs from "../component/Landing/WhyChooseUs";
import Testimonials from "../component/Landing/Testimonials";
import Pricing from "../component/Landing/Pricing";
import Security from "../component/Landing/Security";
import FAQ from "../component/Landing/FAQ";
import CTA from "../component/Landing/CTA";
import Footer from "../component/Landing/Footer";

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <MainHeader />

      {/* Hero */}
      <Hero />

      {/* Social Proof */}
      <TrustedBrands />

      {/* Numbers */}
      <Statistics />

      {/* Product Features */}
      <Features />

      {/* Dashboard Preview */}
      <DashboardPreview />

      {/* Why Choose LostFound */}
      <WhyChooseUs />

      {/* AI Technology */}
      <AISection />

      {/* How It Works */}
      <HowItWorks />

      {/* Security */}
      <Security />

      {/* Customer Testimonials */}
      <Testimonials />

      {/* Pricing */}
      <Pricing />

      {/* Frequently Asked Questions */}
      <FAQ />

      {/* Final Call To Action */}
      <CTA />

      {/* Footer */}
      <Footer />
    </>
  );
}