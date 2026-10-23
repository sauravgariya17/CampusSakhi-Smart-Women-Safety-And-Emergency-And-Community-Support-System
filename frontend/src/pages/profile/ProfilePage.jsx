import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  ShieldCheck,
  EyeOff,
  Lock,
  Users,
  ClipboardList,
  Siren,
  Mail,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
            <User size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Account & Privacy Profile</h1>
            <p className="text-xs text-slate-500">
              Manage how your private identity is separated from your public community handle.
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* Dual Identity Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Private Identity Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Lock size={14} className="text-teal-600" /> Private Account Identity
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Never Public
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Full Name</span>
              <span className="font-bold text-slate-900">{user.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Mail size={13} /> Email
              </span>
              <span className="font-medium text-slate-800">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Award size={13} /> Platform Role
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {user.role}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            Your real name is used strictly when dispatching emergency SOS notifications to your
            Trusted Circle or when you explicitly choose{" "}
            <strong>Share identity with admins only</strong> on a formal incident report.
          </p>
        </div>

        {/* Public Anonymous Identity Card */}
        <div className="bg-gradient-to-br from-slate-900 to-violet-950 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-300">
                <EyeOff size={14} /> Public Community Identity
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/30">
                Zero-PII Handle
              </span>
            </div>

            <div className="my-4 p-4 rounded-xl bg-white/10 border border-white/15 text-center">
              <span className="text-xs text-violet-200 block mb-1">Active Handle</span>
              <span className="text-2xl font-mono font-extrabold tracking-tight text-white">
                u/{user.anonymousHandle}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every post, comment, and vote you make in the CampusSakhi Community is attributed
              exclusively to <strong>u/{user.anonymousHandle}</strong>. Even community moderators
              reviewing flagged posts only see this handle.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-emerald-300 font-medium">
              <ShieldCheck size={15} /> Anonymity Boundary Enforced
            </span>
            <Link to="/community" className="text-violet-200 hover:text-white font-semibold underline">
              Visit Community →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          to="/contacts"
          className="bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Users size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Trusted Circle</h3>
            <p className="text-xs text-slate-500">Manage up to 5 emergency contacts</p>
          </div>
        </Link>

        <Link
          to="/incidents/mine"
          className="bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ClipboardList size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Incident Reports</h3>
            <p className="text-xs text-slate-500">Track status of submitted reports</p>
          </div>
        </Link>

        <Link
          to="/sos/history"
          className="bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Siren size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">SOS History</h3>
            <p className="text-xs text-slate-500">Review past emergency dispatches</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
