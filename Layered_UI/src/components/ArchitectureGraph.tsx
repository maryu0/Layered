import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GraphNode } from "./GraphNode";
import { GraphEdge } from "./GraphEdge";
import { ZoomIn, ZoomOut, Maximize, ArrowDown } from "lucide-react";
import { ArchitectureMap, ViolationSummary } from "../services/api";

interface ArchitectureGraphProps {
  onSelectNode: (id: string) => void;
  selectedId: string | null;
  architectureData: ArchitectureMap | null;
  violations: ViolationSummary[];
}

export function ArchitectureGraph({
  onSelectNode,
  selectedId,
  architectureData,
  violations = [],
}: ArchitectureGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // Convert backend data to display format with positioning
  const { nodes, edges, layers, nodeToViolation } = useMemo(() => {
    if (!architectureData) {
      return {
        nodes: [],
        edges: [],
        layers: [],
        nodeToViolation: new Map<string, string>(),
      };
    }

    console.log("Architecture Data:", architectureData);
    console.log("Edges from backend:", architectureData.edges);
    console.log("Violations:", violations);

    // Create edge to violation ID mapping
    const edgeToViolation = new Map<string, string>();
    violations.forEach((v) => {
      const edgeKey = `${v.source_module}-${v.target_module}`;
      edgeToViolation.set(edgeKey, v.id);
    });

    // Create node to violation ID mapping (for red nodes)
    const nodeToViolationMap = new Map<string, string>();
    violations.forEach((v) => {
      // Map both source and target nodes to this violation
      if (!nodeToViolationMap.has(v.source_module)) {
        nodeToViolationMap.set(v.source_module, v.id);
      }
      if (!nodeToViolationMap.has(v.target_module)) {
        nodeToViolationMap.set(v.target_module, v.id);
      }
    });
    // Group nodes by layer
    const nodesByLayer = architectureData.nodes.reduce((acc, node) => {
      const layer = node.layer || "unknown";
      if (!acc[layer]) acc[layer] = [];
      acc[layer].push(node);
      return acc;
    }, {} as Record<string, typeof architectureData.nodes>);

    // Calculate positions for nodes
    const layerOrder = architectureData.layers.sort(
      (a, b) => a.level - b.level
    );
    const layerSpacing = 150;
    const baseY = 80;

    const positionedNodes = architectureData.nodes.map((node) => {
      const layerIndex = layerOrder.findIndex((l) => l.name === node.layer);
      const nodesInLayer = nodesByLayer[node.layer] || [node];
      const nodeIndexInLayer = nodesInLayer.indexOf(node);
      const totalInLayer = nodesInLayer.length;

      // Calculate X position (spread across width)
      const xSpacing = 200;
      const startX = 600 - (totalInLayer * xSpacing) / 2;
      const x = startX + nodeIndexInLayer * xSpacing;

      // Calculate Y position based on layer
      const y = baseY + layerIndex * layerSpacing;

      return {
        ...node,
        x,
        y,
      };
    });

    return {
      nodes: positionedNodes,
      edges: architectureData.edges.map((edge) => ({
        ...edge,
        violationId: edgeToViolation.get(edge.id),
      })),
      layers: layerOrder,
      nodeToViolation: nodeToViolationMap,
    };
  }, [architectureData, violations]);

  // Handle node selection - convert node ID to violation ID if the node has a violation
  const handleNodeClick = (id: string) => {
    // Check if this is a node with a violation
    const violationId = nodeToViolation.get(id);
    if (violationId) {
      onSelectNode(violationId);
    } else {
      // It might be an edge click with violationId already
      onSelectNode(id);
    }
  };

  const { highlightedNodes, highlightedEdges, dimmedNodes, dimmedEdges } =
    useMemo(() => {
      const activeId = hoveredNode || selectedId;
      if (!activeId) {
        return {
          highlightedNodes: new Set<string>(),
          highlightedEdges: new Set<string>(),
          dimmedNodes: false,
          dimmedEdges: false,
        };
      }
      const connectedNodes = new Set<string>([activeId]);
      const connectedEdges = new Set<string>();
      edges.forEach((edge) => {
        if (edge.from === activeId || edge.to === activeId) {
          connectedNodes.add(edge.from);
          connectedNodes.add(edge.to);
          connectedEdges.add(edge.id);
        }
      });
      return {
        highlightedNodes: connectedNodes,
        highlightedEdges: connectedEdges,
        dimmedNodes: true,
        dimmedEdges: true,
      };
    }, [hoveredNode, selectedId, edges]);

  return (
    <div className="flex-1 h-full relative bg-[#0F1419] overflow-hidden">
      {/* Simplified Graph Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
        <button
          onClick={() => setScale((s) => Math.min(s + 0.1, 2))}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => setScale(1)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Reset zoom"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* Legend with flow direction */}
      <div className="absolute bottom-6 left-6 space-y-3 z-10">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800/50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Intended dependency direction</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas - Fixed and Centered */}
      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          className="relative"
          style={{ width: "1200px", height: "800px" }}
          animate={{
            scale,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter
                id="glow-red"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Arrow marker for dependency direction */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#3f4f5f" opacity="0.25" />
              </marker>

              <marker
                id="arrowhead-violation"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#dc2626" opacity="0.75" />
              </marker>
            </defs>

            {/* Layer Boundaries */}
            {layers.map((layer, i) => {
              const y = 80 + i * 150;
              const height = 120;

              return (
                <g key={layer.name}>
                  {/* Faint background band */}
                  <rect
                    x={0}
                    y={y}
                    width={1200}
                    height={height}
                    fill={
                      i % 2 === 0
                        ? "rgba(15, 23, 42, 0.3)"
                        : "rgba(30, 41, 59, 0.2)"
                    }
                    className="pointer-events-none"
                  />

                  {/* Layer label */}
                  <text
                    x={20}
                    y={y + 20}
                    className="text-[10px] font-semibold uppercase tracking-wider select-none pointer-events-none"
                    fill="#475569"
                  >
                    {layer.name}
                  </text>

                  {/* Subtle separator line */}
                  {i < layers.length - 1 && (
                    <line
                      x1={0}
                      y1={y + height}
                      x2={1200}
                      y2={y + height}
                      stroke="rgba(71, 85, 105, 0.2)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}

            {/* Edges Layer */}
            {edges.map((edge) => {
              const startNode = nodes.find((n) => n.id === edge.from);
              const endNode = nodes.find((n) => n.id === edge.to);
              if (!startNode || !endNode) return null;

              const isHighlighted =
                highlightedEdges.has(edge.id) || hoveredEdge === edge.id;

              return (
                <GraphEdge
                  key={edge.id}
                  id={edge.id}
                  startX={(startNode as any).x + 100}
                  startY={(startNode as any).y + 80}
                  endX={(endNode as any).x + 100}
                  endY={(endNode as any).y + 80}
                  isViolation={edge.is_violation}
                  violationLabel={edge.violation_label}
                  ruleName={edge.violation_type || ""}
                  patternBroken={edge.violation_label || ""}
                  isHighlighted={isHighlighted}
                  isDimmed={dimmedEdges && !isHighlighted}
                  onHover={setHoveredEdge}
                  onClick={handleNodeClick}
                  violationId={(edge as any).violationId}
                />
              );
            })}

            {/* Nodes Layer */}
            {nodes.map((node) => {
              const isHighlighted = highlightedNodes.has(node.id);

              return (
                <GraphNode
                  key={node.id}
                  id={node.id}
                  label={node.label}
                  layer={0}
                  x={(node as any).x + 100}
                  y={(node as any).y + 80}
                  severity={node.severity as any}
                  isSelected={selectedId === node.id}
                  isDimmed={
                    dimmedNodes && !isHighlighted && selectedId !== node.id
                  }
                  onClick={handleNodeClick}
                  onHover={setHoveredNode}
                />
              );
            })}
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
