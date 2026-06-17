export type Severity = "low" | "medium" | "high" | "critical";

export type Report = {
  id: number;
  delegate_name: string;
  region: string;
  territory: string;
  healthcare_provider: string;
  institution: string | null;
  report_text: string;
  visit_date: string;
  created_at: string;
  signal_count: number;
};

export type ReportCreate = {
  delegate_name: string;
  region: string;
  territory: string;
  healthcare_provider: string;
  institution?: string;
  report_text: string;
  visit_date: string;
};

export type Signal = {
  id: number;
  report_id: number;
  title: string;
  summary: string;
  category: string;
  severity: Severity;
  confidence_score: number;
  region: string;
  territory: string;
  detected_entities: string[];
  recommended_action: string;
  status: string;
  urgency_score: number;
  created_at: string;
};

export type NextBestAction = {
  id: number;
  signal_id: number;
  action_type: string;
  title: string;
  rationale: string;
  suggested_owner: string;
  priority: string;
  due_in_days: number;
  created_at: string;
  signal_title?: string | null;
  signal_category?: string | null;
  signal_severity?: Severity | null;
};

export type SignalDetail = {
  signal: Signal;
  source_report: Report;
  next_best_actions: NextBestAction[];
};

export type DashboardSummary = {
  total_reports: number;
  total_signals: number;
  critical_alerts: number;
  unresolved_signals: number;
  average_urgency_score: number;
};

export type TrendPoint = {
  date: string;
  signals: number;
};

export type BreakdownPoint = {
  name: string;
  value: number;
};

export type PharmacyRiskUrgency = "low" | "medium" | "high" | "critical";
export type PharmacyPotentialLevel = "low" | "medium" | "high";

export type PharmacyRiskSummary = {
  critical_pharmacies: number;
  high_risk_pharmacies: number;
  zones_requiring_action: number;
  suggested_visits_this_week: number;
};

export type PharmacyScoreBreakdown = {
  label: string;
  value: number;
  reason: string;
};

export type PharmacyRiskItem = {
  id: string;
  pharmacy_name: string;
  zone: string;
  city: string;
  last_visit_days: number;
  risk_score: number;
  urgency_level: PharmacyRiskUrgency;
  score_breakdown: PharmacyScoreBreakdown[];
  main_issue: string;
  priority_explanation: string;
  suggested_delegate: string;
  delegate_zone: string;
  delegate_strength: string;
  delegate_workload: string;
  delegate_explanation: string;
  recommended_action: string;
  recommended_timeframe: string;
  rotation_reason: string;
  assignment_criteria: string[];
  confidence_level: string;
  signals_count: number;
  potential_level: PharmacyPotentialLevel;
  risk_factors: string[];
};

export type PharmacyRiskZone = {
  zone: string;
  city: string;
  risk_score: number;
  urgency_level: PharmacyRiskUrgency;
  pharmacies_count: number;
  main_issue: string;
  suggested_delegate: string;
  recommended_action: string;
  top_pharmacy: string;
  risk_drivers: string[];
  action_timeframe: string;
};

export type PharmacyRiskResponse = {
  summary: PharmacyRiskSummary;
  pharmacies: PharmacyRiskItem[];
  zones: PharmacyRiskZone[];
};
