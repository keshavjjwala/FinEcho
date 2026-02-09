export async function saveSummary(summaryData) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/summary`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(summaryData),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to save summary");
  }

  return res.json();
}
