import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';
import { COMPANY } from '@/lib/constants';
import { numberToWords } from '@/lib/numberToWords';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
    <div className="max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/po" className="text-sm text-gray-500 hover:text-[#0058a4] transition">
            ← All Purchase Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            PO #{po.orderNumber}
          </h1>
          <p className="text-gray-500 text-sm">{fmtDate(po.orderDate)}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/api/pdf/${po._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0058a4] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition shadow"
          >
            <span>⬇</span> Download PDF
          </Link>
        </div>
      </div>

      {/* PO Preview card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100" style={{ background: '#f8faff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" className="h-12 object-contain" />
          <div className="flex-1">
            <div className="text-xl font-bold tracking-widest" style={{ color: '#0058a4' }}>
              {COMPANY.name}
            </div>
            <div className="text-xs tracking-[0.2em] text-gray-500 uppercase mt-0.5">
              Purchase Order
            </div>
          </div>
        </div>

        {/* ── Order number / date ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-gray-100 text-sm">
          <div className="flex border-b sm:border-b-0 sm:border-r border-gray-100">
            <span className="px-5 py-3 bg-blue-50 text-[#0058a4] font-semibold text-xs uppercase tracking-wide flex items-center min-w-[130px]">
              Order Number
            </span>
            <span className="px-5 py-3 font-mono font-bold text-gray-800">{po.orderNumber}</span>
          </div>
          <div className="flex">
            <span className="px-5 py-3 bg-blue-50 text-[#0058a4] font-semibold text-xs uppercase tracking-wide flex items-center min-w-[100px]">
              Order Date
            </span>
            <span className="px-5 py-3 text-gray-700">{fmtDate(po.orderDate)}</span>
          </div>
        </div>

        {/* ── Buyer / Supplier ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-gray-100 text-sm">
          <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100">
            <p className="text-xs font-bold text-[#0058a4] uppercase tracking-wide mb-2">Buyer</p>
            <p className="font-bold text-gray-800">{COMPANY.name}</p>
            <p className="text-gray-500 text-xs mt-1">
              <span className="font-semibold">Billing:</span> {COMPANY.billingAddress}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              <span className="font-semibold">Shipping:</span> {COMPANY.shippingAddress}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              <span className="font-semibold">Tel:</span> {COMPANY.tel}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-[#0058a4] uppercase tracking-wide mb-2">Supplier</p>
            <p className="font-bold text-gray-800">{supplier.name}</p>
            <p className="text-gray-500 text-xs mt-1">{supplier.address}</p>
          </div>
        </div>

        {/* ── PAN / GSTN ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-gray-100 text-xs">
          <div className="px-5 py-3 border-b sm:border-b-0 sm:border-r border-gray-100 space-y-1">
            <div>
              <span className="text-gray-400 font-semibold uppercase tracking-wide">PAN # </span>
              <span className="font-mono font-bold text-gray-700">{COMPANY.pan}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold uppercase tracking-wide">GSTIN # </span>
              <span className="font-mono font-bold text-gray-700">{COMPANY.gstn}</span>
            </div>
          </div>
          <div className="px-5 py-3">
            <span className="text-gray-400 font-semibold uppercase tracking-wide">Supplier GSTIN # </span>
            <span className="font-mono font-bold text-gray-700">{supplier.gstn || '—'}</span>
          </div>
        </div>

        {/* ── Items table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-b border-gray-100">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200 text-xs uppercase tracking-wider">
                <th className="text-center px-4 py-2.5 text-[#0058a4] font-bold w-10 whitespace-nowrap">S.No</th>
                <th className="text-left px-4 py-2.5 text-[#0058a4] font-bold whitespace-nowrap">Material Description</th>
                <th className="text-right px-4 py-2.5 text-[#0058a4] font-bold w-16 whitespace-nowrap">Qty</th>
                <th className="text-right px-4 py-2.5 text-[#0058a4] font-bold w-28 whitespace-nowrap">MRP (INR)</th>
                <th className="text-right px-4 py-2.5 text-[#0058a4] font-bold w-28 whitespace-nowrap">Unit Rate (INR)</th>
                <th className="text-right px-4 py-2.5 text-[#0058a4] font-bold w-28 whitespace-nowrap">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {po.lineItems.map((line, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="text-center px-4 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium">{line.description}</td>
                  <td className="text-right px-4 py-2.5 font-mono text-gray-700">{line.qty}</td>
                  <td className="text-right px-4 py-2.5 font-mono text-gray-600">
                    {line.mrp != null ? fmt(line.mrp) : '—'}
                  </td>
                  <td className="text-right px-4 py-2.5 font-mono text-gray-700">{fmt(line.unitRate)}</td>
                  <td className="text-right px-4 py-2.5 font-mono font-semibold text-gray-800">{fmt(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Terms & Totals ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-gray-100">
          <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100">
            <p className="text-xs font-bold text-[#0058a4] uppercase tracking-wide mb-2">Terms &amp; Conditions</p>
            <p className="text-xs text-gray-500 whitespace-pre-wrap">{po.terms || '—'}</p>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Basic Amount</span>
                <span className="font-mono">INR {fmt(po.basicAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST ({po.taxRate}%)</span>
                <span className="font-mono">INR {fmt(po.gstAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#0058a4] border-t border-gray-200 pt-2 mt-2">
                <span>Grand Total</span>
                <span className="font-mono">INR {fmt(po.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Amount in words ── */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs italic text-gray-500">
            <span className="font-semibold not-italic text-gray-700">Amount in Words: </span>
            {numberToWords(po.grandTotal)}
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between items-end px-5 py-4 text-xs text-gray-400">
          <span className="italic">This is a system-generated purchase order.</span>
          <div className="text-right">
            <div className="font-bold text-[#0058a4] text-sm">{COMPANY.name}</div>
            <div className="mt-0.5">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
