import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

interface Supplier { name: string }
interface PORow {
  _id: string;
  orderNumber: string;
  orderDate: string;
  supplierId: Supplier;
  grandTotal: number;
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | Date) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

export default async function POListPage() {
  await dbConnect();
  const raw = await PurchaseOrder.find()
    .populate('supplierId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const pos = raw as unknown as PORow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-500 text-sm mt-1">{pos.length} order{pos.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/po/new">
          <Button className="bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New PO
          </Button>
        </Link>
      </div>

      {pos.length === 0 ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-900 mb-1">No purchase orders yet</p>
          <p className="text-sm">
            <Link href="/po/new" className="text-[#0058a4] hover:underline font-medium">
              Create your first PO &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Order No.</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Supplier</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">Grand Total (INR)</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => (
                  <TableRow key={po._id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono font-bold text-[#0058a4]">{po.orderNumber}</TableCell>
                    <TableCell className="text-slate-600">{fmtDate(po.orderDate)}</TableCell>
                    <TableCell className="text-slate-800 font-medium">{po.supplierId?.name ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-slate-800">
                      {fmt(po.grandTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/po/${po._id}`}>
                        <Button variant="ghost" size="sm" className="text-[#0058a4] hover:text-[#0058a4] hover:bg-[#0058a4]/10 h-8 px-3">
                          View &rarr;
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
