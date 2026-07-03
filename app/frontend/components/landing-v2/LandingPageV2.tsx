'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { getRoleHomePage } from '@/app/_lib/roleRedirect';
import { LandingNavbarV2 } from './LandingNavbarV2';
import { HeroSectionV2 } from './HeroSectionV2';
import { ProblemStatSection } from './ProblemStatSection';
import { MissionSection } from './MissionSection';
import { FeaturesSection } from './FeaturesSection';
import { ProcessSection } from './ProcessSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FAQSectionV2 } from './FAQSectionV2';
import { FinalCtaSection } from './FinalCtaSection';
import { FooterSectionV2 } from './FooterSectionV2';

export default function LandingPageV2() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  const ctaLabel = isLoggedIn ? 'Dashboard' : 'Join Beta (Free)';
  const ctaHref = isLoggedIn && user ? getRoleHomePage(user.role) : '/auth/signup';

  return (
    <>
      <LandingNavbarV2 ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <HeroSectionV2 ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <ProblemStatSection />
      <MissionSection />
      <FeaturesSection />
      <ProcessSection />
      <TestimonialsSection />
      <FAQSectionV2 />
      <FinalCtaSection ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <FooterSectionV2 />
    </>
  );
}
