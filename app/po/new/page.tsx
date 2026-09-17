'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { numberToWords } from '@/lib/numberToWords';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Supplier { _id: string; name: string }
interface Item { _id: string; name: string; unitRate: number; mrp?: number; taxRate: number }

interface LineItem {
  itemId: string;
  description: string;
  qty: number | '';
  mrpStr: string;
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
        <h1 className="text-2xl font-bold text-slate-900">New Purchase Order</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the details below to generate a PO</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Header card: Supplier + Tax Rate ── */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-xs uppercase tracking-wide text-slate-600">Supplier <span className="text-red-500">*</span></Label>
                <select
                  id="supplier"
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">&mdash; Select supplier &mdash;</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-xs uppercase tracking-wide text-slate-600">GST Rate (%) <span className="text-red-500">*</span></Label>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Line items ── */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center min-w-[3rem]">#</TableHead>
                    <TableHead className="min-w-[200px]">Item</TableHead>
                    <TableHead className="w-28 text-right min-w-[6rem]">Qty</TableHead>
                    <TableHead className="w-32 text-right min-w-[8rem]">MRP (INR)</TableHead>
                    <TableHead className="w-32 text-right min-w-[8rem]">Unit Rate (INR)</TableHead>
                    <TableHead className="w-32 text-right min-w-[8rem]">Amount (INR)</TableHead>
                    <TableHead className="w-12 min-w-[3rem]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell className="text-center text-slate-400 font-mono text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <select
                          value={line.itemId}
                          onChange={(e) => selectItem(idx, e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px]"
                        >
                          <option value="">&mdash; Select item &mdash;</option>
                          {items.map((item) => (
                            <option key={item._id} value={item._id}>{item.name}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={line.qty}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateLine(idx, { qty: val === '' ? '' : parseInt(val) || 0 });
                          }}
                          className="h-9 text-right min-w-[80px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.mrpStr}
                          onChange={(e) => updateLine(idx, { mrpStr: e.target.value })}
                          placeholder="—"
                          className="h-9 text-right min-w-[100px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unitRate || ''}
                          onChange={(e) => updateLine(idx, { unitRate: parseFloat(e.target.value) || 0 })}
                          className="h-9 text-right min-w-[100px]"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-800">
                        {fmt(line.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {lines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(idx)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addLine}
                className="text-[#0058a4] hover:text-[#0058a4] hover:bg-[#0058a4]/10 h-8"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add another item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Terms & Totals ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Terms &amp; Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-3">
              <Textarea
                rows={5}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Optional — payment terms, delivery conditions, etc."
                className="resize-none"
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setTerms("Only fresh stock will be accepted; expired or near-expiry material will be rejected.")}
                  className="text-xs font-medium text-[#0058a4] hover:underline"
                >
                  + Insert &quot;Fresh Stock&quot; clause
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Basic Amount</span>
                  <span className="font-mono">INR {fmt(basicAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>GST ({taxRate}%)</span>
                  <span className="font-mono">INR {fmt(gstAmount)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex justify-between text-sm font-bold text-[#0058a4]">
                    <span>Grand Total</span>
                    <span className="font-mono text-base">INR {fmt(grandTotal)}</span>
                  </div>
                </div>
                {grandTotal > 0 && (
                  <p className="text-xs italic text-slate-400 mt-3 leading-relaxed">
                    {numberToWords(grandTotal)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Submit ── */}
        <div className="flex flex-wrap justify-end gap-3 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/po')}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="px-8 bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm"
          >
            {submitting ? 'Creating PO...' : 'Create Purchase Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
