import React from "react";
import {
  ShieldAlert,
  Activity,
  Settings,
  Users,
  GitBranch,
  Clock,
  Network,
} from "lucide-react";
import { motion } from "framer-motion";
import { ViewType } from "../pages/Dashboard";
type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  view?: ViewType;
};
const SECTIONS = [
  {
    title: "Architecture",
    items: [
      {
        id: "map",
        label: "Architecture Map",
        icon: Network,
        view: "graph",
      },
      {
        id: "violations",
        label: "Drift Violations",
        icon: ShieldAlert,
        view: "violations",
      },
      {
        id: "history",
        label: "History",
        icon: Activity,
        view: "history",
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        id: "recent",
        label: "Recent",
        icon: Clock,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        view: "settings",
      },
    ],
  },
];
interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}
export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const getActiveId = () => {
    if (currentView === "graph") return "map";
    if (currentView === "violations") return "violations";
    if (currentView === "history") return "history";
    if (currentView === "settings") return "settings";
    return "";
  };
  const activeId = getActiveId();
  const handleNavClick = (item: NavItem) => {
    if (item.view) {
      onViewChange(item.view as ViewType);
    }
  };
  return (
    <aside className="w-56 bg-[#0B0E11] border-r border-slate-800/40 flex flex-col h-full flex-shrink-0">
      {/* Simplified Header */}
      <div className="px-5 py-6 border-b border-slate-800/30">
        <div className="flex items-center gap-2.5 text-slate-300 font-medium text-sm tracking-wide">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          <span>Layered</span>
        </div>
      </div>

      {/* Simplified Repository Context */}
      <div className="px-5 py-4 border-b border-slate-800/20">
        <div className="flex items-center gap-2 text-xs">
          <GitBranch className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500 tracking-wide">main</span>
        </div>
      </div>

      {/* Navigation - increased spacing */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-12">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="px-2 mb-4 text-[10px] font-semibold text-slate-600/80 uppercase tracking-[0.1em] letter-spacing-wider">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 relative
                        ${
                          isActive
                            ? "text-slate-200 bg-slate-900/60"
                            : "text-slate-500 hover:text-slate-400 hover:bg-slate-900/30"
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-indicator"
                          className="absolute left-0 top-3 bottom-3 w-0.5 bg-slate-600 rounded-r"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 35,
                          }}
                        />
                      )}

                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
