import type { Metadata } from 'next';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import '@/styles/base.css';
import '@/styles/chrome.css';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Thinker',
  description: 'Thinker: a browser for a small web of hand-written sites.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set by THEME_BOOT_SCRIPT before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
