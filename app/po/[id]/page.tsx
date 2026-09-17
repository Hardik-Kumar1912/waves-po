import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';
import { COMPANY } from '@/lib/constants';
import { numberToWords } from '@/lib/numberToWords';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

interface SupplierData { _id: string; name: string; address: string; gstn?: string }
interface LineItemData {
  description: string;
  qty: number;
  mrp?: number;
  unitRate: number;
  amount: number;
}

interface PODetail {
  _id: string;
  orderNumber: string;
  orderDate: string;
  supplierId: SupplierData;
  lineItems: LineItemData[];
  basicAmount: number;
  taxRate: number;
  gstAmount: number;
  grandTotal: number;
  terms?: string;
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string | Date) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

export default async function PODetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await dbConnect();

  const raw = await PurchaseOrder.findById(id).populate('supplierId').lean();
  if (!raw) notFound();

  const po = raw as unknown as PODetail;
  const supplier = po.supplierId;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/po" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#0058a4] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            All Purchase Orders
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            PO #{po.orderNumber}
          </h1>
          <p className="text-slate-500 text-sm">{fmtDate(po.orderDate)}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/api/pdf/${po._id}`} target="_blank" rel="noopener noreferrer" passHref>
            <Button className="bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </Link>
        </div>
      </div>

      {/* PO Preview card */}
      <Card className="shadow-md border-slate-200 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-6 border-b border-slate-100 bg-slate-50/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" className="h-12 object-contain" />
          <div className="flex-1">
            <div className="text-xl font-bold tracking-widest text-[#0058a4]">
              {COMPANY.name}
            </div>
            <div className="text-xs tracking-[0.2em] text-slate-500 uppercase mt-0.5">
              Purchase Order
            </div>
          </div>
        </div>

        {/* ── Order number / date ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-100 text-sm">
          <div className="flex border-b sm:border-b-0 sm:border-r border-slate-100">
            <span className="px-5 py-3 bg-blue-50/50 text-[#0058a4] font-semibold text-xs uppercase tracking-wide flex items-center min-w-[130px]">
              Order Number
            </span>
            <span className="px-5 py-3 font-mono font-bold text-slate-900">{po.orderNumber}</span>
          </div>
          <div className="flex">
            <span className="px-5 py-3 bg-blue-50/50 text-[#0058a4] font-semibold text-xs uppercase tracking-wide flex items-center min-w-[100px]">
              Order Date
            </span>
            <span className="px-5 py-3 text-slate-700">{fmtDate(po.orderDate)}</span>
          </div>
        </div>

        {/* ── Buyer / Supplier ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-100 text-sm">
          <div className="px-5 py-5 border-b sm:border-b-0 sm:border-r border-slate-100">
            <p className="text-xs font-bold text-[#0058a4] uppercase tracking-wide mb-3">Buyer</p>
            <p className="font-bold text-slate-900">{COMPANY.name}</p>
            <div className="space-y-1.5 mt-2">
              <p className="text-slate-600 text-xs">
                <span className="font-semibold text-slate-500">Billing:</span> {COMPANY.billingAddress}
              </p>
              <p className="text-slate-600 text-xs">
                <span className="font-semibold text-slate-500">Shipping:</span> {COMPANY.shippingAddress}
              </p>
              <p className="text-slate-600 text-xs">
                <span className="font-semibold text-slate-500">Tel:</span> {COMPANY.tel}
              </p>
            </div>
          </div>
          <div className="px-5 py-5">
            <p className="text-xs font-bold text-[#0058a4] uppercase tracking-wide mb-3">Supplier</p>
            <p className="font-bold text-slate-900">{supplier.name}</p>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">{supplier.address}</p>
          </div>
        </div>

        {/* ── PAN / GSTN ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-100 text-xs">
          <div className="px-5 py-3 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center gap-1.5">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wide inline-block w-16">PAN #</span>
              <span className="font-mono font-bold text-slate-700">{COMPANY.pan}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wide inline-block w-16">GSTIN #</span>
              <span className="font-mono font-bold text-slate-700">{COMPANY.gstn}</span>
            </div>
          </div>
          <div className="px-5 py-3 flex items-center">
            <span className="text-slate-400 font-semibold uppercase tracking-wide mr-2">Supplier GSTIN #</span>
            <span className="font-mono font-bold text-slate-700">{supplier.gstn || '—'}</span>
          </div>
        </div>

        {/* ── Items table ── */}
        <div className="overflow-x-auto">
          <Table className="border-b border-slate-100">
            <TableHeader className="bg-blue-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap w-12 text-center text-[#0058a4] font-bold">S.No</TableHead>
                <TableHead className="whitespace-nowrap text-[#0058a4] font-bold">Material Description</TableHead>
                <TableHead className="whitespace-nowrap w-20 text-right text-[#0058a4] font-bold">Qty</TableHead>
                <TableHead className="whitespace-nowrap w-28 text-right text-[#0058a4] font-bold">MRP (INR)</TableHead>
                <TableHead className="whitespace-nowrap w-32 text-right text-[#0058a4] font-bold">Unit Rate (INR)</TableHead>
                <TableHead className="whitespace-nowrap w-32 text-right text-[#0058a4] font-bold">Amount (INR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lineItems.map((line, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50 border-slate-100">
                  <TableCell className="text-center text-slate-400 font-mono text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-slate-800 font-medium">{line.description}</TableCell>
                  <TableCell className="text-right font-mono text-slate-700">{line.qty}</TableCell>
                  <TableCell className="text-right font-mono text-slate-500">
                    {line.mrp != null ? fmt(line.mrp) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-700">{fmt(line.unitRate)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-slate-900">{fmt(line.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ── Terms & Totals ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-100">
          <div className="px-5 py-5 border-b sm:border-b-0 sm:border-r border-slate-100">
            <p className="text-xs font-bold text-[#0058a4] uppercase tracking-wide mb-3">Terms &amp; Conditions</p>
            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{po.terms || '—'}</p>
          </div>
          <div className="px-5 py-5 bg-slate-50/30">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Basic Amount</span>
                <span className="font-mono">INR {fmt(po.basicAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({po.taxRate}%)</span>
                <span className="font-mono">INR {fmt(po.gstAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#0058a4] border-t border-slate-200 pt-3 mt-3">
                <span className="uppercase tracking-wide text-xs self-end pb-0.5">Grand Total</span>
                <span className="font-mono text-base">INR {fmt(po.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Amount in words ── */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <p className="text-xs italic text-slate-500">
            <span className="font-semibold not-italic text-slate-700 mr-1">Amount in Words:</span>
            {numberToWords(po.grandTotal)}
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between items-end px-5 py-6 text-xs text-slate-400">
          <span className="italic">This is a system-generated purchase order.</span>
          <div className="text-right">
            <div className="font-bold text-[#0058a4] text-sm mb-1">{COMPANY.name}</div>
            <div className="text-slate-500">Authorized Signatory</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
