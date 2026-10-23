import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const hasMinLen = form.password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(form.password);
  const hasDigit = /\d/.test(form.password);
  const hasSymbol = /[@$!%*#?&]/.test(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const createdUser = await register(form);
      toast.success(`Account created! Your anonymous handle is u/${createdUser.anonymousHandle}`);
      navigate("/dashboard");
    } catch (err) {
      const messages = err?.response?.data?.errors;
      setError(
        messages?.join(", ") ||
          err?.response?.data?.message ||
          "Could not register. Please verify all fields and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/welcome" className="flex items-center justify-center gap-2.5">
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
          Create your safety account
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-400">
          We'll automatically assign you a private anonymous handle (e.g.,{" "}
          <span className="text-violet-300 font-mono">u/SafeVoice_4821</span>) at registration.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl py-7 px-6 shadow-2xl sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name (Private — for SOS & Trusted Contacts only)
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Ananya Sharma"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  value={form.name}
                  onChange={update("name")}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  required
                  type="email"
                  placeholder="ananya@gehu.ac.in"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  value={form.email}
                  onChange={update("email")}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Strong Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="8+ chars, letter, number & @$!%*#?&"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  value={form.password}
                  onChange={update("password")}
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

              <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
                <span className={`flex items-center gap-1 ${hasMinLen ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={12} /> 8+ characters
                </span>
                <span className={`flex items-center gap-1 ${hasLetter ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={12} /> At least 1 letter
                </span>
                <span className={`flex items-center gap-1 ${hasDigit ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={12} /> At least 1 digit
                </span>
                <span className={`flex items-center gap-1 ${hasSymbol ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 size={12} /> Symbol (@$!%*#?&)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number (Optional — for Campus Security SOS callbacks)
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  value={form.phone}
                  onChange={update("phone")}
                />
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
              {loading ? "Creating account..." : "Create Account"} <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">
            Already registered?{" "}
            <Link to="/login" className="text-violet-400 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
