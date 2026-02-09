import { supabaseAdmin } from "../supabase.js";
import { transcribeWithWhisper } from "./transcribe.js";
import { extractSummaryAndGoals } from "./summary.js";
import { analyzeCompliance } from "./compliance.js";
import { analyseTranscriptWithBackboard } from "./backboard.js";
import { analyseFinancialUnderstanding } from "./understanding.js";
import { runAudioIngestion } from "./audioIngestion.js";
import { mergeCallNotesMeta } from "./notesMeta.js";
import { unlink } from "fs/promises";

/**
 * Run full pipeline for a call: transcribe → summary + goals → compliance.
 * Updates call row in Supabase; does not throw (logs errors).
 * @param {string} callId - UUID of the call
 * @param {string} audioPath - Absolute path to uploaded audio file
 */
export async function runCallPipeline(callId, audioPath) {
  try {
    // 0) Audio ingestion phase (lightweight, pre-transcription analysis)
    try {
      const ingestion = await runAudioIngestion(audioPath);
      console.log("[Ingestion] JSON for call", callId, ingestion);

      // Heuristic transcription confidence from ingestion metrics.
      let segment_confidence = null;
      try {
        const noise = ingestion?.noise_level;
        const tampering = !!ingestion?.possible_tampering;
        const silenceRatio = typeof ingestion?.silence_ratio === "number" ? ingestion.silence_ratio : null;

        if (tampering || (silenceRatio !== null && silenceRatio > 0.6)) {
          segment_confidence = "Low";
        } else if (noise === "high") {
          segment_confidence = "Medium";
        } else if (noise === "low") {
          segment_confidence = "High";
        } else {
          segment_confidence = "Medium";
        }
      } catch {
        segment_confidence = null;
      }

      const { error: ingestionUpdateError } = await supabaseAdmin
        .from("calls")
        .update({
          ingestion_metadata: ingestion,
          // Mirror detected language for list views / fallbacks
          language: ingestion.language || null,
          segment_confidence,
        })
        .eq("id", callId);

      if (ingestionUpdateError) {
        console.error(
          "[Ingestion] Failed to persist ingestion_metadata for call",
          callId,
          ingestionUpdateError.message || ingestionUpdateError
        );

        // If migrations haven't been applied, store metadata inside notes so UI still works.
        if (String(ingestionUpdateError.message || "").includes("schema cache")) {
          await mergeCallNotesMeta(callId, {
            ingestion_metadata: ingestion,
            segment_confidence,
          }).catch(() => {});
        }
      } else {
        console.log("[Ingestion] Stored ingestion_metadata for call", callId, "segment_confidence:", segment_confidence);
      }
    } catch (ingErr) {
      console.error("Audio ingestion failed for", callId, ingErr);
      // Store empty object so frontend knows ingestion was attempted but failed
      await supabaseAdmin
        .from("calls")
        .update({
          ingestion_metadata: { error: "Ingestion failed: " + (ingErr.message || "Unknown error") },
        })
        .eq("id", callId)
        .catch(() => {}); // Ignore update errors

      await mergeCallNotesMeta(callId, {
        ingestion_metadata: { error: "Ingestion failed: " + (ingErr.message || "Unknown error") },
      }).catch(() => {});
    }

    // 1) Transcription phase
    await supabaseAdmin.from("calls").update({ status: "transcribing" }).eq("id", callId);

    let transcript;
    try {
      const res = await transcribeWithWhisper(audioPath);
      transcript = res.text;
    } catch (err) {
      console.error("Transcription failed for", callId, err);
      await supabaseAdmin
        .from("calls")
        .update({
          status: "failed_transcription",
          summary: "Transcription failed: " + (err.message || "Unknown error"),
        })
        .eq("id", callId);
      return;
    }

    await supabaseAdmin
      .from("calls")
      .update({
        transcript,
        status: "transcribed",
      })
      .eq("id", callId);

    // 2) Summarisation / compliance phase – prefer Backboard, fall back to heuristics
    try {
      let summary;
      let goals;
      let language;
      let compliance_flags;
      let compliance_status;
      let understanding_metadata;

      try {
        const backboard = await analyseTranscriptWithBackboard(transcript);
        summary = backboard.summary;
        goals = backboard.goals;
        language = backboard.language;
        compliance_flags = backboard.compliance_flags;
        compliance_status = backboard.compliance_status;
      } catch (bbErr) {
        console.warn("Backboard analysis failed, falling back to heuristic summary:", bbErr?.message || bbErr);
        const basic = extractSummaryAndGoals(transcript);
        const compliance = analyzeCompliance(transcript);
        summary = basic.summary;
        goals = basic.goals;
        language = basic.language;
        compliance_flags = compliance.compliance_flags;
        compliance_status = compliance.compliance_status;
      }

      // 3) Lightweight financial understanding (intents, entities, emotion etc.)
      try {
        understanding_metadata = analyseFinancialUnderstanding(transcript);
      } catch (uErr) {
        console.error("Understanding analysis failed for", callId, uErr);
        understanding_metadata = null;
      }

      // First update core fields that exist in the original schema.
      const { error: coreUpdateError } = await supabaseAdmin
        .from("calls")
        .update({
          summary,
          goals,
          // Don't overwrite detected language from ingestion; keep the call.language as-is.
          compliance_flags,
          compliance_status,
          status: "completed",
        })
        .eq("id", callId);

      if (coreUpdateError) {
        console.error("Core update failed for", callId, coreUpdateError);
      }

      // Then try to persist understanding_metadata if the column exists.
      const { error: understandingErr } = await supabaseAdmin
        .from("calls")
        .update({ understanding_metadata })
        .eq("id", callId);

      if (understandingErr) {
        console.error("Understanding metadata persist failed for", callId, understandingErr.message || understandingErr);
        if (String(understandingErr.message || "").includes("schema cache")) {
          await mergeCallNotesMeta(callId, { understanding_metadata }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Summary/compliance step failed for", callId, err);
      await supabaseAdmin
        .from("calls")
        .update({
          status: "failed_summary",
          summary: "Summary generation failed: " + (err.message || "Unknown error"),
        })
        .eq("id", callId);
    }
  } catch (err) {
    console.error("Call pipeline unexpected error for", callId, err);
    await supabaseAdmin
      .from("calls")
      .update({
        status: "failed_summary",
        summary: "Processing failed: " + (err.message || "Unknown error"),
      })
      .eq("id", callId);
  } finally {
    // Best-effort cleanup of uploaded audio; ignore errors.
    if (audioPath) {
      unlink(audioPath).catch(() => {});
    }
  }
}
