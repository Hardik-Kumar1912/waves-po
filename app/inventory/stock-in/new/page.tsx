'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Item { _id: string; name: string; unit: string; unitsPerCarton: number }
interface Supplier { _id: string; name: string }

export default function StockInNewPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemId, setItemId] = useState('');
  const [cartons, setCartons] = useState<number | ''>('');
  const [unitsPerCarton, setUnitsPerCarton] = useState<number | ''>(1);
  const [supplierId, setSupplierId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalUnits = (Number(cartons) || 0) * (Number(unitsPerCarton) || 0);

  const loadData = useCallback(async () => {
    const [iRes, sRes] = await Promise.all([fetch('/api/items'), fetch('/api/suppliers')]);
    setItems(await iRes.json());
    setSuppliers(await sRes.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectItem = (id: string) => {
    setItemId(id);
    const item = items.find((i) => i._id === id);
    setUnitsPerCarton(item?.unitsPerCarton ?? 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) { alert('Please select an item.'); return; }
    if (!cartons || Number(cartons) <= 0) { alert('Please enter a valid number of cartons.'); return; }
    if (!unitsPerCarton || Number(unitsPerCarton) <= 0) { alert('Units per carton must be > 0.'); return; }

    setSubmitting(true);
    const res = await fetch('/api/stock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId,
        cartons: Number(cartons),
        unitsPerCarton: Number(unitsPerCarton),
        supplierId: supplierId || undefined,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });

    if (res.ok) {
      router.push('/inventory/stock-in');
    } else {
      const err = await res.json();
      alert(`Error: ${err.error ?? 'Failed to record stock-in'}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/inventory/stock-in" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#0058a4] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Stock In
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Record Stock In</h1>
        <p className="text-slate-500 text-sm mt-1">Record goods received by carton</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Item &amp; Quantity</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item" className="text-xs uppercase tracking-wide text-slate-600">Item <span className="text-red-500">*</span></Label>
              <select
                id="item"
                required
                value={itemId}
                onChange={(e) => selectItem(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">&mdash; Select item &mdash;</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cartons" className="text-xs uppercase tracking-wide text-slate-600">Cartons <span className="text-red-500">*</span></Label>
                <Input
                  id="cartons"
                  type="number"
                  min={1}
                  step={1}
                  value={cartons}
                  onChange={(e) =>
                    setCartons(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitsPerCarton" className="text-xs uppercase tracking-wide text-slate-600">Units / Carton</Label>
                <Input
                  id="unitsPerCarton"
                  type="number"
                  min={1}
                  step={1}
                  value={unitsPerCarton}
                  onChange={(e) =>
                    setUnitsPerCarton(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalUnits" className="text-xs uppercase tracking-wide text-slate-600">Total Units</Label>
                <div
                  id="totalUnits"
                  className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background text-right font-mono font-semibold text-[#0058a4] cursor-default"
                >
                  {totalUnits}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Optional Details</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier" className="text-xs uppercase tracking-wide text-slate-600">Supplier</Label>
              <select
                id="supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">&mdash; None &mdash;</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNo" className="text-xs uppercase tracking-wide text-slate-600">Reference #</Label>
              <Input
                id="referenceNo"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. PO-2026-001, invoice number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs uppercase tracking-wide text-slate-600">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                placeholder="Optional notes"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-3 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/inventory/stock-in')}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="px-8 bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm"
          >
            {submitting ? 'Recording...' : 'Record Stock In'}
          </Button>
        </div>
      </form>
    </div>
  );
}
