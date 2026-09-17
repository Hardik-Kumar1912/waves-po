import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Waves International',
  description: 'Internal operations tool for Waves International',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.className} h-full`}>
      <body className="min-h-full flex flex-col bg-[#f3f6fb]">
        {children}
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 bg-white mt-auto">
          Waves International — Internal Use Only
        </footer>
      </body>
    </html>
  );
}

