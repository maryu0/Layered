import React from "react";
import { motion } from "framer-motion";
interface GraphNodeProps {
  id: string;
  label: string;
  x: number;
  y: number;
  severity?: "none" | "warning" | "critical";
  isSelected?: boolean;
  isDimmed?: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
}
export function GraphNode({
  id,
  label,
  x,
  y,
  severity = "none",
  isSelected,
  isDimmed,
  onClick,
  onHover,
}: GraphNodeProps) {
  const isViolation = severity !== "none";
  // Stronger, clearer colors for violations
  const getColors = () => {
    switch (severity) {
      case "critical":
        return {
          fill: "#1a0e0e",
          stroke: "#dc2626",
          glow: "rgba(220, 38, 38, 0.35)",
          text: "#fca5a5",
        };
      case "warning":
        return {
          fill: "#18130e",
          stroke: "#d97706",
          glow: "rgba(217, 119, 6, 0.25)",
          text: "#fbbf24",
        };
      default:
        return {
          fill: "#0f1419",
          stroke: "#3f4f5f",
          glow: "rgba(71, 85, 105, 0.15)",
          text: "#7d8b99",
        };
    }
  };
  const colors = getColors();
  const radius = 28; // Slightly larger for better visibility
  return (
    <motion.g
      initial={{
        opacity: 0,
        scale: 0,
      }}
      animate={{
        opacity: isDimmed ? 0.25 : 1,
        scale: 1,
        x,
        y,
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Stronger glow for violations */}
      {isViolation && (
        <motion.circle
          r={radius + 12}
          fill="transparent"
          stroke={colors.glow}
          strokeWidth={isSelected ? 3 : 2}
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: [0.5, 0.9, 0.5],
            scale: isSelected ? 1.15 : 1,
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Selection indicator */}
      {isSelected && !isViolation && (
        <motion.circle
          r={radius + 8}
          fill="transparent"
          stroke="#3b82f6"
          strokeWidth={2}
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 0.6,
            scale: 1,
          }}
          transition={{
            duration: 0.2,
          }}
        />
      )}

      {/* Main Node Circle */}
      <motion.circle
        r={radius}
        fill={colors.fill}
        stroke={isSelected ? "#3b82f6" : colors.stroke}
        strokeWidth={isViolation ? 2 : 1.5}
        whileHover={{
          scale: 1.08,
        }}
        transition={{
          duration: 0.15,
        }}
      />

      {/* Label */}
      <text
        dy={radius + 20}
        textAnchor="middle"
        className="text-[11px] font-medium select-none pointer-events-none"
        fill={isSelected ? "#60a5fa" : colors.text}
      >
        {label}
      </text>

      {/* Center dot */}
      <circle
        r={isViolation ? 5 : 3}
        fill={isSelected ? "#3b82f6" : colors.stroke}
      />
    </motion.g>
  );
}
