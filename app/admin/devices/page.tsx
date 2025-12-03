'use client';

import dynamic from 'next/dynamic';

const DevicesMapClient = dynamic(
  () => import('./DevicesMapClient'),
  {
    ssr: false,
  }
);

export default function DevicesPage() {
  return <DevicesMapClient />;
}
