import { authFetch } from "@/lib/api";

export interface CallFromCallsApi {
  id: string;
  clientId: string;
  clientName: string;
  advisorName: string | null;
  callDate: string;
  callDuration: number;
  languageDetected: string;
  aiProcessingStatus: "processed" | "pending";
  complianceStatus: "clear" | "needs_review";
  compliance_status?: "clear" | "warning" | "risk";
  compliance_flags?: string[];
  status: string;
}

export interface CallDetailFromApi {
  id: string;
  advisor_id: string;
  client_id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  transcript: string | null;
  summary: string | null;
  goals: string[];
  language: string | null;
  duration_seconds: number;
  status: string;
  compliance_status: "clear" | "warning" | "risk";
  compliance_flags: string[];
  notes: string | null;
  created_at: string;
  segment_confidence?: "High" | "Medium" | "Low" | null;
}

/** Get Calls List */
export async function getCallsList(
  from: string,
  to: string
): Promise<CallFromCallsApi[]> {
  const params = new URLSearchParams({ from, to });

  const res = await authFetch(`/api/calls?${params.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch calls");
  }

  return res.json();
}

/** Get Call Details */
export async function getCallById(id: string): Promise<CallDetailFromApi> {
  const res = await authFetch(`/api/calls/${encodeURIComponent(id)}`);

  if (res.status === 404) throw new Error("Call not found");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch call");
  }

  return res.json();
}

/** Delete Call */
export async function deleteCall(id: string): Promise<void> {
  const res = await authFetch(`/api/calls/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete call");
  }
}

/** Upload Call */
export async function uploadCall(
  formData: FormData
): Promise<{ call: { id: string; status: string } }> {
  const res = await authFetch(`/api/calls/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }

  return res.json();
}
