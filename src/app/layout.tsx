import type { Metadata } from "next";
import "./globals.css";
import { ClerkProviderWrapper } from '@/components/providers/clerk-provider'
import { Providers } from '@/components/providers'
import { ConditionalLayout } from '@/components/layout/conditional-layout'
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
      <body
        className={fontClass}
        suppressHydrationWarning
      >
        <ClerkProviderWrapper>
        <Providers>
            <ConditionalLayout>
          {children}
            </ConditionalLayout>
        </Providers>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
