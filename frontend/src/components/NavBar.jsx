import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Menu,
  X,
  Compass,
  MessageSquareHeart,
  FileWarning,
  ClipboardList,
  Users,
  Siren,
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  Flag,
  UserCog,
  FileClock,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_BADGES = {
  USER: { label: "Student", cls: "bg-violet-500/20 text-violet-200 border-violet-400/30" },
  MODERATOR: { label: "Moderator", cls: "bg-teal-500/20 text-teal-200 border-teal-400/30" },
  SECURITY_STAFF: { label: "Security Staff", cls: "bg-amber-500/20 text-amber-200 border-amber-400/30" },
  ADMIN: { label: "Admin", cls: "bg-rose-500/20 text-rose-200 border-rose-400/30" },
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isStaff = ["MODERATOR", "ADMIN"].includes(user.role);
  const isAdmin = user.role === "ADMIN";
  const isSecurity = ["SECURITY_STAFF", "ADMIN"].includes(user.role);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate("/login");
  };

  const primaryLinks = [
    { to: "/dashboard", label: "Safety Hub", icon: Sparkles },
    { to: "/community", label: "Community", icon: MessageSquareHeart },
    { to: "/journey", label: "Journey Mode", icon: Compass },
    { to: "/incidents/report", label: "Report Incident", icon: FileWarning },
    { to: "/incidents/mine", label: "My Reports", icon: ClipboardList },
    { to: "/contacts", label: "Trusted Circle", icon: Users },
    { to: "/sos/history", label: "SOS Log", icon: Siren },
  ];

  const governanceLinks = [
    ...(isStaff
      ? [
          { to: "/admin/dashboard", label: "Admin Overview", icon: LayoutDashboard },
          { to: "/admin/moderation", label: "Moderation Queue", icon: Flag },
          { to: "/admin/incidents", label: "Incident Queue", icon: ClipboardList },
          { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        ]
      : []),
    ...(isSecurity ? [{ to: "/admin/security", label: "SOS Dispatch", icon: ShieldAlert }] : []),
    ...(isAdmin
      ? [
          { to: "/admin/users", label: "Users", icon: UserCog },
          { to: "/admin/audit-logs", label: "Audit Log", icon: FileClock },
        ]
      : []),
  ];

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path + "/"));

  const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES.USER;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-950/50 group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-base tracking-tight text-white block">
                CampusSakhi
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                GEHU Safety Network
              </span>
            </div>
          </Link>

          {/* Desktop Primary Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleBadge.cls}`}
            >
              {roleBadge.label}
            </span>
            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive("/profile")
                  ? "bg-slate-800 border-violet-500 text-white"
                  : "bg-slate-800/70 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
              }`}
              title="Your anonymous community handle & private profile"
            >
              <User size={14} className="text-violet-400" />
              <span>u/{user.anonymousHandle}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Log out"
            >
              <LogOut size={14} />
              <span className="hidden xl:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Governance Sub-bar on Desktop for Staff / Security / Admin */}
        {governanceLinks.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 py-2 border-t border-slate-800/80 text-xs overflow-x-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
              <ShieldAlert size={13} className="text-amber-400" /> Governance Console:
            </span>
            {governanceLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-teal-600 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon size={13} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-800/90 rounded-xl p-3">
            <div>
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-violet-300 font-medium">u/{user.anonymousHandle}</p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleBadge.cls}`}
            >
              {roleBadge.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    active
                      ? "bg-violet-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                isActive("/profile")
                  ? "bg-violet-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <User size={15} />
              My Profile
            </Link>
          </div>

          {governanceLinks.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Governance & Staff Tools
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {governanceLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                        active
                          ? "bg-teal-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/20"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
