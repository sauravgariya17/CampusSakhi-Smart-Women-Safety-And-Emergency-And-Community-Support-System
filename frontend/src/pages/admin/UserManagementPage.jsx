import React, { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { UserAdminApi, ROLES } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";

export default function UserManagementPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [role, setRole] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (targetPage = 0) => {
    setLoading(true);
    UserAdminApi.listUsers({ role: role || undefined, keyword: keyword || undefined, page: targetPage, size: 15 })
      .then((data) => {
        setUsers(data.content || []);
        setPage(data.page);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(0);
  };

  const changeRole = async (userId, newRole) => {
    try {
      await UserAdminApi.updateRole(userId, newRole);
      toast.success(`User role updated to ${newRole}.`);
      load(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update role.");
    }
  };

  const toggleStatus = async (userId, active) => {
    try {
      await UserAdminApi.updateStatus(userId, active);
      toast.success(active ? "User account activated." : "User account suspended.");
      load(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update status.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div>
        <span className="cs-badge bg-violet-100 text-violet-700 mb-2">
          <Users size={13} /> Role-Based Access Control
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage campus roles (`USER`, `MODERATOR`, `SECURITY_STAFF`, `ADMIN`) and account activation status.
        </p>
      </div>

      <form onSubmit={handleSearch} className="cs-card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            className="cs-input pl-9"
            placeholder="Search by name or email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <select
          className="cs-input w-auto font-semibold"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit" className="cs-btn-primary">
          Search
        </button>
      </form>

      {loading ? (
        <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      ) : (
        <div className="cs-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold bg-white"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`cs-badge ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {u.active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(u.id, !u.active)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          u.active
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {u.active ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No users found matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            disabled={page === 0}
            onClick={() => load(page - 1)}
            className="cs-btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => load(page + 1)}
            className="cs-btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
