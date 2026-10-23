import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Phone,
  Mail,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { ContactApi } from "../../api/contactApi";
import { useToast } from "../../context/ToastContext";

const MAX_CONTACTS = 5;

export default function TrustedContactsPage() {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    relation: "",
    priority: 1,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    ContactApi.getAll()
      .then((data) => setContacts(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: field === "priority" ? Number(e.target.value) : e.target.value,
    }));

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      relation: "",
      priority: Math.min(MAX_CONTACTS, contacts.length + 1),
    });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      relation: c.relation || "",
      priority: c.priority || 1,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        relation: form.relation.trim() || null,
        priority: form.priority || 1,
      };
      if (editingId) {
        await ContactApi.update(editingId, payload);
        toast.success("Trusted contact updated.");
      } else {
        await ContactApi.create(payload);
        toast.success("Trusted contact added to your circle.");
      }
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save contact.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await ContactApi.remove(id);
      toast.info("Trusted contact removed.");
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete contact.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Trusted Circle Contacts</h1>
            <p className="text-xs text-slate-500">
              Notified automatically when you confirm an SOS and selectable for live Journey Mode tracking.
            </p>
          </div>
        </div>

        {contacts.length < MAX_CONTACTS && !showForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
          >
            <Plus size={16} /> Add Trusted Contact
          </button>
        )}
      </div>

      {/* Capacity Progress Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>Trusted Circle Capacity</span>
          <span className="text-violet-700 font-bold">
            {contacts.length} of {MAX_CONTACTS} Contacts Configured
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all"
            style={{ width: `${(contacts.length / MAX_CONTACTS) * 100}%` }}
          />
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-violet-200 rounded-2xl p-5 space-y-4 mb-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              {editingId ? "Edit Trusted Contact" : "Add New Trusted Contact"}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                required
                placeholder="e.g. Sunita Sharma"
                className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
                value={form.name}
                onChange={update("name")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                required
                placeholder="+91 9876543210"
                className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
                value={form.phone}
                onChange={update("phone")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address (for SOS Email Dispatch)
              </label>
              <input
                type="email"
                placeholder="parent@example.com"
                className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
                value={form.email}
                onChange={update("email")}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship
                </label>
                <input
                  placeholder="Mother, Roommate..."
                  className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
                  value={form.relation}
                  onChange={update("relation")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority (1-5)
                </label>
                <select
                  className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
                  value={form.priority}
                  onChange={update("priority")}
                >
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>
                      #{p} {p === 1 ? "(Primary)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update Contact" : "Save Contact"}
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
          Loading your trusted circle...
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <HeartHandshake size={38} className="mx-auto text-violet-400 mb-2" />
          <h3 className="text-base font-bold text-slate-900">Your Trusted Circle is empty</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Add parents, guardians, hostel wardens, or close friends so they can receive your SOS
            alerts and live Journey Mode links.
          </p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500"
          >
            <Plus size={15} /> Add Your First Trusted Contact
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                  #{c.priority || 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{c.name}</h3>
                    {c.relation && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {c.relation}
                      </span>
                    )}
                    {c.email ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> Email Alert Ready
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        No email on file
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" /> {c.phone}
                    </span>
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" /> {c.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => openEditForm(c)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Edit3 size={13} /> Edit
                </button>
                {confirmDeleteId === c.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                    >
                      Confirm Remove
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(c.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
