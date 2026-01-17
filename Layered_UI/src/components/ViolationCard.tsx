import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  AlertCircle,
  ArrowRight,
  FileCode,
} from "lucide-react";
interface ViolationCardProps {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  time: string;
  resource: string;
  onClick: () => void;
  isSelected?: boolean;
}
const severityConfig = {
  critical: {
    color: "text-white",
    textColor: "text-red-200",
    bg: "bg-gradient-to-r from-red-600 to-red-700",
    cardBg: "from-red-950/30 to-red-900/20",
    border: "border-red-800/40",
    icon: Ban,
    glow: "shadow-red-900/20",
  },
  high: {
    color: "text-white",
    textColor: "text-orange-200",
    bg: "bg-gradient-to-r from-orange-600 to-orange-700",
    cardBg: "from-orange-950/30 to-orange-900/20",
    border: "border-orange-800/40",
    icon: AlertTriangle,
    glow: "shadow-orange-900/20",
  },
  medium: {
    color: "text-white",
    textColor: "text-yellow-200",
    bg: "bg-gradient-to-r from-yellow-600 to-yellow-700",
    cardBg: "from-yellow-950/30 to-yellow-900/20",
    border: "border-yellow-800/40",
    icon: AlertCircle,
    glow: "shadow-yellow-900/20",
  },
  low: {
    color: "text-slate-200",
    textColor: "text-slate-300",
    bg: "bg-gradient-to-r from-slate-700 to-slate-800",
    cardBg: "from-slate-900/30 to-slate-800/20",
    border: "border-slate-700/40",
    icon: AlertCircle,
    glow: "shadow-slate-900/20",
  },
};
export function ViolationCard({
  title,
  description,
  severity,
  time,
  resource,
  onClick,
  isSelected,
}: ViolationCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: 12,
        },
        visible: {
          opacity: 1,
          y: 0,
        },
      }}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl cursor-pointer transition-all duration-200 group
        ${
          isSelected
            ? `bg-gradient-to-br ${config.cardBg} border-2 ${config.border} shadow-xl ${config.glow}`
            : `bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-800/50 hover:${config.border} hover:shadow-lg ${config.glow}`
        }
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative p-5 space-y-4">
        {/* Header with Severity Badge */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color} shadow-lg`}
          >
            <Icon className="w-3.5 h-3.5" />
            {severity}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
            <div className="w-1 h-1 rounded-full bg-slate-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-medium">
              {time}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          className={`text-base font-bold ${config.textColor} leading-snug group-hover:text-slate-100 transition-colors`}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Resource Path */}
        <div className="pt-3 border-t border-slate-800/30 flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <code className="text-xs font-mono text-slate-500 truncate group-hover:text-slate-400 transition-colors">
            {resource}
          </code>
        </div>

        {/* Hover Indicator */}
        {!isSelected && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          layoutId="selectedCard"
          className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.bg} rounded-r`}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </motion.div>
  );
}
