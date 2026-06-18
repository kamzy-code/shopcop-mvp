import LandingPage from '@/components/landing/LandingPage';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SaaSProduct',
  name: 'ShopCop',
  description: 'Verified commerce platform for Nigerian sellers. Get verified, build trust, close deals faster.',
  url: 'https://getshopcop.com',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'NGN',
    description: 'Free during beta',
  },
};

export default function RootPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
