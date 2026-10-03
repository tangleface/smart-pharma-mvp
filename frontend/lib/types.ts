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

export type CoverageStatus = "on_target" | "watch" | "undercovered" | "excluded" | "unknown";

export type TerritoryMapPoint = {
  id: string;
  name: string;
  internal_code: string | null;
  territory: string | null;
  delegate: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  segment: string | null;
  pharmacy_status: string;
  target_visits_month: number | null;
  visits_last_30_days: number;
  coverage_ratio: number | null;
  coverage_status: CoverageStatus;
  last_visit_at: string | null;
  days_since_last_visit: number | null;
  management_priority: string | null;
  observations_last_30_days: number;
};

export type TerritoryMapResponse = {
  generated_at: string;
  coverage_window_days: number;
  points: TerritoryMapPoint[];
};

export type PharmacyObservationContext = {
  id: string;
  category: string;
  text: string;
  product: string | null;
  source: string;
  validation_status: string;
  observed_at: string;
  validated_at: string | null;
  validated_by: string | null;
};

export type PharmacyDirectiveContext = {
  id: string;
  title: string;
  instruction: string;
  reason: string | null;
  product: string | null;
  scope: string;
  status: string;
  valid_from: string;
  valid_until: string | null;
  created_by: string;
};

export type PharmacyActionContext = {
  id: string;
  title: string;
  action_type: string;
  status: string;
  priority: string;
  source: string;
  rationale: string | null;
  due_at: string | null;
  assigned_to: string | null;
  created_by: string;
};

export type PharmacyContextResponse = {
  pharmacy_id: string;
  name: string;
  internal_code: string | null;
  territory: string | null;
  delegate: string | null;
  segment: string | null;
  pharmacy_status: string;
  management_priority: string | null;
  management_priority_reason: string | null;
  observations: PharmacyObservationContext[];
  directives: PharmacyDirectiveContext[];
  actions: PharmacyActionContext[];
};
