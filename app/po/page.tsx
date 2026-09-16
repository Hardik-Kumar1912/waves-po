import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';
import Link from 'next/link';

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
          <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{pos.length} order{pos.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/po/new"
          className="bg-[#0058a4] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition shadow"
        >
          + New PO
        </Link>
      </div>

      {pos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="font-medium">No purchase orders yet</p>
          <p className="text-sm mt-1">
            <Link href="/po/new" className="text-[#0058a4] hover:underline font-medium">
              Create your first PO →
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Order No.</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Date</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Supplier</th>
                <th className="text-right px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Grand Total (INR)</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pos.map((po) => (
                <tr key={po._id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-[#0058a4] whitespace-nowrap">{po.orderNumber}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtDate(po.orderDate)}</td>
                  <td className="px-5 py-3 text-gray-800 font-medium whitespace-nowrap">{po.supplierId?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-gray-800 whitespace-nowrap">
                    {fmt(po.grandTotal)}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/po/${po._id}`}
                      className="text-[#0058a4] text-xs font-medium hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
