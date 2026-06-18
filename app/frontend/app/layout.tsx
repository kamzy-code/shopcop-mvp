import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProviders from './queryClientProvider';
import { Provider } from '@/components/ui/provider';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from './AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ShopCop — Get Verified, Sell More',
  description:
    'Sell more on WhatsApp, TikTok & Instagram by getting verified on ShopCop. Build trust with buyers, close deals faster. Free beta testing.',
  keywords: ['verified sellers', 'social commerce Nigeria', 'trusted vendors', 'online trust', 'ShopCop'],
  openGraph: {
    title: 'ShopCop — Get Verified, Sell More',
    description: 'Stop losing sales to buyer suspicion. Get verified, build trust, sell faster.',
    url: 'https://getshopcop.com',
    siteName: 'ShopCop',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopCop — Get Verified, Sell More',
    description: 'Verified commerce for Nigerian sellers.',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <QueryProviders>
          <AuthProvider>
            <Provider>
              <Toaster />
              {children}
            </Provider>
          </AuthProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
