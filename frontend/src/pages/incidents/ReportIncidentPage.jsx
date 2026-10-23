import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileWarning,
  Sparkles,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Lock,
} from "lucide-react";
import { IncidentApi, INCIDENT_CATEGORIES, VISIBILITY_OPTIONS } from "../../api/incidentApi";
import { useToast } from "../../context/ToastContext";

const STAGE = { WRITING: "WRITING", REVIEWING: "REVIEWING", SUBMITTED: "SUBMITTED" };

const AREA_SUGGESTIONS = [
  "GEHU Main Gate",
  "Girls Hostel Block A Lane",
  "Central Library Walkway",
  "CS / IT Block Back Road",
  "Clement Town Market Crossing",
  "Bus Parking Area",
];

export default function ReportIncidentPage() {
  const toast = useToast();
  const [stage, setStage] = useState(STAGE.WRITING);
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [category, setCategory] = useState("");
  const [visibilityType, setVisibilityType] = useState("ANON_PUBLIC");
  const [areaLabel, setAreaLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError("");
    if (description.trim().length < 10) {
      setError("Please share at least 10 characters of detail so our AI triage assistant can classify it.");
      return;
    }
    setLoading(true);
    try {
      const result = await IncidentApi.analyze(description);
      setAnalysis(result);
      setCategory(result.suggestedCategory);
      setStage(STAGE.REVIEWING);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not analyze your report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await IncidentApi.create({
        description,
        category,
        visibilityType,
        areaLabel: areaLabel.trim() || null,
      });
      toast.success("Incident report submitted for review.");
      setStage(STAGE.SUBMITTED);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit your report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (stage === STAGE.SUBMITTED) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">
            Incident Report Recorded
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Thank you for helping keep GEHU Clement Town safe. Campus governance staff will review
            this report according to your selected privacy visibility ({visibilityType}).
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/incidents/mine"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
            >
              Track in My Reports
            </Link>
            <button
              onClick={() => {
                setDescription("");
                setAnalysis(null);
                setAreaLabel("");
                setStage(STAGE.WRITING);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <FileWarning size={22} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Formal Incident Report</h1>
          <p className="text-xs text-slate-500">
            Two-stage AI-assisted reporting with full control over category and identity visibility.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold">
        <div
          className={`py-2 px-3 rounded-lg text-center ${
            stage === STAGE.WRITING
              ? "bg-violet-600 text-white"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          1. Describe What Happened
        </div>
        <div
          className={`py-2 px-3 rounded-lg text-center ${
            stage === STAGE.REVIEWING
              ? "bg-violet-600 text-white"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          2. Review AI Triage & Privacy
        </div>
      </div>

      {stage === STAGE.WRITING && (
        <form
          onSubmit={handleAnalyze}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Incident Description *
            </label>
            <textarea
              className="w-full border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl p-3.5 text-sm outline-none"
              rows={6}
              placeholder="Describe what happened, when, and where on or near campus (e.g., 'Broken streetlights near Gate 2 walkway made the area completely dark around 8 PM' or 'Someone was following me near the hostel gate')..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Minimum 10 characters required</span>
              <span>{description.length} / 3000</span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-900/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles size={17} />
            {loading ? "Running AI Triage Analysis..." : "Analyze & Continue to Privacy Options"}
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {stage === STAGE.REVIEWING && analysis && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          {/* AI Suggestion Box */}
          <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-violet-800">
                <Sparkles size={14} className="text-violet-600" /> AI Triage Suggestion (Preview Only)
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-violet-700 border border-violet-200">
                {Math.round(analysis.confidence * 100)}% Confidence
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-white/90 rounded-xl p-3 border border-violet-100">
                <span className="text-slate-400 block">Suggested Category</span>
                <strong className="text-slate-900 text-sm">
                  {analysis.suggestedCategory.replace(/_/g, " ")}
                </strong>
                <p className="text-[11px] text-slate-500 mt-0.5">{analysis.categoryReasoning}</p>
              </div>
              <div className="bg-white/90 rounded-xl p-3 border border-violet-100">
                <span className="text-slate-400 block">Suggested Priority</span>
                <strong className="text-slate-900 text-sm">{analysis.suggestedPriority}</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">{analysis.priorityReasoning}</p>
              </div>
            </div>

            {analysis.summary && (
              <p className="text-xs text-slate-600 italic bg-white/70 p-2.5 rounded-lg">
                Auto-summary: {analysis.summary}
              </p>
            )}
          </div>

          {/* Reporter Category Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Final Category (You can keep the AI suggestion or override it)
            </label>
            <select
              className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {INCIDENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Area Label with Quick Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin size={14} className="text-violet-600" /> Campus / Surrounding Area Label
            </label>
            <input
              className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none mb-2"
              placeholder="e.g. Near Main Gate — never exact personal GPS"
              value={areaLabel}
              onChange={(e) => setAreaLabel(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {AREA_SUGGESTIONS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setAreaLabel(area)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    areaLabel === area
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-violet-50"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Visibility Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Lock size={14} className="text-teal-600" /> Identity & Privacy Visibility
            </label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((v) => (
                <label
                  key={v.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                    visibilityType === v.value
                      ? "border-violet-600 bg-violet-50/50 font-semibold text-slate-900"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibilityType"
                    value={v.value}
                    checked={visibilityType === v.value}
                    onChange={(e) => setVisibilityType(e.target.value)}
                    className="accent-violet-600"
                  />
                  <span>{v.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStage(STAGE.WRITING)}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={15} /> Edit Description
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={16} />
              {loading ? "Submitting..." : "Submit Official Report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
