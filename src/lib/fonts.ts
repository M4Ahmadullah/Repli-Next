import { Inter } from 'next/font/google';

// Load Inter from Google Fonts with fallback options and timeout handling
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Disable preload to avoid timeout issues
  fallback: ['system-ui', 'Arial', 'sans-serif'],
  variable: '--font-inter',
  adjustFontFallback: true,
});

// Export a combined font class for convenience
export const fontClass = `${inter.variable} ${inter.className} font-sans antialiased`; 