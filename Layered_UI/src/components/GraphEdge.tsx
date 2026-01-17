import React from "react";
import { motion, AnimatePresence } from "framer-motion";
interface GraphEdgeProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isViolation?: boolean;
  violationLabel?: string;
  ruleName?: string;
  patternBroken?: string;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
  violationId?: string;
}
export function GraphEdge({
  id,
  startX,
  startY,
  endX,
  endY,
  isViolation,
  violationLabel,
  ruleName,
  patternBroken,
  isHighlighted,
  isDimmed,
  onHover,
  onClick,
  violationId,
}: GraphEdgeProps) {
  const midY = (startY + endY) / 2;
  const controlPoint1X = startX;
  const controlPoint1Y = midY;
  const controlPoint2X = endX;
  const controlPoint2Y = midY;
  const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  const strokeColor = isViolation
    ? isHighlighted
      ? "#dc2626"
      : "#991b1b"
    : isHighlighted
    ? "#7d8b99"
    : "#2a3544";
  // Calculate tooltip position (midpoint of the curve)
  const tooltipX = (startX + endX) / 2;
  const tooltipY = midY - 40;
  return (
    <g>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className={isViolation ? "cursor-pointer" : "cursor-default"}
        onMouseEnter={() => onHover?.(id)}
        onMouseLeave={() => onHover?.(null)}
        onClick={() => isViolation && violationId && onClick?.(violationId)}
      />

      {/* Visible edge path */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={
          isViolation ? (isHighlighted ? 2.5 : 2) : isHighlighted ? 2 : 1
        }
        strokeOpacity={isDimmed ? 0.08 : isHighlighted ? 1 : 0.5}
        initial={{
          pathLength: 0,
          opacity: 0,
        }}
        animate={{
          pathLength: 1,
          opacity: isDimmed ? 0.08 : 1,
          stroke: strokeColor,
          strokeWidth: isViolation
            ? isHighlighted
              ? 2.5
              : 2
            : isHighlighted
            ? 2
            : 1,
        }}
        transition={{
          duration: 0.6,
          ease: "easeInOut",
          opacity: {
            duration: 0.2,
          },
        }}
        strokeDasharray={isViolation ? "6 3" : "none"}
        markerEnd={
          isViolation ? "url(#arrowhead-violation)" : "url(#arrowhead)"
        }
        className="pointer-events-none"
      />

      {/* Flow indicator for highlighted paths */}
      {isHighlighted && (
        <circle
          r="2.5"
          fill={isViolation ? "#dc2626" : "#6b7a8f"}
          className="pointer-events-none"
        >
          <animateMotion
            dur={isViolation ? "1.5s" : "2.5s"}
            repeatCount="indefinite"
            path={pathData}
          />
        </circle>
      )}

      {/* Detailed rule violation tooltip - only show when highlighted */}
      <AnimatePresence>
        {isViolation && isHighlighted && ruleName && (
          <motion.g
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            {/* Tooltip background */}
            <rect
              x={tooltipX - 140}
              y={tooltipY - 10}
              width={280}
              height={60}
              rx={6}
              fill="#0F1419"
              fillOpacity={0.98}
              stroke="#dc2626"
              strokeWidth={1}
              strokeOpacity={0.4}
              className="pointer-events-none"
            />

            {/* Rule violated label */}
            <text
              x={tooltipX}
              y={tooltipY + 6}
              textAnchor="middle"
              className="text-[9px] font-semibold uppercase tracking-wider select-none pointer-events-none"
              fill="#94a3b8"
            >
              Rule Violated
            </text>

            {/* Rule name */}
            <text
              x={tooltipX}
              y={tooltipY + 20}
              textAnchor="middle"
              className="text-[11px] font-medium select-none pointer-events-none"
              fill="#ef4444"
            >
              {ruleName}
            </text>

            {/* Pattern broken */}
            <text
              x={tooltipX}
              y={tooltipY + 36}
              textAnchor="middle"
              className="text-[9px] select-none pointer-events-none"
              fill="#64748b"
            >
              {patternBroken}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
}
