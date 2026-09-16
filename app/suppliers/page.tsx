'use client';
import { useState, useEffect, useCallback } from 'react';

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
          <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your supplier directory</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#0058a4] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors shadow"
        >
          + Add Supplier
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏭</p>
          <p className="font-medium">No suppliers yet</p>
          <p className="text-sm mt-1">Add your first supplier to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Supplier Name</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">Address</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold whitespace-nowrap">GSTIN</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s) => (
                <tr key={s._id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-800">{s.name}</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs">
                    <span className="line-clamp-2">{s.address}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                    {s.gstn || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-[#0058a4] text-xs font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(s._id)}
                      className="text-red-500 text-xs font-medium hover:underline"
                    >
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
        <Modal title={editingId ? 'Edit Supplier' : 'Add Supplier'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Supplier Name *">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. ABC Traders Pvt. Ltd."
              />
            </Field>
            <Field label="Address *">
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
                placeholder="Full address including city and pin"
              />
            </Field>
            <Field label="GSTIN">
              <input
                value={form.gstn}
                onChange={(e) => setForm({ ...form, gstn: e.target.value })}
                className={`${inputCls} font-mono`}
                placeholder="e.g. 07AAAAA0000A1ZX"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Saving…' : editingId ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Supplier?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-gray-500 mb-6">
            This action cannot be undone. Are you sure you want to remove this supplier?
          </p>
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

// ── Shared UI helpers ─────────────────────────────────────────────────────────

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
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
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
