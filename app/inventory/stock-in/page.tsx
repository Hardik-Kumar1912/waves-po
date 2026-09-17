'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, ArrowDownToLine, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface PopItem { name: string; unit: string }
interface PopSupplier { name: string }
interface StockInRow {
  _id: string;
  date: string;
  itemId: PopItem;
  cartons: number;
  unitsPerCarton: number;
  totalUnits: number;
  supplierId?: PopSupplier;
  referenceNo?: string;
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

export default function StockInListPage() {
  const [records, setRecords] = useState<StockInRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/stock-in');
    setRecords(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/stock-in/${deleteId}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock In</h1>
          <p className="text-slate-500 text-sm mt-1">
            {records.length} record{records.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/inventory/stock-in/new">
          <Button className="bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Stock In
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          Loading...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ArrowDownToLine className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-900 mb-1">No stock-in records yet</p>
          <p className="text-sm">
            <Link href="/inventory/stock-in/new" className="text-[#0058a4] hover:underline font-medium">
              Record your first stock-in &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Item</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">Cartons</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">Units/Ctn</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">Total Units</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Supplier</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Ref #</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r._id} className="hover:bg-slate-50/50">
                    <TableCell className="text-slate-600">{fmtDate(r.date)}</TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {r.itemId?.name ?? '—'}
                      {r.itemId?.unit && (
                        <span className="text-slate-400 text-xs ml-1">({r.itemId.unit})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-600">
                      {r.cartons}
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-600">
                      {r.unitsPerCarton}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-[#0058a4]">
                      {r.totalUnits}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {r.supplierId?.name ?? <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">
                      {r.referenceNo ?? <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(r._id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stock-In Record?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 py-4">
            This will reverse the stock adjustment for this entry. Are you sure?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
