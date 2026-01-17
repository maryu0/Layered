import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  GitBranch,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api, HistorySnapshot } from "../services/api";

interface HistoryViewProps {
  onSelectSnapshot: (snapshotId: string) => void;
  onCompareSnapshots: (fromId: string, toId: string) => void;
}

export function HistoryView({
  onSelectSnapshot,
  onCompareSnapshots,
}: HistoryViewProps) {
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.listHistorySnapshots();
      setSnapshots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      onCompareSnapshots(selectedForCompare[0], selectedForCompare[1]);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityColor = (severity: string, count: number) => {
    if (count === 0) return "text-slate-600";
    switch (severity) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      default:
        return "text-slate-400";
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <TrendingUp className="w-3 h-3 text-red-400" />;
    if (current < previous)
      return <TrendingDown className="w-3 h-3 text-emerald-400" />;
    return <Minus className="w-3 h-3 text-slate-600" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">No history available yet</p>
          <p className="text-slate-600 text-sm mt-2">
            Run an analysis to create your first snapshot
          </p>
        </div>
      </div>
    );
  }

  const getHealthStatus = (total: number) => {
    if (total === 0)
      return {
        label: "Healthy",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        icon: CheckCircle2,
      };
    if (total <= 5)
      return {
        label: "Good",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        icon: Activity,
      };
    if (total <= 10)
      return {
        label: "Warning",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        icon: AlertTriangle,
      };
    return {
      label: "Critical",
      color: "text-red-400",
      bg: "bg-red-500/10",
      icon: XCircle,
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F1419] overflow-hidden">
      {/* Enhanced Header with Gradient */}
      <div className="relative px-8 py-8 border-b border-slate-800/30 bg-gradient-to-br from-slate-900/50 to-slate-800/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">
                Analysis History
              </h2>
            </div>
            <p className="text-sm text-slate-400 ml-12">
              {snapshots.length}{" "}
              {snapshots.length === 1 ? "snapshot" : "snapshots"} recorded
            </p>
          </div>

          <AnimatePresence>
            {selectedForCompare.length === 2 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleCompare}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Compare Selected
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Timeline */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {snapshots.map((snapshot, index) => {
            const prevSnapshot = snapshots[index + 1];
            const isSelectedForCompare = selectedForCompare.includes(
              snapshot.id,
            );
            const healthStatus = getHealthStatus(snapshot.summary.total);
            const HealthIcon = healthStatus.icon;

            return (
              <motion.div
                key={snapshot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100,
                }}
                className="relative"
              >
                {/* Timeline connector */}
                {index < snapshots.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-slate-700/50 to-transparent" />
                )}

                <div
                  className={`relative bg-gradient-to-br from-slate-900/50 to-slate-900/30 border rounded-xl transition-all duration-300 ${
                    isSelectedForCompare
                      ? "border-blue-500 shadow-lg shadow-blue-500/10"
                      : "border-slate-800/50 hover:border-slate-700/70 hover:shadow-xl"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-5">
                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        <div
                          className={`p-3 rounded-xl ${healthStatus.bg} border border-slate-700/30`}
                        >
                          <HealthIcon
                            className={`w-5 h-5 ${healthStatus.color}`}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-300">
                                {formatDate(snapshot.timestamp)}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${healthStatus.bg} ${healthStatus.color}`}
                              >
                                {healthStatus.label}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleSelectForCompare(snapshot.id)
                              }
                              className={`px-4 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                isSelectedForCompare
                                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                  : "border-slate-700/50 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5"
                              }`}
                            >
                              {isSelectedForCompare ? "✓ Selected" : "Compare"}
                            </button>

                            <button
                              onClick={() => onSelectSnapshot(snapshot.id)}
                              className="p-2 hover:bg-slate-800/50 rounded-lg transition-all text-slate-400 hover:text-slate-200 group"
                              title="View snapshot"
                            >
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-950/30 rounded-lg border border-slate-800/30">
                          {/* Total */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                                Total
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-200">
                                  {snapshot.summary.total}
                                </span>
                                {prevSnapshot && (
                                  <div className="flex items-center">
                                    {getTrendIcon(
                                      snapshot.summary.total,
                                      prevSnapshot.summary.total,
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Critical */}
                          <div>
                            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                              Critical
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xl font-semibold ${snapshot.summary.critical > 0 ? "text-red-400" : "text-slate-600"}`}
                              >
                                {snapshot.summary.critical}
                              </span>
                              {prevSnapshot &&
                                snapshot.summary.critical !==
                                  prevSnapshot.summary.critical && (
                                  <span
                                    className={`text-xs ${
                                      snapshot.summary.critical >
                                      prevSnapshot.summary.critical
                                        ? "text-red-400"
                                        : "text-emerald-400"
                                    }`}
                                  >
                                    {snapshot.summary.critical >
                                    prevSnapshot.summary.critical
                                      ? "+"
                                      : ""}
                                    {snapshot.summary.critical -
                                      prevSnapshot.summary.critical}
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* High */}
                          <div>
                            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                              High
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xl font-semibold ${snapshot.summary.high > 0 ? "text-orange-400" : "text-slate-600"}`}
                              >
                                {snapshot.summary.high}
                              </span>
                              {prevSnapshot &&
                                snapshot.summary.high !==
                                  prevSnapshot.summary.high && (
                                  <span
                                    className={`text-xs ${
                                      snapshot.summary.high >
                                      prevSnapshot.summary.high
                                        ? "text-orange-400"
                                        : "text-emerald-400"
                                    }`}
                                  >
                                    {snapshot.summary.high >
                                    prevSnapshot.summary.high
                                      ? "+"
                                      : ""}
                                    {snapshot.summary.high -
                                      prevSnapshot.summary.high}
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* Medium */}
                          <div>
                            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                              Medium
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xl font-semibold ${snapshot.summary.medium > 0 ? "text-yellow-400" : "text-slate-600"}`}
                              >
                                {snapshot.summary.medium}
                              </span>
                              {prevSnapshot &&
                                snapshot.summary.medium !==
                                  prevSnapshot.summary.medium && (
                                  <span
                                    className={`text-xs ${
                                      snapshot.summary.medium >
                                      prevSnapshot.summary.medium
                                        ? "text-yellow-400"
                                        : "text-emerald-400"
                                    }`}
                                  >
                                    {snapshot.summary.medium >
                                    prevSnapshot.summary.medium
                                      ? "+"
                                      : ""}
                                    {snapshot.summary.medium -
                                      prevSnapshot.summary.medium}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
