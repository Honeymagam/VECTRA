import { useEffect } from 'react';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HeroSection from '@/components/landing/HeroSection';
import LandingFooter from '@/components/landing/LandingFooter';
import ResearchEvaluationSection from '@/components/landing/ResearchEvaluationSection';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'VECTRA | Placement Intelligence';
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-navy-900">
      <HeroSection />
      <FeaturesSection />
      <ResearchEvaluationSection />
      <LandingFooter />
    </div>
  );
}
