import dotenv from "dotenv";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";
import supabase, { supabaseAdmin } from "./supabase.js";
import callsRouter from "./routes/calls.js";
import clientsRouter from "./routes/clients.js";
import transcriptRoute from "./routes/transcript.js";
import { verifyJWT } from "./middleware/auth.js"; // ⭐ IMPORTANT

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "uploads");
mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

/* ========================
   PUBLIC ROUTES
======================== */

app.get("/", (req, res) => {
  res.send("FinEcho backend running");
});

app.use("/api/calls", callsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api", transcriptRoute);

/* ========================
   SAVE SUMMARY (PUBLIC)
======================== */

app.post("/api/summary", async (req, res) => {
  const d = req.body;

  const { data, error } = await supabase
    .from("summaries")
    .insert([{
      call_id: d.callId,
      summary: d.summary,
      goals: d.goals,
      risk_level: d.riskLevel,
      sip_type: d.sip.type,
      sip_amount: d.sip.amount,
      sip_category: d.sip.category,
      risk_explained: d.sip.riskExplained,
      client_response: d.clientResponse,
      compliance: d.compliance,
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, data });
});

/* ========================
   🔐 DASHBOARD STATS (PROTECTED)
======================== */

app.get("/api/advisor/dashboard", verifyJWT, async (req, res) => {
  try {
    const advisorId = req.user.id;

    const { data: calls, error } = await supabaseAdmin
      .from("calls")
      .select("*")
      .eq("advisor_id", advisorId);

    if (error) return res.status(500).json({ error: error.message });

    const stats = {
      totalCallsRecorded: calls.length,
      callsProcessedByAI: calls.filter(c => c.status === "completed").length,
      callsPendingReview: calls.filter(c => c.status !== "completed").length,
      complianceFlagsRaised: calls.filter(c => c.compliance_status !== "clear").length,
      followUpsRequired: 0,
    };

    res.json(stats);

  } catch (err) {
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
});

/* ========================
   🔐 CALLS LIST (PROTECTED)
======================== */

app.get("/api/advisor/calls", verifyJWT, async (req, res) => {
  try {
    const advisorId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("calls")
      .select("*, clients(name)")
      .eq("advisor_id", advisorId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const list = data.map(r => ({
      id: r.id,
      clientId: r.client_id,
      clientName: r.clients?.name ?? "Client",
      advisorName: null,
      callDate: r.created_at?.slice(0,10),
      callDuration: r.duration_seconds ?? 0,
      languageDetected: r.language ?? "—",
      aiProcessingStatus: r.status === "completed" ? "processed" : "pending",
      complianceStatus: r.compliance_status === "clear" ? "clear" : "needs_review",
    }));

    res.json(list);

  } catch (err) {
    res.status(500).json({ error: "Calls fetch failed" });
  }
});

/* ========================
   🔐 SINGLE CALL SUMMARY
======================== */

app.get("/api/advisor/calls/:id/summary", verifyJWT, async (req, res) => {
  try {
    const advisorId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("calls")
      .select("*")
      .eq("id", id)
      .eq("advisor_id", advisorId)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Summary fetch failed" });
  }
});

/* ========================
   SERVER START
======================== */

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
