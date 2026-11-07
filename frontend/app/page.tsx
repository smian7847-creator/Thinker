'use client';

import dynamic from 'next/dynamic';

// The browser lives entirely in the client: its state is the tab's history,
// sessionStorage and window.history, none of which exist on the server.
const Browser = dynamic(() => import('@/components/browser/Browser').then((m) => m.Browser), {
  ssr: false,
  loading: () => <div className="booting">Starting…</div>,
});

export default function Home() {
  return <Browser />;
}
