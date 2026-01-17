import { useState } from "react";
import { Search, Play, Loader2 } from "lucide-react";
import { api } from "../services/api";

interface CommandPaletteProps {
  onAnalysisComplete?: () => void;
}

export function CommandPalette({ onAnalysisComplete }: CommandPaletteProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [repoPath, setRepoPath] = useState("");

  const handleAnalyze = async () => {
    if (!repoPath.trim()) {
      alert("Please enter a repository path");
      return;
    }

    try {
      setAnalyzing(true);
      await api.analyzeRepository({ repo_path: repoPath });
      alert("Analysis completed successfully!");
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        `Analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-16 border-b border-slate-800/50 bg-[#0F1419] flex items-center px-8 gap-4">
      <div className="flex items-center flex-1 max-w-2xl relative">
        <Search className="w-4 h-4 text-slate-600 absolute left-3" />
        <input
          type="text"
          placeholder="Enter local path (C:\Projects\app) or GitHub URL (https://github.com/user/repo)..."
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !analyzing && handleAnalyze()}
          className="w-full bg-transparent border border-slate-800/50 rounded py-2 pl-10 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-700 transition-colors"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={analyzing || !repoPath.trim()}
        className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-sm font-medium transition-colors"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Analyze
          </>
        )}
      </button>
    </div>
  );
}
