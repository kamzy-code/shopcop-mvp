'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { getRoleHomePage } from '@/app/_lib/roleRedirect';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { SolutionSection } from './SolutionSection';
import { BenefitsSection } from './BenefitsSection';
import { ScreenshotSection } from './ScreenshotSection';
import { CtaSection } from './CtaSection';
import { FooterSection } from './FooterSection';

export default function LandingPage() {
  const isSessionReady = useAuthStore((s) => s.isSessionReady);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  const ctaLabel = isLoggedIn ? 'Dashboard' : 'Join Beta (Free)';
  const ctaHref = isLoggedIn && user ? getRoleHomePage(user.role) : '/auth/signup';

  if (!isSessionReady) {
    return <FullPageSpinner />;
  }

  return (
    <>
      <LandingNavbar isLoggedIn={isLoggedIn} ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <HeroSection ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <ProblemSection />
      <SolutionSection />
      <BenefitsSection />
      <ScreenshotSection />
      <CtaSection ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <FooterSection />
    </>
  );
}
