import type {
  BreakdownPoint,
  DashboardSummary,
  NextBestAction,
  Report,
  ReportCreate,
  PharmacyContextResponse,
  PharmacyRiskResponse,
  Signal,
  SignalDetail,
  TerritoryMapResponse,
  TrendPoint
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  reports: () => request<Report[]>("/reports"),
  createReport: (payload: ReportCreate) =>
    request<Report>("/reports", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  analyzeReport: (id: number) =>
    request<Signal>(`/reports/${id}/analyze`, {
      method: "POST"
    }),
  signals: () => request<Signal[]>("/signals"),
  signalDetail: (id: number) => request<SignalDetail>(`/signals/${id}`),
  actions: () => request<NextBestAction[]>("/actions"),
  dashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
  dashboardTrends: () => request<TrendPoint[]>("/dashboard/trends"),
  dashboardCategories: () => request<BreakdownPoint[]>("/dashboard/categories"),
  dashboardSeverity: () => request<BreakdownPoint[]>("/dashboard/severity"),
  pharmacyRisks: () => request<PharmacyRiskResponse>("/pharmacy-risks"),
  territoryMap: () => request<TerritoryMapResponse>("/vnext/territory/map"),
  pharmacyContext: (id: string) => request<PharmacyContextResponse>(`/vnext/pharmacies/${id}/context`)
};
