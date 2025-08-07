import type { Metadata } from "next";
import "./globals.css";
import { ClerkCustomProvider } from '@/components/providers/clerk-provider'
import { Providers } from '@/components/providers'
import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { PerformanceMonitor } from '@/components/ui/performance-monitor'
import { inter, fontClass } from '@/lib/fonts';

export const metadata: Metadata = {
  title: "Repli - AI-Powered WhatsApp Automation",
  description: "Transform your WhatsApp into an intelligent AI assistant. Automate customer service and scale your business effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={fontClass}
        suppressHydrationWarning
      >
        <ClerkCustomProvider>
          <Providers>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <PerformanceMonitor name="App Root" />
          </Providers>
        </ClerkCustomProvider>
      </body>
    </html>
  );
}
