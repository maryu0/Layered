import React from "react";
import { motion } from "framer-motion";
import { ViolationCard } from "./ViolationCard";
import { ViolationSummary } from "../services/api";

interface ViolationsInboxProps {
  violations: ViolationSummary[];
  onSelectViolation: (id: string) => void;
  selectedId: string | null;
}

export function ViolationsInbox({
  violations,
  onSelectViolation,
  selectedId,
}: ViolationsInboxProps) {
  const criticalCount = violations.filter(
    (v) => v.severity === "critical"
  ).length;
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0F1419]">
      {/* Simplified Header */}
      <div className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-slate-300">
            Architecture Violations
          </h2>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-950/40 border border-red-900/30 text-red-300">
            {criticalCount} Critical
          </span>
        </div>
      </div>

      {/* Grid Content - increased spacing */}
      <div className="flex-1 overflow-y-auto p-8">
        <motion.div
          variants={{
            hidden: {
              opacity: 0,
            },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.04,
              },
            },
          }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 max-w-7xl"
        >
          {violations.map((violation) => (
            <ViolationCard
              key={violation.id}
              id={violation.id}
              title={violation.title}
              description={violation.description}
              severity={violation.severity}
              time={violation.detected_at}
              resource={`${violation.source_module} → ${violation.target_module}`}
              isSelected={selectedId === violation.id}
              onClick={() => onSelectViolation(violation.id)}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
