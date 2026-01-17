// API client for communicating with Layered backend
const API_BASE_URL = "http://localhost:8000/api";

export interface AnalysisRequest {
  repo_path: string;
  branch?: string;
  include_tests?: boolean;
}

export interface AnalysisResult {
  analysis_id: string;
  status: string;
  total_modules: number;
  total_dependencies: number;
  total_violations: number;
  violations_by_severity: Record<string, number>;
  timestamp: string;
  duration_seconds: number;
}

export interface NodeData {
  id: string;
  label: string;
  layer: string;
  severity?: string;
  file_path?: string;
  module_type?: string;
}

export interface EdgeData {
  id: string;
  from: string;
  to: string;
  is_violation: boolean;
  violation_type?: string;
  violation_label?: string;
  dependency_type: string;
}

export interface LayerDefinition {
  name: string;
  level: number;
  allowed_dependencies: string[];
  description?: string;
}

export interface ArchitectureMap {
  nodes: NodeData[];
  edges: EdgeData[];
  layers: LayerDefinition[];
  metadata: Record<string, any>;
}

export interface ViolationSummary {
  id: string;
  title: string;
  severity: string;
  type: string;
  source_module: string;
  target_module: string;
  timestamp: string;
}

export interface ViolationDetail {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  source_module: string;
  target_module: string;
  dependency_path: string[];
  rule_name: string;
  pattern_broken: string;
  timestamp: string;
  ai_explanation?: string;
  suggested_fix?: string;
}

export interface ArchitectureSnapshot {
  id: string;
  timestamp: string;
  commit_hash?: string;
  total_violations: number;
  violations_by_type: Record<string, number>;
  violations_by_severity: Record<string, number>;
}

export interface HistorySnapshot {
  id: string;
  timestamp: string;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface SnapshotDetail {
  id: string;
  repo: {
    name: string;
    branch: string;
  };
  timestamp: string;
  architecture: {
    layers: string[];
    nodes: NodeData[];
    edges: EdgeData[];
  };
  violations: ViolationDetail[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface SnapshotComparison {
  from_id: string;
  to_id: string;
  from_timestamp: string;
  to_timestamp: string;
  added_violations: ViolationDetail[];
  resolved_violations: ViolationDetail[];
  summary_change: Record<string, number>;
}

class LayeredAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Analyze repository
  async analyzeRepository(request: AnalysisRequest): Promise<AnalysisResult> {
    return this.request<AnalysisResult>("/analyze", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Get architecture map
  async getArchitectureMap(analysisId?: string): Promise<ArchitectureMap> {
    const params = analysisId ? `?analysis_id=${analysisId}` : "";
    return this.request<ArchitectureMap>(`/architecture-map${params}`);
  }

  // Get violations list
  async getViolations(params?: {
    analysis_id?: string;
    severity?: string;
    type?: string;
  }): Promise<ViolationSummary[]> {
    const queryParams = new URLSearchParams();
    if (params?.analysis_id)
      queryParams.append("analysis_id", params.analysis_id);
    if (params?.severity) queryParams.append("severity", params.severity);
    if (params?.type) queryParams.append("type", params.type);

    const queryString = queryParams.toString();
    return this.request<ViolationSummary[]>(
      `/violations${queryString ? `?${queryString}` : ""}`,
    );
  }

  // Get violation detail
  async getViolationDetail(violationId: string): Promise<ViolationDetail> {
    return this.request<ViolationDetail>(`/violations/${violationId}`);
  }

  // Get history
  async getHistory(limit: number = 10): Promise<ArchitectureSnapshot[]> {
    return this.request<ArchitectureSnapshot[]>(`/history?limit=${limit}`);
  }

  // Get history snapshots list
  async listHistorySnapshots(
    repo?: string,
    limit: number = 50,
  ): Promise<HistorySnapshot[]> {
    const params = new URLSearchParams();
    if (repo) params.append("repo", repo);
    params.append("limit", limit.toString());
    return this.request<HistorySnapshot[]>(`/history?${params.toString()}`);
  }

  // Get snapshot by ID
  async getSnapshot(snapshotId: string): Promise<SnapshotDetail> {
    return this.request<SnapshotDetail>(`/history/${snapshotId}`);
  }

  // Compare two snapshots
  async compareSnapshots(
    fromId: string,
    toId: string,
  ): Promise<SnapshotComparison> {
    return this.request<SnapshotComparison>(
      `/history/compare/${fromId}/${toId}`,
    );
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    version: string;
    timestamp: string;
  }> {
    return fetch(`${this.baseUrl.replace("/api", "")}/health`).then((res) =>
      res.json(),
    );
  }
}

// Export singleton instance
export const api = new LayeredAPI();
