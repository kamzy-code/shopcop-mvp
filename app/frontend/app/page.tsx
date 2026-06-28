'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { getRoleHomePage } from '@/app/_lib/roleRedirect';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const isSessionReady = useAuthStore((s) => s.isSessionReady);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!isSessionReady) return;
    // Handles all cases:
    //   VENDOR → /dashboard, ADMIN → /admin, BUYER → /buyer
    //   unauthenticated (user undefined) → /auth/login
    router.replace(getRoleHomePage(user?.role));
  }, [isSessionReady, user?.role]);

  return <FullPageSpinner />;
}


// import LandingPage from '@/components/landing/LandingPage';

// const jsonLd = {
//   '@context': 'https://schema.org',
//   '@type': 'SaaSProduct',
//   name: 'ShopCop',
//   description: 'Verified commerce platform for Nigerian sellers. Get verified, build trust, close deals faster.',
//   url: 'https://getshopcop.com',
//   offers: {
//     '@type': 'Offer',
//     price: '0',
//     priceCurrency: 'NGN',
//     description: 'Free during beta',
//   },
// };

// export default function RootPage() {
//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />
//       <LandingPage />
//     </>
//   );
// }
