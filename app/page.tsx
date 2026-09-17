import Link from 'next/link';
import type { Metadata } from 'next';
import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';
import { Item } from '@/lib/models/Item';
import { ArrowRight, FileText, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Waves International — Operations',
  description: 'Internal operations portal for Waves International',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await dbConnect();
  
  // Get start of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [posThisMonth, itemsData] = await Promise.all([
    PurchaseOrder.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Item.find({}, 'currentStock lowStockThreshold').lean()
  ]);

  const lowStockCount = itemsData.filter(
    (i) => i.lowStockThreshold != null && i.currentStock <= i.lowStockThreshold
  ).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-2.5rem)] bg-slate-50">
      
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Waves International" className="h-8 w-auto object-contain" />
          <div className="font-bold text-slate-900 text-base tracking-wide">
            Waves International
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[#11a3e7] opacity-10 blur-[100px]"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-20 flex flex-col items-center text-center">
          <Badge variant="outline" className="mb-6 rounded-full px-3 py-1 text-sm font-medium border-slate-200 text-[#0058a4] shadow-sm flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Internal Portal
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Operations <span className="text-[#0058a4]">Dashboard</span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 leading-relaxed">
            Manage purchase orders, track inventory, and streamline logistics from a single, unified interface.
          </p>
        </div>
      </section>

      {/* Main content - Module selection */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Purchase Orders Module */}
          <Link href="/po" className="block group outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0058a4] rounded-xl h-full">
            <Card className="h-full border-slate-200 hover:border-[#0058a4]/40 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 flex flex-col bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0058a4] mb-4 group-hover:scale-110 group-hover:bg-[#0058a4]/10 transition-all duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-[#11a3e7]/10 text-[#0058a4] hover:bg-[#11a3e7]/20 border-transparent transition-colors">
                    Active Module
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Purchase Orders</CardTitle>
                <CardDescription className="text-slate-500 text-sm pt-1.5 leading-relaxed font-medium">
                  Create, track, and manage purchase orders for suppliers.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-900 mr-1.5">{posThisMonth}</span> 
                  new POs this month
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t border-slate-100 mt-auto">
                <div className="w-full flex items-center justify-between mt-4 text-sm font-semibold text-[#0058a4]">
                  <span>Open Module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                </div>
              </CardFooter>
            </Card>
          </Link>

          {/* Inventory Management Module */}
          <Link href="/inventory" className="block group outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0058a4] rounded-xl h-full">
            <Card className="h-full border-slate-200 hover:border-[#0058a4]/40 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 flex flex-col bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0058a4] mb-4 group-hover:scale-110 group-hover:bg-[#0058a4]/10 transition-all duration-300">
                    <Package className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-[#11a3e7]/10 text-[#0058a4] hover:bg-[#11a3e7]/20 border-transparent transition-colors">
                    Active Module
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Inventory Management</CardTitle>
                <CardDescription className="text-slate-500 text-sm pt-1.5 leading-relaxed font-medium">
                  Track stock levels, record inbound goods, and manage dispatches.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className={`flex items-center text-sm px-3 py-2.5 rounded-lg border ${lowStockCount > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                  {lowStockCount > 0 && <AlertCircle className="w-4 h-4 mr-1.5 text-amber-500" />}
                  <span className={`font-bold mr-1.5 ${lowStockCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>{lowStockCount}</span> 
                  items running low on stock
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t border-slate-100 mt-auto">
                <div className="w-full flex items-center justify-between mt-4 text-sm font-semibold text-[#0058a4]">
                  <span>Open Module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                </div>
              </CardFooter>
            </Card>
          </Link>

        </div>
      </main>
    </div>
  );
}
