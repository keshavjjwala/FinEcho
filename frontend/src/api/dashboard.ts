import { BACKEND_URL } from '@/lib/api';

export interface DashboardStats {
  totalCallsRecorded: number;
  callsProcessedByAI: number;
  callsPendingReview: number;
  complianceFlagsRaised: number;
  followUpsRequired: number;
}

export interface CallFromApi {
  id: string;
  clientId: string;
  clientName: string;
  advisorName: string;
  callDate: string;
  callDuration: number;
  languageDetected: string;
  aiProcessingStatus: "processed" | "pending";
  complianceStatus: "clear" | "needs_review";
  clientResponse?: string;
}

/** Advisor dashboard stats for the given date range. */
export async function getDashboardStats(
  from: string,
  to: string
): Promise<DashboardStats> {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(
    `${BACKEND_URL}/api/advisor/dashboard?${params.toString()}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch dashboard stats");
  }
  return res.json();
}

/** List of calls for the given date range. */
export async function getCalls(from: string, to: string): Promise<CallFromApi[]> {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(
    `${BACKEND_URL}/api/advisor/calls?${params.toString()}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch calls");
  }
  return res.json();
}

/** Single call summary by call id (for CallSummary page). */
export async function getCallSummary(callId: string): Promise<unknown> {
  const res = await fetch(
    `${BACKEND_URL}/api/advisor/calls/${encodeURIComponent(callId)}/summary`
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch summary");
  }
  return res.json();
}

/** Legacy: dashboard summary (used by components/dashboard/Dashboard if needed). */
export async function getDashboardSummary(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  const res = await fetch(
    `${BACKEND_URL}/api/dashboard/summary${q ? `?${q}` : ""}`
  );
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return res.json();
}
