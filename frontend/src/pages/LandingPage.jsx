import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Siren,
  Compass,
  Sparkles,
  MessageSquareHeart,
  Lock,
  ArrowRight,
  PhoneCall,
  MapPin,
  CheckCircle2,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: Siren,
    title: "Two-Stage Emergency SOS",
    desc: "8-second countdown confirmation prevents accidental triggers while dispatching instant alerts to your Trusted Circle and Campus Security.",
    tone: "from-rose-500 to-red-600",
    badge: "Real-Time Dispatch",
  },
  {
    icon: Compass,
    title: "Live Campus Journey Mode",
    desc: "Walk across GEHU Clement Town with live route tracking, shareable token-based links for family/friends, and automatic overdue escalation.",
    tone: "from-violet-600 to-indigo-600",
    badge: "2.0 km Geofenced",
  },
  {
    icon: Sparkles,
    title: "AI-Assisted Incident Triage",
    desc: "Describe an incident and let our NLP classifier suggest category, priority, and summary before you choose your exact privacy visibility.",
    tone: "from-teal-500 to-emerald-600",
    badge: "Reporter in Control",
  },
  {
    icon: EyeOff,
    title: "Zero-PII Anonymous Community",
    desc: "Every student receives a non-identifying handle (e.g., u/Brave_4821). Share safety tips, warnings, and peer support without exposing your real name.",
    tone: "from-fuchsia-500 to-purple-600",
    badge: "Privacy by Design",
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">CampusSakhi</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 font-medium">
                GEHU Clement Town
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/40 transition-all"
              >
                Open Safety Hub <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/40 transition-all"
                >
                  Join Platform <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-slate-950 to-slate-950 pointer-events-none" />
          <div className="max-w-5xl mx-auto relative text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-6">
              <Lock size={13} /> Smart Women Safety, Emergency & Community Support System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Walk Fearlessly Across Campus with{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-teal-300 bg-clip-text text-transparent">
                CampusSakhi
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Purpose-built for Graphic Era Hill University (Clement Town). Combining two-stage
              SOS dispatch, live walkable journey check-ins, AI-assisted incident triage, and
              privacy-preserving peer support.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-xl shadow-violet-900/50 transition-all"
              >
                {user ? "Go to Safety Hub" : "Sign In to CampusSakhi"} <ArrowRight size={17} />
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm transition-all"
                >
                  Create Student Account
                </Link>
              )}
            </div>

            {/* Trust & Architecture Pills */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={14} className="text-teal-400" /> FastAPI + SQLAlchemy Backend
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
                <MapPin size={14} className="text-violet-400" /> GEHU Clement Town 2 km Geofence
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
                <EyeOff size={14} className="text-fuchsia-400" /> k-Anonymity Area Protection (k ≥ 3)
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.tone} flex items-center justify-center shadow-md`}
                      >
                        <Icon size={22} className="text-white" />
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Emergency Helpline Banner */}
          <div className="mt-10 bg-gradient-to-r from-slate-900 via-violet-950/50 to-slate-900 border border-violet-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <PhoneCall size={20} className="text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Campus Security & National Emergency Numbers
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  CampusSakhi alerts your Trusted Circle and GEHU Security Desk. In life-threatening
                  situations outside campus, always dial <strong>112</strong> (National Emergency) or{" "}
                  <strong>1090 / 181</strong> (Women Helpline).
                </p>
              </div>
            </div>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="shrink-0 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Launch Dashboard
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        CampusSakhi v2.0 — Powered by Python FastAPI & React • Graphic Era Hill University (Clement Town)
      </footer>
    </div>
  );
}
