import React, { Fragment, useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Ban,
  GitBranch,
  Zap,
  FileCode,
  ArrowRight,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, ViolationDetail } from "../services/api";

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string | null;
}

export function RightPanel({ isOpen, onClose, selectedId }: RightPanelProps) {
  const [violationDetail, setViolationDetail] =
    useState<ViolationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setViolationDetail(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await api.getViolationDetail(selectedId);
        setViolationDetail(detail);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load violation details"
        );
        console.error("Error fetching violation details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [selectedId]);

  const data = violationDetail;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{
            x: 400,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          exit={{
            x: 400,
            opacity: 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          className="w-96 border-l border-slate-800/50 bg-[#0F1419] flex flex-col h-full z-20"
        >
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/30">
            <span className="text-xs font-mono text-slate-500">
              {selectedId || "No selection"}
            </span>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="text-sm text-slate-500">
                  Loading violation details...
                </span>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-300 mb-1">
                      Error Loading Details
                    </div>
                    <div className="text-sm text-red-400/80">{error}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {!loading && !error && data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Violation Header with Gradient Background */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40 border border-slate-700/50 shadow-2xl p-6">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)",
                        backgroundSize: "24px 24px",
                      }}
                    />
                  </div>

                  <div className="relative space-y-4">
                    {/* Severity Badge with Icon */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg ${
                          data.severity === "critical"
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-500"
                            : data.severity === "high"
                            ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white border border-orange-500"
                            : "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border border-yellow-500"
                        }`}
                      >
                        {data.severity === "critical" ? (
                          <Ban className="w-3.5 h-3.5" />
                        ) : data.severity === "high" ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {data.severity}
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
                        <ShieldAlert className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                          {data.violation_type}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300 leading-tight">
                      {data.title}
                    </h2>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {data.description}
                    </p>
                  </div>
                </div>

                {/* Dependency Flow Visualization */}
                <div className="space-y-3 rounded-xl bg-slate-900/30 border border-slate-800/50 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Dependency Flow
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Source Module */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 group">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">
                          From
                        </div>
                        <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-slate-800/60 to-slate-800/40 border border-slate-700/50 font-mono text-sm text-slate-200 shadow-inner transition-all hover:border-slate-600/50 hover:shadow-md">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              {data.source_module}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Violation Arrow */}
                    <div className="flex items-center gap-3 pl-4">
                      <div className="w-0.5 h-6 bg-gradient-to-b from-red-500/50 to-red-600/50 rounded-full shadow-glow" />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-950/40 border border-red-800/40">
                        <Zap className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs font-bold text-red-300 uppercase tracking-wide">
                          Violates Layer Rule
                        </span>
                      </div>
                    </div>

                    {/* Target Module */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 group">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">
                          To
                        </div>
                        <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-red-950/30 to-red-900/20 border border-red-800/40 font-mono text-sm text-red-200 shadow-inner">
                          <div className="flex items-center gap-2">
                            <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            <span className="truncate">
                              {data.target_module}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Explanation */}
                {data.ai_explanation && (
                  <div className="space-y-3 rounded-xl bg-gradient-to-br from-blue-950/20 via-indigo-950/10 to-purple-950/20 border border-blue-800/30 p-5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                      </div>
                      <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                        AI Analysis
                      </h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed pl-8">
                      {data.ai_explanation}
                    </p>
                  </div>
                )}

                {/* Recommended Fix */}
                {data.suggested_fix && (
                  <div className="space-y-3 rounded-xl bg-gradient-to-br from-emerald-950/20 via-teal-950/10 to-cyan-950/20 border border-emerald-800/30 p-5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                        Recommended Fix
                      </h3>
                    </div>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
                      {data.suggested_fix}
                    </div>
                  </div>
                )}

                {/* Metadata Footer */}
                <div className="pt-4 mt-2 border-t border-slate-800/40 space-y-2.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Detection Details
                  </div>
                  <MetaRow
                    label="Detected At"
                    value={data.detected_at}
                    icon="calendar"
                  />
                  <MetaRow
                    label="Severity Level"
                    value={data.severity}
                    icon="alert"
                  />
                  <MetaRow
                    label="Violation Type"
                    value={data.violation_type}
                    icon="shield"
                  />
                  {data.file_path && (
                    <MetaRow
                      label="File Path"
                      value={data.file_path}
                      icon="file"
                    />
                  )}
                  {data.line_number && (
                    <MetaRow
                      label="Line Number"
                      value={data.line_number.toString()}
                      icon="code"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  const iconMap: Record<string, JSX.Element> = {
    calendar: <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />,
    alert: <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />,
    shield: <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />,
    file: <FileCode className="w-3 h-3 text-slate-500" />,
    code: <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />,
  };

  return (
    <div className="flex items-center justify-between text-xs group">
      <div className="flex items-center gap-2 text-slate-500">
        {iconMap[icon]}
        <span>{label}</span>
      </div>
      <span className="text-slate-400 font-mono group-hover:text-slate-300 transition-colors">
        {value}
      </span>
    </div>
  );
}
