import { authFetch } from "@/lib/api";

export async function saveSummary(summaryData) {
  const res = await authFetch("/api/summary", {
    method: "POST",
    body: JSON.stringify(summaryData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save summary");
  }

  return res.json();
}
