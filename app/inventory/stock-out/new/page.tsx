'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Item { _id: string; name: string; unit: string; currentStock: number }
interface LineItem { itemId: string; qty: number | '' }

const blankLine = (): LineItem => ({ itemId: '', qty: 1 });

export default function StockOutNewPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [recipient, setRecipient] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const res = await fetch('/api/items');
    setItems(await res.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, blankLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const getItem = (id: string) => items.find((i) => i._id === id);

  const hasOverStock = lines.some((l) => {
    if (!l.itemId || !l.qty) return false;
    const item = getItem(l.itemId);
    return item && Number(l.qty) > item.currentStock;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) { alert('Please enter a recipient.'); return; }
    const validLines = lines.filter((l) => l.itemId && l.qty && Number(l.qty) > 0);
    if (validLines.length === 0) {
      alert('Please add at least one line item with a valid item and quantity.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: recipient.trim(),
        referenceNo: referenceNo.trim() || undefined,
        lineItems: validLines.map((l) => ({ itemId: l.itemId, qty: Number(l.qty) })),
        notes: notes.trim() || undefined,
      }),
    });

    if (res.ok) {
      router.push('/inventory/stock-out');
    } else {
      const err = await res.json();
      alert(`Error: ${err.error ?? 'Failed to create dispatch'}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/inventory/stock-out" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#0058a4] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Stock Out
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">New Dispatch</h1>
        <p className="text-slate-500 text-sm mt-1">Record outgoing stock sent to a recipient</p>
      </div>

      {hasOverStock && (
        <Alert variant="destructive" className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Stock Warning</AlertTitle>
          <AlertDescription className="text-amber-700">
            One or more items exceed current stock levels. You can still submit — stock counts may lag reality.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Dispatch Details</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-xs uppercase tracking-wide text-slate-600">Recipient <span className="text-red-500">*</span></Label>
                <Input
                  id="recipient"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Site A, Client Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNo" className="text-xs uppercase tracking-wide text-slate-600">Reference #</Label>
                <Input
                  id="referenceNo"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center min-w-[3rem]">#</TableHead>
                    <TableHead className="min-w-[200px]">Item</TableHead>
                    <TableHead className="w-32 text-right min-w-[6rem]">Qty</TableHead>
                    <TableHead className="w-32 text-right min-w-[8rem]">In Stock</TableHead>
                    <TableHead className="w-12 min-w-[3rem]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => {
                    const selectedItem = getItem(line.itemId);
                    const qty = Number(line.qty) || 0;
                    const overStock = !!(selectedItem && qty > 0 && qty > selectedItem.currentStock);
                    return (
                      <TableRow key={idx} className="hover:bg-slate-50/50">
                        <TableCell className="text-center text-slate-400 font-mono text-xs align-middle">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="align-middle">
                          <select
                            value={line.itemId}
                            onChange={(e) => updateLine(idx, { itemId: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-w-[160px]"
                          >
                            <option value="">&mdash; Select item &mdash;</option>
                            {items.map((item) => (
                              <option key={item._id} value={item._id}>{item.name}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="align-middle w-32">
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(idx, {
                                qty: e.target.value === '' ? '' : parseInt(e.target.value) || 0,
                              })
                            }
                            className="h-9 text-right min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          {selectedItem ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-baseline space-x-1">
                                <span className={`font-mono text-sm font-semibold ${overStock ? 'text-red-600' : 'text-slate-700'}`}>
                                  {selectedItem.currentStock}
                                </span>
                                <span className="text-slate-400 text-xs">{selectedItem.unit}</span>
                              </div>
                              {overStock && (
                                <span className="text-red-500 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                                  ⚠ Exceeds stock
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center align-middle">
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
                    );
                  })}
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

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              placeholder="Optional notes about this dispatch"
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-3 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/inventory/stock-out')}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="px-8 bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm"
          >
            {submitting ? 'Creating Dispatch...' : 'Create Dispatch'}
          </Button>
        </div>
      </form>
    </div>
  );
}
