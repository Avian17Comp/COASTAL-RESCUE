import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'COASTAL-RESCUE',
  description: 'Platform Geospasial Mitigasi & Evakuasi Pesisir',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0B1325' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${outfit.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
