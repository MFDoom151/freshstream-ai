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
        className="font-sans antialiased min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900"
      >
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              {/* Ambient Background Glow Meshes */}
              <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2" />
                <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[130px]" />
                <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px]" />
              </div>

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
