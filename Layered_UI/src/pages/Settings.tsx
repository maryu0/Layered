import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  CheckCircle2,
  Circle,
  Info,
} from "lucide-react";

interface AppSettings {
  analysis: {
    detect_circular_dependencies: boolean;
    detect_legacy_access: boolean;
    severity_threshold: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
  architecture: {
    show_layer_boundaries: boolean;
    highlight_forbidden_edges: boolean;
  };
  ai: {
    enable_explanations: boolean;
    explanation_detail: "BRIEF" | "STANDARD";
  };
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    try {
      const response = await fetch("http://localhost:8000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const resetSettings = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/settings/reset", {
        method: "POST",
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to reset settings:", error);
    }
  };

  const handleToggle = (section: keyof AppSettings, key: string) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]:
          !settings[section][key as keyof (typeof settings)[typeof section]],
      },
    };
    updateSettings(newSettings);
  };

  const handleDropdownChange = (
    section: keyof AppSettings,
    key: string,
    value: string,
  ) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    };
    updateSettings(newSettings);
  };

  if (loading || !settings) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F1419] overflow-hidden">
      {/* Header */}
      <div className="px-8 py-8 border-b border-slate-800/30 bg-gradient-to-br from-slate-900/50 to-slate-800/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20">
                <SettingsIcon className="w-5 h-5 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Settings</h2>
            </div>
            <p className="text-sm text-slate-400 ml-12">
              Configure analysis behavior and visualization
            </p>
          </div>

          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Analysis Settings */}
          <SettingsSection
            title="Analysis"
            description="Control what architectural violations are detected"
          >
            <SettingToggle
              label="Detect Circular Dependencies"
              description="Identify dependency cycles that create tight coupling"
              checked={settings.analysis.detect_circular_dependencies}
              onChange={() =>
                handleToggle("analysis", "detect_circular_dependencies")
              }
            />
            <SettingToggle
              label="Detect Legacy Access"
              description="Flag access to deprecated or legacy modules"
              checked={settings.analysis.detect_legacy_access}
              onChange={() => handleToggle("analysis", "detect_legacy_access")}
            />
            <SettingDropdown
              label="Minimum Severity to Display"
              description="Filter violations below this severity level"
              value={settings.analysis.severity_threshold}
              options={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
                { value: "CRITICAL", label: "Critical" },
              ]}
              onChange={(value) =>
                handleDropdownChange("analysis", "severity_threshold", value)
              }
            />
          </SettingsSection>

          {/* Architecture Visualization */}
          <SettingsSection
            title="Architecture View"
            description="Control how the dependency graph is visualized"
          >
            <SettingToggle
              label="Show Layer Boundaries"
              description="Display architectural layer groupings in the graph"
              checked={settings.architecture.show_layer_boundaries}
              onChange={() =>
                handleToggle("architecture", "show_layer_boundaries")
              }
            />
            <SettingToggle
              label="Highlight Forbidden Dependencies"
              description="Show violations as red edges in the graph"
              checked={settings.architecture.highlight_forbidden_edges}
              onChange={() =>
                handleToggle("architecture", "highlight_forbidden_edges")
              }
            />
          </SettingsSection>

          {/* AI Explanations */}
          <SettingsSection
            title="AI Explanations"
            description="Configure automated explanations for violations"
          >
            <SettingToggle
              label="Enable AI Explanations"
              description="Generate natural language explanations for detected violations"
              checked={settings.ai.enable_explanations}
              onChange={() => handleToggle("ai", "enable_explanations")}
            />
            <SettingDropdown
              label="Explanation Detail Level"
              description="Choose between concise or comprehensive explanations"
              value={settings.ai.explanation_detail}
              options={[
                { value: "BRIEF", label: "Brief" },
                { value: "STANDARD", label: "Standard" },
              ]}
              onChange={(value) =>
                handleDropdownChange("ai", "explanation_detail", value)
              }
              disabled={!settings.ai.enable_explanations}
            />
          </SettingsSection>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-400">
              <span className="text-slate-300 font-medium">
                Settings apply immediately
              </span>{" "}
              to all new analyses. Changes do not affect previously completed
              analyses or historical snapshots.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-200 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-4 pl-4 border-l-2 border-slate-800/50">
        {children}
      </div>
    </motion.div>
  );
}

interface SettingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-900/30 rounded-lg border border-slate-800/30 hover:border-slate-700/50 transition-colors">
      <button
        onClick={onChange}
        className="flex-shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0F1419] rounded"
      >
        {checked ? (
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
        ) : (
          <Circle className="w-5 h-5 text-slate-600" />
        )}
      </button>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200 mb-1">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
    </div>
  );
}

interface SettingDropdownProps {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function SettingDropdown({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
}: SettingDropdownProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-900/30 rounded-lg border border-slate-800/30 hover:border-slate-700/50 transition-colors">
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200 mb-1">{label}</div>
        <div className="text-xs text-slate-500 mb-3">{description}</div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-2 bg-slate-950/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
