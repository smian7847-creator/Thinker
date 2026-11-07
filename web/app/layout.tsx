import type { Metadata } from 'next';
import { THEME_BOOT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thinker',
  description: 'Thinker: a browser for a small web of hand-written sites.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set by THEME_BOOT before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
