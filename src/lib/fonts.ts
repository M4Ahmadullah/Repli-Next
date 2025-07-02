import { Inter } from 'next/font/google';

// Load Inter from Google Fonts with fallback options
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
  variable: '--font-inter',
});

// Export a combined font class for convenience
export const fontClass = `${inter.variable} ${inter.className} font-sans antialiased`; 