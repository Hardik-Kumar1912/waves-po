'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface Item {
  _id: string;
  name: string;
  unitRate: number;
  mrp?: number;
  taxRate: number;
  unit: string;
  unitsPerCarton: number;
  currentStock: number;
  lowStockThreshold?: number;
}

const emptyForm = {
  name: '',
  unitRate: '',
  mrp: '',
  taxRate: '18',
  unit: 'pcs',
  unitsPerCarton: '1',
  lowStockThreshold: '',
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/items');
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (item: Item) => {
    setForm({
      name: item.name,
      unitRate: String(item.unitRate),
      mrp: item.mrp != null ? String(item.mrp) : '',
      taxRate: String(item.taxRate),
      unit: item.unit ?? 'pcs',
      unitsPerCarton: String(item.unitsPerCarton ?? 1),
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : '',
    });
    setEditingId(item._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      unitRate: parseFloat(form.unitRate),
      mrp: form.mrp ? parseFloat(form.mrp) : undefined,
      taxRate: parseFloat(form.taxRate),
      unit: form.unit.trim() || 'pcs',
      unitsPerCarton: parseInt(form.unitsPerCarton) || 1,
      lowStockThreshold: form.lowStockThreshold ? parseFloat(form.lowStockThreshold) : undefined,
    };
    const url = editingId ? `/api/items/${editingId}` : '/api/items';
    const method = editingId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/items/${deleteId}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Items Catalogue</h1>
          <p className="text-slate-500 text-sm mt-1">
            Shared across Purchase Orders and Inventory &middot; {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-900 mb-1">No items yet</p>
          <p className="text-sm">
            <button onClick={openAdd} className="text-[#0058a4] hover:underline font-medium">
              Add materials or products to your catalogue &rarr;
            </button>
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[780px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Item Name</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">Unit Rate (INR)</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">MRP (INR)</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">Tax</TableHead>
                  <TableHead className="whitespace-nowrap text-center font-semibold text-slate-600 h-11">Unit</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">Ctn Size</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-semibold text-slate-600 h-11">In Stock</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isLow =
                    item.lowStockThreshold != null && item.currentStock <= item.lowStockThreshold;
                  return (
                    <TableRow key={item._id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-800">{item.name}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">{fmt(item.unitRate)}</TableCell>
                      <TableCell className="text-right font-mono text-slate-500">
                        {item.mrp != null ? fmt(item.mrp) : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-transparent rounded-full px-2 py-0.5 text-xs font-semibold">
                          {item.taxRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-xs">{item.unit ?? 'pcs'}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-500">
                        {item.unitsPerCarton ?? 1}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className={`font-mono font-semibold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                          {item.currentStock ?? 0}
                        </span>
                        {isLow && (
                          <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100 px-1.5 py-0 border-transparent rounded-sm text-[10px] uppercase font-bold">
                            Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                          className="text-[#0058a4] hover:text-[#0058a4] hover:bg-[#0058a4]/10 h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(item._id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Optical Fibre Cable"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitRate">Unit Rate (INR) <span className="text-red-500">*</span></Label>
                <Input
                  id="unitRate"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitRate}
                  onChange={(e) => setForm({ ...form, unitRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (INR)</Label>
                <Input
                  id="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%) <span className="text-red-500">*</span></Label>
                <Input
                  id="taxRate"
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="pcs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitsPerCarton">Units per Carton</Label>
                <Input
                  id="unitsPerCarton"
                  type="number"
                  min="1"
                  step="1"
                  value={form.unitsPerCarton}
                  onChange={(e) => setForm({ ...form, unitsPerCarton: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  step="1"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              Current stock is managed automatically by Stock In / Dispatch operations.
            </p>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0058a4] hover:bg-[#0058a4]/90" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 py-4">This action cannot be undone.</p>
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
