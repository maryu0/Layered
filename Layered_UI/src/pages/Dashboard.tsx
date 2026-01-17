import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { CommandPalette } from "../components/CommandPalette";
import { ArchitectureGraph } from "../components/ArchitectureGraph";
import { ViolationsInbox } from "../components/ViolationsInbox";
import { RightPanel } from "../components/RightPanel";
import { HistoryView } from "../components/HistoryView";
import { CompareView } from "../components/CompareView";
import { Settings } from "./Settings";
import { api, ArchitectureMap, ViolationSummary } from "../services/api";

export type ViewType = "graph" | "violations" | "history" | "settings";

export function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("graph");
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(
    null,
  );
  const [architectureData, setArchitectureData] =
    useState<ArchitectureMap | null>(null);
  const [violations, setViolations] = useState<ViolationSummary[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false - don't load on mount
  const [error, setError] = useState<string | null>(null);
  const [compareSnapshots, setCompareSnapshots] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Fetch data on mount - removed, start with empty state
  // Users must run analysis first

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch architecture map and violations in parallel
      const [mapData, violationsData] = await Promise.all([
        api.getArchitectureMap(),
        api.getViolations(),
      ]);

      setArchitectureData(mapData);
      setViolations(violationsData);
    } catch (err) {
      console.error("Failed to load data:", err);
      // Don't show error for "No analysis found" - it's expected on first load
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      if (!errorMessage.includes("No analysis found")) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViolationSelect = (id: string) => {
    setSelectedViolationId((prev) => (prev === id ? null : id));
  };

  const handleSelectSnapshot = async (snapshotId: string) => {
    try {
      setLoading(true);
      const snapshot = await api.getSnapshot(snapshotId);

      // Convert snapshot to ArchitectureMap format
      setArchitectureData({
        nodes: snapshot.architecture.nodes,
        edges: snapshot.architecture.edges,
        layers: snapshot.architecture.layers.map((name, index) => ({
          name,
          level: index,
          allowed_dependencies: [],
        })),
        metadata: {
          snapshot_id: snapshot.id,
          timestamp: snapshot.timestamp,
        },
      });

      // Set violations from snapshot
      setViolations(
        snapshot.violations.map((v) => ({
          id: `${v.from_module}-${v.to_module}`,
          title: v.title,
          severity: v.severity,
          type: v.type,
          source_module: v.from_module,
          target_module: v.to_module,
          timestamp: snapshot.timestamp,
        })),
      );

      setCurrentView("graph");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load snapshot");
    } finally {
      setLoading(false);
    }
  };

  const handleCompareSnapshots = (fromId: string, toId: string) => {
    setCompareSnapshots({ from: fromId, to: toId });
  };

  const handleCloseCompare = () => {
    setCompareSnapshots(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#0F1419] text-slate-200 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading architecture data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full bg-[#0F1419] text-slate-200 items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">⚠️ Error</div>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state - no data yet
  const isEmpty =
    !architectureData?.nodes?.length &&
    !violations.length &&
    !loading &&
    !error;

  return (
    <div className="flex h-screen w-full bg-[#0F1419] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Left Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <CommandPalette onAnalysisComplete={loadData} />

        <div className="flex-1 flex overflow-hidden relative">
          {compareSnapshots ? (
            <CompareView
              fromId={compareSnapshots.from}
              toId={compareSnapshots.to}
              onClose={handleCloseCompare}
            />
          ) : isEmpty ? (
            <div className="flex-1 flex items-center justify-center bg-[#0F1419]">
              <div className="text-center max-w-md px-8">
                <div className="mb-6">
                  <svg
                    className="w-24 h-24 mx-auto text-slate-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-300 mb-3">
                  Welcome to Layered
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Start by analyzing your first repository. Enter a local path
                  or GitHub URL above and click "Analyze" to detect architecture
                  drift and layer violations.
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>💡 Examples:</p>
                  <code className="block bg-slate-900/50 border border-slate-800 rounded px-4 py-2 text-slate-400 font-mono text-xs mb-2">
                    C:\Projects\my-application
                  </code>
                  <code className="block bg-slate-900/50 border border-slate-800 rounded px-4 py-2 text-slate-400 font-mono text-xs">
                    https://github.com/username/repo
                  </code>
                </div>
              </div>
            </div>
          ) : currentView === "history" ? (
            <HistoryView
              onSelectSnapshot={handleSelectSnapshot}
              onCompareSnapshots={handleCompareSnapshots}
            />
          ) : currentView === "settings" ? (
            <Settings />
          ) : currentView === "graph" ? (
            <ArchitectureGraph
              onSelectNode={handleViolationSelect}
              selectedId={selectedViolationId}
              architectureData={architectureData}
              violations={violations}
            />
          ) : (
            <ViolationsInbox
              onSelectViolation={handleViolationSelect}
              selectedId={selectedViolationId}
              violations={violations}
            />
          )}

          {/* Right Panel - conditionally rendered but animated */}
          <RightPanel
            isOpen={!!selectedViolationId}
            onClose={() => setSelectedViolationId(null)}
            selectedId={selectedViolationId}
          />
        </div>
      </div>
    </div>
  );
}
