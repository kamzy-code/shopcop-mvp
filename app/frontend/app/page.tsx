'use client';
import { LandingNavbarV2 } from '../components/landing-v2/LandingNavbarV2';
import { HeroSectionV2 } from '../components/landing-v2/HeroSectionV2';
import { ProblemStatSection } from '../components/landing-v2/ProblemStatSection';
import { MissionSection } from '../components/landing-v2/MissionSection';
import { FeaturesSection } from '../components/landing-v2/FeaturesSection';
import { ProcessSection } from '../components/landing-v2/ProcessSection';
import { TestimonialsSection } from '../components/landing-v2/TestimonialsSection';
import { FAQSectionV2 } from '../components/landing-v2/FAQSectionV2';
import { FinalCtaSection } from '../components/landing-v2/FinalCtaSection';
import { FooterSectionV2 } from '../components/landing-v2/FooterSectionV2';
import { WaitlistSection } from '../components/landing-v2/WaitlistSection';
import { Suspense } from 'react';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SaaSProduct',
  name: 'ShopCop',
  description:
    'Verified commerce platform for Nigerian sellers. Get verified, build trust, close deals faster.',
  url: 'https://getshopcop.com',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'NGN',
    description: 'Free during beta',
  },
};

export default function RootPage() {
  const ctaLabel =  'Join Waitlist';
  const ctaHref =  '#waitlist';

  return (
    <>
      <Suspense>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LandingNavbarV2 ctaLabel={ctaLabel} ctaHref={ctaHref} />
        <HeroSectionV2 ctaLabel={ctaLabel} ctaHref={ctaHref} />
        <ProblemStatSection />
        <MissionSection />
        <FeaturesSection />
        <ProcessSection />
        <TestimonialsSection />
        <FAQSectionV2 />
        <FinalCtaSection ctaLabel={ctaLabel} ctaHref={ctaHref} />
        <WaitlistSection />
        <FooterSectionV2 />
      </Suspense>
    </>
  );
}
