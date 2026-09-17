import { dbConnect } from '@/lib/db';
import { Item } from '@/lib/models/Item';
import { StockIn } from '@/lib/models/StockIn';
import { Dispatch } from '@/lib/models/Dispatch';
import Link from 'next/link';
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function fmtDate(d: Date | string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

interface PopulatedItem { name: string; unit: string }

export default async function InventoryDashboard() {
  await dbConnect();

  const [items, stockIns, dispatches] = await Promise.all([
    Item.find().sort({ name: 1 }).lean(),
    StockIn.find().populate('itemId', 'name unit').sort({ date: -1 }).limit(20).lean(),
    Dispatch.find().sort({ date: -1 }).limit(20).lean(),
  ]);

  type ActivityEntry = {
    type: 'in' | 'out';
    date: Date;
    label: string;
    detail: string;
    referenceNo?: string;
    _id: string;
  };

  const activity: ActivityEntry[] = [
    ...stockIns.map((s) => ({
      type: 'in' as const,
      date: s.date,
      label: (s.itemId as unknown as PopulatedItem)?.name ?? '—',
      detail: `${s.totalUnits} ${(s.itemId as unknown as PopulatedItem)?.unit ?? 'units'} · ${s.cartons} ctn`,
      referenceNo: s.referenceNo,
      _id: String(s._id),
    })),
    ...dispatches.map((d) => ({
      type: 'out' as const,
      date: d.date,
      label: d.recipient,
      detail: `${d.lineItems.length} item${d.lineItems.length !== 1 ? 's' : ''}`,
      referenceNo: d.referenceNo,
      _id: String(d._id),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const lowCount = items.filter(
    (i) => i.lowStockThreshold != null && i.currentStock <= i.lowStockThreshold
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {lowCount > 0 && (
              <span className="ml-2 flex items-center text-amber-600 font-medium">
                <span className="w-1 h-1 bg-amber-500 rounded-full mr-1.5 inline-block"></span>
                {lowCount} low stock
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/inventory/stock-in/new">
            <Button className="bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm">
              <ArrowDownToLine className="w-4 h-4 mr-1.5" />
              Stock In
            </Button>
          </Link>
          <Link href="/inventory/stock-out/new">
            <Button variant="outline" className="text-[#0058a4] border-[#0058a4]/20 hover:bg-[#0058a4]/5">
              <ArrowUpFromLine className="w-4 h-4 mr-1.5" />
              Dispatch
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock levels table */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-slate-200 overflow-hidden h-full flex flex-col">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Stock Levels</CardTitle>
              <Link href="/items" className="text-xs text-[#0058a4] hover:underline font-medium flex items-center">
                Manage items <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {items.length === 0 ? (
                <div className="text-center py-16 text-slate-400 h-full flex flex-col items-center justify-center">
                  <Package className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-medium text-sm text-slate-900">No items yet</p>
                  <Link href="/items" className="text-xs text-[#0058a4] hover:underline mt-1 block">
                    Add items to catalogue &rarr;
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[400px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-500 h-10">Item</TableHead>
                        <TableHead className="text-right font-semibold text-slate-500 h-10 whitespace-nowrap">Ctn Size</TableHead>
                        <TableHead className="text-right font-semibold text-slate-500 h-10 whitespace-nowrap">In Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const isLow = item.lowStockThreshold != null && item.currentStock <= item.lowStockThreshold;
                        return (
                          <TableRow key={String(item._id)} className="hover:bg-slate-50/50">
                            <TableCell>
                              <span className="font-medium text-slate-800">{item.name}</span>
                              <span className="text-slate-400 text-xs ml-1.5">{item.unit}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-slate-500">
                              {item.unitsPerCarton}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <span className={`font-mono font-semibold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                                {item.currentStock}
                              </span>
                              {isLow && (
                                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100 px-1.5 py-0 border-transparent rounded-sm text-[10px] uppercase font-bold">
                                  Low
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity + quick actions */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 space-y-0">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link
                href="/inventory/stock-in"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-[#0058a4]/30 hover:bg-blue-50/30 hover:shadow-sm transition-all text-sm font-medium text-slate-700 group"
              >
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-md group-hover:scale-110 transition-transform">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <span>View Stock In history</span>
              </Link>
              <Link
                href="/inventory/stock-out"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-[#0058a4]/30 hover:bg-blue-50/30 hover:shadow-sm transition-all text-sm font-medium text-slate-700 group"
              >
                <div className="bg-amber-50 text-amber-600 p-2 rounded-md group-hover:scale-110 transition-transform">
                  <ArrowUpFromLine className="w-4 h-4" />
                </div>
                <span>View Dispatches</span>
              </Link>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 space-y-0">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activity.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm px-5">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No activity yet.</p>
                  <p className="text-xs mt-1">Create a Stock In or Dispatch entry.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activity.map((entry) => (
                    <li key={entry._id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className={`mt-0.5 text-[10px] font-bold px-1.5 py-0 rounded border-transparent ${
                            entry.type === 'in'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                          {entry.type === 'in' ? 'IN' : 'OUT'}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate leading-snug">{entry.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{entry.detail}</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            {fmtDate(entry.date)}
                            {entry.referenceNo && (
                              <>
                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                <span className="font-mono">{entry.referenceNo}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
