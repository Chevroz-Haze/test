import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Foundry Next.js Starter',
  description:
    'A production-ready Next.js 15, React 19, TypeScript, and Tailwind CSS v4 full-stack starter template with API route handlers, CRUD state management, and UI primitives.',
  openGraph: {
    title: 'Foundry Next.js Starter',
    description:
      'A production-ready Next.js 15, React 19, TypeScript, and Tailwind CSS v4 full-stack starter template with API route handlers, CRUD state management, and UI primitives.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foundry Next.js Starter',
    description:
      'A production-ready Next.js 15, React 19, TypeScript, and Tailwind CSS v4 full-stack starter template with API route handlers, CRUD state management, and UI primitives.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        style={{fontFamily: 'var(--font-sans), sans-serif'}}
        className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
