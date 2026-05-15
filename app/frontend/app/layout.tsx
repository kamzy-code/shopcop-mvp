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
  title: 'ShopCop — Verify vendors, shop with confidence',
  description: 'ShopCop helps you find verified vendors and shop safely in Nigeria.',
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
