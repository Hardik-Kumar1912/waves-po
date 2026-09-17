'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/po', label: 'All POs', exact: true },
  { href: '/po/new', label: '+ New PO', exact: true },
  { href: '/po/suppliers', label: 'Suppliers', exact: false },
  { href: '/items', label: 'Items', exact: false },
];

export default function POLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Brand row */}
          <div className="flex items-center gap-3 min-h-14 py-2">
            <Link href="/" className="flex items-center gap-2.5 mr-4 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Waves International" className="h-8 object-contain" />
              <span className="text-slate-900 font-bold text-sm tracking-wide hidden sm:block">
                Waves International
              </span>
            </Link>

            {/* Module label separator */}
            <span className="text-slate-300 hidden sm:block text-sm select-none">›</span>
            <span className="text-slate-600 hidden sm:block text-sm font-medium">
              Purchase Orders
            </span>

            {/* Sub-nav tabs */}
            <div className="ml-auto flex items-center gap-1 flex-wrap">
              {NAV_LINKS.map(({ href, label, exact }) => {
                const isActive = exact
                  ? pathname === href
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-100 text-[#0058a4]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
