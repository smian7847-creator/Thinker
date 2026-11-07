import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'smallweb',
  description: 'A browser for a small web of hand-written sites.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
