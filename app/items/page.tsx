'use client';
import { useState, useEffect, useCallback } from 'react';

interface Item {
  _id: string;
  name: string;
  unitRate: number;
  mrp?: number;
  taxRate: number;
}

const empty = { name: '', unitRate: '', mrp: '', taxRate: '18' };

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
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

  const openAdd = () => { setForm(empty); setEditingId(null); setModalOpen(true); };
  const openEdit = (item: Item) => {
    setForm({
      name: item.name,
      unitRate: String(item.unitRate),
      mrp: item.mrp != null ? String(item.mrp) : '',
      taxRate: String(item.taxRate),
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
          <h1 className="text-2xl font-bold text-gray-800">Items</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your product / material catalogue</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#0058a4] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition shadow"
        >
          + Add Item
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">No items yet</p>
          <p className="text-sm mt-1">Add materials or products to your catalogue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Item Name</th>
                <th className="text-right px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Unit Rate (INR)</th>
                <th className="text-right px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">MRP (INR)</th>
                <th className="text-right px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Tax Rate</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-800">{item.name}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">{fmt(item.unitRate)}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-500">
                    {item.mrp != null ? fmt(item.mrp) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <span className="inline-block bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                      {item.taxRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(item)} className="text-[#0058a4] text-xs font-medium hover:underline">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(item._id)} className="text-red-500 text-xs font-medium hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <Modal title={editingId ? 'Edit Item' : 'Add Item'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Item Name *">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. Optical Fibre Cable"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Unit Rate (INR) *">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitRate}
                  onChange={(e) => setForm({ ...form, unitRate: e.target.value })}
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
              <Field label="MRP (INR)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  className={inputCls}
                  placeholder="Optional"
                />
              </Field>
            </div>
            <Field label="Tax Rate (%) *">
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                className={inputCls}
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Saving…' : editingId ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Item?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className={btnSecondary}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className={btnDanger}>
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
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

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058a4] focus:border-transparent transition';
const btnPrimary =
  'flex-1 bg-[#0058a4] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-900 transition disabled:opacity-50';
const btnSecondary =
  'flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition';
const btnDanger =
  'flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50';
