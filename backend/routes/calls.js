import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

import { supabaseAdmin } from "../supabase.js";
import { runCallPipeline } from "../services/callPipeline.js";
import { getAudioDurationSeconds } from "../services/duration.js";
import { extractNotesMeta } from "../services/notesMeta.js";
import { verifyJWT } from "../middleware/auth.js"; // ✅ JWT middleware

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${uuidv4()}${path.extname(file.originalname) || ".webm"}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const router = Router();

/** POST /api/calls/upload */
router.post(
  "/upload",
  verifyJWT, // 🔒 PROTECTED
  upload.single("audio"),
  async (req, res) => {
    try {
      const client_id = req.body.client_id || req.body.clientId;
      const notes = req.body.notes || null;

      if (!client_id) {
        return res.status(400).json({ error: "client_id required" });
      }

      if (!req.file?.path) {
        return res.status(400).json({ error: "audio file required" });
      }

      // Get advisor from client record
      const { data: clientRow, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("advisor_id")
        .eq("id", client_id)
        .maybeSingle();

      if (clientError) {
        return res.status(500).json({ error: "Failed to look up client" });
      }

      if (!clientRow?.advisor_id) {
        return res.status(400).json({ error: "Client not found" });
      }

      const advisor_id = req.user.id;

      let duration_seconds = 0;

      try {
        duration_seconds = await getAudioDurationSeconds(req.file.path);
      } catch {
        duration_seconds = 0;
      }

      const { data: row, error } = await supabaseAdmin
        .from("calls")
        .insert([
          {
            advisor_id,
            client_id,
            audio_path: req.file.path,
            duration_seconds,
            notes,
            status: "uploaded",
          },
        ])
        .select("id, status, created_at")
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      runCallPipeline(row.id, req.file.path).catch(console.error);

      res.status(201).json({ success: true, call: row });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

/** GET /api/calls */
router.get("/", verifyJWT, async (req, res) => {
  try {
    const from = req.query.from;
    const to = req.query.to;

    const advisorId = req.user.id;

  let q = supabaseAdmin
  .from("calls")
  .select("*, clients(id, name)")
  .eq("advisor_id", advisorId)   // 🔥 ADD THIS LINE
  .order("created_at", { ascending: false });


    if (from) q = q.gte("created_at", from + "T00:00:00.000Z");
    if (to) q = q.lte("created_at", to + "T23:59:59.999Z");

    const { data: rows, error } = await q;

    if (error) return res.status(500).json({ error: error.message });

    const list = (rows || []).map((r) => ({
      id: r.id,
      clientId: r.client_id,
      clientName: r.clients?.name ?? "Client",
      advisorName: null,
      callDate: r.created_at?.slice(0, 10) ?? "",
      callDuration: r.duration_seconds ?? 0,
      languageDetected: r.language ?? "—",
      aiProcessingStatus: r.status === "completed" ? "processed" : "pending",
      complianceStatus:
        r.compliance_status === "risk" || r.compliance_status === "warning"
          ? "needs_review"
          : "clear",
      compliance_status: r.compliance_status,
      compliance_flags: r.compliance_flags ?? [],
      status: r.status,
    }));

    res.json(list);
  } catch (err) {
    console.error("Calls list error:", err);
    res.status(500).json({ error: "Calls list failed" });
  }
});

/** GET /api/calls/:id */
router.get("/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: row, error } = await supabaseAdmin
      .from("calls")
      .select("*, clients(id, name, email)")
      .eq("id", id)
      .eq("advisor_id", req.user.id)

      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!row) return res.status(404).json({ error: "Call not found" });

    const notesMeta = extractNotesMeta(row.notes);

    res.json({
      id: row.id,
      advisor_id: row.advisor_id,
      client_id: row.client_id,
      clientName: row.clients?.name ?? "Client",
      clientEmail: row.clients?.email,
      transcript: row.transcript,
      summary: row.summary,
      goals: row.goals ?? [],
      duration_seconds: row.duration_seconds ?? 0,
      status: row.status,
      compliance_status: row.compliance_status ?? "clear",
      compliance_flags: row.compliance_flags ?? [],
      notes: row.notes,
      created_at: row.created_at,
      ingestion_metadata: notesMeta.ingestion_metadata ?? null,
      understanding_metadata: notesMeta.understanding_metadata ?? null,
    });
  } catch (err) {
    console.error("Call get error:", err);
    res.status(500).json({ error: "Call fetch failed" });
  }
});

/** DELETE /api/calls/:id */
router.delete("/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("calls")
      .delete()
      .eq("id", id)
      .eq("advisor_id", req.user.id)

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    console.error("Call delete error:", err);
    res.status(500).json({ error: "Call delete failed" });
  }
});

export default router;
