import Link from 'next/link';

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-[#0058a4] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 min-h-14 py-2">
            <Link href="/" className="flex items-center gap-2.5 mr-4 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Waves International" className="h-8 object-contain" />
              <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
                Waves International
              </span>
            </Link>
            <span className="text-blue-300 hidden sm:block text-sm select-none">›</span>
            <span className="text-blue-100 hidden sm:block text-sm font-medium">Items Catalogue</span>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/po" className="text-blue-200 hover:text-white text-xs font-medium transition-colors">
                ← PO Module
              </Link>
              <Link href="/inventory" className="text-blue-200 hover:text-white text-xs font-medium transition-colors">
                Inventory
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
