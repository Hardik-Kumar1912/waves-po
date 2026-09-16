import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Waves International — PO Generator',
  description: 'Internal purchase order management tool for Waves International',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.className} h-full`}>
      <body className="min-h-full flex flex-col bg-[#f3f6fb]">
        {/* Navigation bar */}
        <nav className="bg-[#0058a4] shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-14 py-2 flex flex-wrap items-center gap-1 sm:gap-2">
            {/* Logo / brand */}
            <Link href="/po" className="flex items-center gap-2 mr-2 sm:mr-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Waves International" className="h-8 object-contain" />
              <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
                Waves International
              </span>
            </Link>

            <NavLink href="/po">Purchase Orders</NavLink>
            <NavLink href="/po/new">+ New PO</NavLink>
            <div className="ml-auto flex flex-wrap gap-1">
              <NavLink href="/suppliers">Suppliers</NavLink>
              <NavLink href="/items">Items</NavLink>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
          {children}
        </main>

        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 bg-white">
          Waves International — Internal Use Only
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-blue-100 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}
