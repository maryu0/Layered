import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Minus, X } from "lucide-react";
import { api, SnapshotComparison, ViolationDetail } from "../services/api";

interface CompareViewProps {
  fromId: string;
  toId: string;
  onClose: () => void;
}

export function CompareView({ fromId, toId, onClose }: CompareViewProps) {
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparison();
  }, [fromId, toId]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const data = await api.compareSnapshots(fromId, toId);
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comparison");
    } finally {
      setLoading(false);
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

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: "bg-red-600 text-white",
      high: "bg-orange-600 text-white",
      medium: "bg-yellow-600 text-white",
      low: "bg-slate-600 text-white",
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0F1419]">
        <div className="text-slate-400">Loading comparison...</div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0F1419]">
        <div className="text-red-400">{error || "Failed to load comparison"}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F1419] overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-200">Snapshot Comparison</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span>{formatDate(comparison.from_timestamp)}</span>
              <ArrowRight className="w-4 h-4" />
              <span>{formatDate(comparison.to_timestamp)}</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/50 rounded transition-colors text-slate-400 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Summary Changes */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Summary Changes
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(comparison.summary_change).map(([severity, change]) => (
              <div
                key={severity}
                className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
              >
                <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                  {severity}
                </div>
                <div className={`text-2xl font-semibold ${
                  change > 0 ? 'text-red-400' : change < 0 ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {change > 0 ? '+' : ''}{change}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Added Violations */}
        {comparison.added_violations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Added Violations ({comparison.added_violations.length})
              </h3>
            </div>
            <div className="space-y-3">
              {comparison.added_violations.map((violation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-red-950/20 border border-red-900/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-200">{violation.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded ${getSeverityBadge(violation.severity)}`}>
                      {violation.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{violation.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{violation.source_module}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{violation.target_module}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Violations */}
        {comparison.resolved_violations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Minus className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Resolved Violations ({comparison.resolved_violations.length})
              </h3>
            </div>
            <div className="space-y-3">
              {comparison.resolved_violations.map((violation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-200">{violation.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded ${getSeverityBadge(violation.severity)}`}>
                      {violation.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{violation.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{violation.source_module}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{violation.target_module}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Changes */}
        {comparison.added_violations.length === 0 && comparison.resolved_violations.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-slate-600 mb-2">No violations changed</div>
              <p className="text-sm text-slate-700">Architecture remained stable between snapshots</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
