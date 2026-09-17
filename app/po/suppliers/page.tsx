'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

interface Supplier {
  _id: string;
  name: string;
  address: string;
  gstn?: string;
}

const empty = { name: '', address: '', gstn: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/suppliers');
    setSuppliers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(empty); setEditingId(null); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, address: s.address, gstn: s.gstn ?? '' });
    setEditingId(s._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
    const method = editingId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/suppliers/${deleteId}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your supplier directory</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-[#0058a4] hover:bg-[#0058a4]/90 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Supplier
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          Loading...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Factory className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-900 mb-1">No suppliers yet</p>
          <p className="text-sm">
            <button onClick={openAdd} className="text-[#0058a4] hover:underline font-medium">
              Add your first supplier &rarr;
            </button>
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Supplier Name</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">Address</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600 h-11">GSTIN</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s._id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-800">{s.name}</TableCell>
                    <TableCell className="text-slate-600 max-w-xs">
                      <span className="line-clamp-2">{s.address}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                      {s.gstn || <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        className="text-[#0058a4] hover:text-[#0058a4] hover:bg-[#0058a4]/10 h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(s._id)}
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

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. ABC Traders Pvt. Ltd."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
              <Textarea
                id="address"
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address including city and pin"
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstn">GSTIN</Label>
              <Input
                id="gstn"
                value={form.gstn}
                onChange={(e) => setForm({ ...form, gstn: e.target.value })}
                className="font-mono"
                placeholder="e.g. 07AAAAA0000A1ZX"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0058a4] hover:bg-[#0058a4]/90" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 py-4">
            This action cannot be undone. Are you sure you want to remove this supplier?
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
