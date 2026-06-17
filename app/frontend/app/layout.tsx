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
  title: 'ShopCop — Get verified, sell with confidence',
  description:
    'ShopCop verifies social commerce sellers so buyers can shop with confidence on WhatsApp, Instagram & TikTok.',
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
