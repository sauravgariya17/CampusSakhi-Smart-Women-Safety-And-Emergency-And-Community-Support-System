import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const DEMO_ACCOUNTS = [
  { label: "Student", email: "student@gehu.ac.in", pass: "Safety@123", role: "USER" },
  { label: "Moderator", email: "moderator@gehu.ac.in", pass: "Safety@123", role: "MODERATOR" },
  { label: "Security", email: "security@gehu.ac.in", pass: "Safety@123", role: "SECURITY_STAFF" },
  { label: "Admin", email: "admin@gehu.ac.in", pass: "Safety@123", role: "ADMIN" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/welcome" className="flex items-center justify-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div className="text-left">
            <span className="text-xl font-extrabold text-white tracking-tight block">
              CampusSakhi
            </span>
            <span className="text-[11px] font-medium text-violet-300 uppercase tracking-wider block">
              GEHU Smart Safety Platform
            </span>
          </div>
        </Link>

        <h1 className="mt-6 text-center text-2xl font-extrabold text-white">
          Sign in to your safety account
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-400">
          Your real identity remains private; community interactions use your anonymous handle.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl py-7 px-6 shadow-2xl sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                University or Registered Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  required
                  placeholder="name@gehu.ac.in"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs rounded-xl p-3">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/40 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"} <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick-fill Demo Role Selector for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-violet-400" /> Quick-Fill Demo Roles (Testing)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-violet-600/30 border border-slate-700 hover:border-violet-500/50 text-xs font-medium text-slate-200 transition-colors"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            New to CampusSakhi?{" "}
            <Link to="/register" className="text-violet-400 font-semibold hover:underline">
              Create your student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
