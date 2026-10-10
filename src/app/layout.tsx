import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme/context';
import { I18nProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F172A',
};

export const metadata: Metadata = {
  title: 'FreshStream AI — Intelligent Agri-Asset Preservation',
  description: 'Physics-Informed Biological Digital Twins and real-time volatile ethanol decay sensing along the Trans-Caspian Middle Corridor.',
  keywords: [
    'AgriTech', 'Cold-Chain', 'Biological Digital Twin', 'Arrhenius Kinetics', 
    'Trans-Caspian Middle Corridor', 'TITR', 'Food Spoilage Prevention', 
    'Autonomous Logistics', 'IoT Telematics'
  ],
  authors: [{ name: 'FreshStream AI Engineering Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC theme restoration script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('freshstream_theme');
                  if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-sans antialiased min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      >
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              {/* Persistent Global Header */}
              <Header />

              {/* Main Application Body */}
              <main id="main-content" className="flex-1 flex flex-col w-full">
                {children}
              </main>

              {/* Global Institutional Footer */}
              <Footer />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
