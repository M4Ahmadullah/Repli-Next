'use client'

import { ClerkProvider } from '@clerk/nextjs'

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: '#10b981', // Emerald 500
          colorText: '#064e3b', // Emerald 900
          colorBackground: '#ffffff',
          colorInputBackground: '#f0fdf4', // Emerald 50
          colorInputText: '#064e3b', // Emerald 900
        },
        elements: {
          formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
          socialButtonsBlockButton: 'border-emerald-200 hover:bg-emerald-50',
          card: 'shadow-2xl border border-green-200',
          headerTitle: 'text-emerald-900',
          headerSubtitle: 'text-emerald-700',
          footerActionLink: 'text-emerald-600 hover:text-emerald-800',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
} 