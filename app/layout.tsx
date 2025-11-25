import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, AdminAuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EzBox.mn - Modular Kitchen Store',
  description: 'Premium modular kitchen solutions for Mongolia',
  applicationName: 'EzBox.mn',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EzBox.mn',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* Configure meshopt decoder for model-viewer */}
        <Script id="meshopt-config" strategy="beforeInteractive">
          {`
            // Configure model-viewer to use local meshopt decoder
            window.ModelViewerElement = window.ModelViewerElement || {};
            window.ModelViewerElement.meshoptDecoderLocation = '/meshopt_decoder.js';

            console.log('✓ Meshopt decoder configured to use local file');
          `}
        </Script>
        <LanguageProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <CartProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </CartProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
