'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { numberToWords } from '@/lib/numberToWords';

interface Supplier { _id: string; name: string }
interface Item { _id: string; name: string; unitRate: number; mrp?: number; taxRate: number }

interface LineItem {
  itemId: string;
  description: string;
  qty: number | '';
  mrpStr: string;   // editable string for MRP input
  unitRate: number;
  amount: number;
}

const blankLine = (): LineItem => ({
  itemId: '',
  description: '',
  qty: 1,
  mrpStr: '',
  unitRate: 0,
  amount: 0,
});

export default function NewPOPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);
  const [terms, setTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const [sRes, iRes] = await Promise.all([
      fetch('/api/suppliers'),
      fetch('/api/items'),
    ]);
    setSuppliers(await sRes.json());
    setItems(await iRes.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Line item helpers ──────────────────────────────────────

  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    setLines((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], ...patch };
      // Recalculate amount
      const currentQty = Number(updated.qty) || 0;
      updated.amount = Number((currentQty * updated.unitRate).toFixed(2));
      next[idx] = updated;
      return next;
    });
  };

  const selectItem = (idx: number, itemId: string) => {
    const item = items.find((i) => i._id === itemId);
    if (item) {
      updateLine(idx, {
        itemId,
        description: item.name,
        unitRate: item.unitRate,
        mrpStr: item.mrp != null ? String(item.mrp) : '',
      });
    } else {
      updateLine(idx, { itemId: '', description: '', unitRate: 0, mrpStr: '', amount: 0 });
    }
  };

  const addLine = () => setLines((prev) => [...prev, blankLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  // ── Totals ────────────────────────────────────────────────

  const basicAmount = Number(lines.reduce((s, l) => s + l.amount, 0).toFixed(2));
  const gstAmount = Number((basicAmount * taxRate / 100).toFixed(2));
  const grandTotal = Number((basicAmount + gstAmount).toFixed(2));

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Submit ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) { alert('Please select a supplier.'); return; }
    if (lines.some((l) => !l.itemId || !l.qty || Number(l.qty) <= 0 || l.unitRate <= 0)) {
      alert('Please complete all line items (select item, enter quantity and unit rate > 0).');
      return;
    }

    setSubmitting(true);
    const payload = {
      supplierId,
      lineItems: lines.map((l) => ({
        itemId: l.itemId,
        description: l.description,
        qty: Number(l.qty) || 0,
        mrp: l.mrpStr ? parseFloat(l.mrpStr) : undefined,
        unitRate: l.unitRate,
        amount: l.amount,
      })),
      basicAmount,
      taxRate,
      gstAmount,
      grandTotal,
      terms: terms.trim() || undefined,
    };

    const res = await fetch('/api/po', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const po = await res.json();
      router.push(`/po/${po._id}`);
    } else {
      const err = await res.json();
      alert(`Error: ${err.error ?? 'Failed to create PO'}`);
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">New Purchase Order</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below to generate a PO</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Header card: Supplier + Tax Rate ── */}
        <Card title="Order Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Supplier *">
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={selectCls}
              >
                <option value="">— Select supplier —</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="GST Rate (%) *">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        {/* ── Line items ── */}
        <Card title="Line Items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">#</th>
                  <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Item</th>
                  <th className="text-right pb-2 pr-3 font-semibold min-w-[100px] whitespace-nowrap">Qty</th>
                  <th className="text-right pb-2 pr-3 font-semibold min-w-[120px] whitespace-nowrap">MRP (INR)</th>
                  <th className="text-right pb-2 pr-3 font-semibold min-w-[120px] whitespace-nowrap">Unit Rate (INR)</th>
                  <th className="text-right pb-2 font-semibold min-w-[120px] whitespace-nowrap">Amount (INR)</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-3 text-gray-400 font-mono text-xs align-top pt-3">{idx + 1}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={line.itemId}
                        onChange={(e) => selectItem(idx, e.target.value)}
                        className={`${selectCls} min-w-[180px]`}
                      >
                        <option value="">— Select item —</option>
                        {items.map((item) => (
                          <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={line.qty}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateLine(idx, { qty: val === '' ? '' : parseInt(val) || 0 });
                        }}
                        className={`${inputCls} text-right min-w-[100px] w-full`}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.mrpStr}
                        onChange={(e) => updateLine(idx, { mrpStr: e.target.value })}
                        placeholder="—"
                        className={`${inputCls} text-right min-w-[120px] w-full`}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.unitRate || ''}
                        onChange={(e) =>
                          updateLine(idx, { unitRate: parseFloat(e.target.value) || 0 })
                        }
                        className={`${inputCls} text-right min-w-[120px] w-full`}
                      />
                    </td>
                    <td className="py-2 pr-3 text-right font-mono font-semibold text-gray-800 align-middle">
                      {fmt(line.amount)}
                    </td>
                    <td className="py-2 align-middle">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                          title="Remove row"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 text-[#0058a4] text-sm font-medium hover:underline"
          >
            + Add another item
          </button>
        </Card>

        {/* ── Terms & Totals ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card title="Terms &amp; Conditions">
            <textarea
              rows={5}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Optional — payment terms, delivery conditions, etc."
              className={`${inputCls} resize-none`}
            />
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setTerms("Only fresh stock will be accepted; expired or near-expiry material will be rejected.")}
                className="text-xs font-medium text-[#0058a4] hover:underline"
              >
                + Insert &quot;Fresh Stock&quot; clause
              </button>
            </div>
          </Card>

          <Card title="Summary">
            <div className="space-y-2">
              <SummaryRow label="Basic Amount" value={`INR ${fmt(basicAmount)}`} />
              <SummaryRow label={`GST (${taxRate}%)`} value={`INR ${fmt(gstAmount)}`} />
              <div className="border-t border-gray-200 pt-2 mt-2">
                <SummaryRow
                  label="Grand Total"
                  value={`INR ${fmt(grandTotal)}`}
                  bold
                />
              </div>
              {grandTotal > 0 && (
                <p className="text-xs italic text-gray-400 mt-3 leading-relaxed">
                  {numberToWords(grandTotal)}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ── Submit ── */}
        <div className="flex flex-wrap justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => router.push('/po')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-[#0058a4] text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition shadow disabled:opacity-50"
          >
            {submitting ? 'Creating PO…' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold text-[#0058a4]' : 'text-gray-700'}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058a4] focus:border-transparent transition';
const selectCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0058a4] focus:border-transparent transition';
