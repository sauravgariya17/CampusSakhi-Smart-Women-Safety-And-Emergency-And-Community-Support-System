import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Compass,
  FileWarning,
  Users,
  MessageSquareHeart,
  Siren,
  ArrowRight,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  Lock,
  ShieldAlert,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SosApi } from "../../api/sosApi";
import { JourneyApi } from "../../api/journeyApi";
import { ContactApi } from "../../api/contactApi";
import { IncidentApi } from "../../api/incidentApi";
import { MapApi } from "../../api/mapApi";

export default function SafetyHubDashboard() {
  const { user } = useAuth();
  const [activeSos, setActiveSos] = useState(null);
  const [activeJourney, setActiveJourney] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      SosApi.getActive().catch(() => null),
      JourneyApi.getActive().catch(() => null),
      ContactApi.getAll().catch(() => []),
      IncidentApi.getMine().catch(() => []),
      MapApi.getSafeZones().catch(() => []),
    ])
      .then(([sosData, journeyData, contactList, incidentList, zoneList]) => {
        setActiveSos(sosData);
        setActiveJourney(journeyData);
        setContacts(contactList || []);
        setIncidents(incidentList || []);
        setSafeZones(zoneList || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const isStaff = ["MODERATOR", "ADMIN", "SECURITY_STAFF"].includes(user.role);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-violet-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-semibold mb-3">
              <ShieldCheck size={14} /> CampusSakhi Safety Command Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-xl">
              Your public community identity is protected as{" "}
              <span className="font-mono font-semibold text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-500/30">
                u/{user.anonymousHandle}
              </span>
              . Use the quick actions below to start a tracked walk, manage your trusted circle, or report a concern.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/journey"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-950/50 transition-all"
            >
              <Compass size={16} />
              {activeJourney ? "View Active Journey" : "Start Safe Journey"}
            </Link>
            <Link
              to="/incidents/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition-all"
            >
              <FileWarning size={16} /> Report Incident
            </Link>
          </div>
        </div>
      </div>

      {/* Live Status Banner if SOS or Journey is Active */}
      {(activeSos || activeJourney) && (
        <div className="grid md:grid-cols-2 gap-4">
          {activeSos && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Siren size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    Active Emergency SOS ({activeSos.status})
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Category: {activeSos.category.replace(/_/g, " ")}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeSos.notes || "Use the bottom emergency bar to confirm or mark yourself safe."}
                  </p>
                </div>
              </div>
              <Link
                to="/sos/history"
                className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shrink-0"
              >
                SOS Log
              </Link>
            </div>
          )}

          {activeJourney && (
            <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Compass size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Active Safety Journey
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Expected Arrival: {new Date(activeJourney.expectedArrival).toLocaleTimeString()}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Sharing live updates with {activeJourney.notifiedContactNames?.length || 0} trusted contact(s).
                  </p>
                </div>
              </div>
              <Link
                to="/journey"
                className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shrink-0"
              >
                Open Map
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/contacts"
          className="bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trusted Circle
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {loading ? "—" : `${contacts.length} / 5`}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {contacts.length === 0 ? (
              <span className="text-amber-600 font-medium">Add contacts for SOS alerts →</span>
            ) : (
              <span className="text-emerald-600 font-medium">Ready for emergency dispatch →</span>
            )}
          </p>
        </Link>

        <Link
          to="/journey"
          className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Journey Mode
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Compass size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {activeJourney ? "In Progress" : "Standby"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {safeZones.length} Campus Safe Zones active →
          </p>
        </Link>

        <Link
          to="/incidents/mine"
          className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              My Reports
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {loading ? "—" : incidents.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            AI-triaged incident reports →
          </p>
        </Link>

        <Link
          to="/community"
          className="bg-white border border-slate-200 hover:border-fuchsia-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Anonymous Feed
            </span>
            <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
              <MessageSquareHeart size={18} />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900 truncate">
            u/{user.anonymousHandle}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Open peer safety community →
          </p>
        </Link>
      </div>

      {/* Staff / Admin Quick Governance Card */}
      {isStaff && (
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
              <LayoutDashboard size={22} className="text-teal-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                Role Access: {user.role}
              </span>
              <h2 className="text-lg font-bold">Campus Governance & Dispatch Consoles</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                You have elevated privileges to manage community moderation, incident triage, or active SOS alerts.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {["MODERATOR", "ADMIN"].includes(user.role) && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  Admin Overview
                </Link>
                <Link
                  to="/admin/moderation"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  Moderation Queue
                </Link>
              </>
            )}
            {["SECURITY_STAFF", "ADMIN"].includes(user.role) && (
              <Link
                to="/admin/security"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                SOS Security Console
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Two-column Bottom Section: Campus Safe Zones & Safety Guidelines */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-violet-600" /> GEHU Verified Campus Safe Zones
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                24/7 monitored checkpoints, medical rooms, and help desks within the 2.0 km campus radius.
              </p>
            </div>
            <Link
              to="/journey"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              View on Map <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {safeZones.map((zone) => (
              <div
                key={zone.id}
                className="border border-slate-200/80 bg-slate-50/60 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800">{zone.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {zone.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {zone.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{zone.description}</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  GPS: {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                </p>
              </div>
            ))}
            {safeZones.length === 0 && (
              <p className="text-xs text-slate-400 col-span-2 py-4">
                Safe zones will appear here once loaded from the campus map service.
              </p>
            )}
          </div>
        </div>

        {/* Privacy & Emergency Readiness Checklist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Lock size={18} className="text-teal-600" /> Safety & Privacy Readiness
            </h2>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className={`shrink-0 mt-0.5 ${
                    contacts.length > 0 ? "text-emerald-600" : "text-slate-300"
                  }`}
                />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Trusted Circle ({contacts.length}/5 configured)
                  </span>
                  Add at least one contact with an email address to receive SOS alerts.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Anonymous Handle Active (u/{user.anonymousHandle})
                  </span>
                  Your real name and email are never exposed in community posts or comments.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Two-Stage SOS Protection
                  </span>
                  The floating red SOS button in the bottom-right corner includes an 8-second confirmation window to prevent accidental triggers.
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link to="/profile" className="font-semibold text-violet-600 hover:underline">
              Review Privacy Settings →
            </Link>
            <Link to="/sos/history" className="font-medium text-slate-500 hover:text-slate-800">
              SOS History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
