/**
 * Store structured metadata inside the existing `calls.notes` column.
 *
 * Why:
 * - Some Supabase deployments may not have run newer migrations yet.
 * - If JSONB columns like `ingestion_metadata` don't exist, we still want
 *   the demo to work end-to-end without losing intelligence.
 *
 * Format:
 * - User notes remain intact.
 * - We append a marker + JSON payload at the end.
 */

import { supabaseAdmin } from "../supabase.js";

const MARKER = "\n---FINECHO_META---\n";

function splitNotesAndMeta(notes) {
  const raw = typeof notes === "string" ? notes : "";
  const idx = raw.lastIndexOf(MARKER);
  if (idx === -1) return { userNotes: raw, meta: {} };
  const userNotes = raw.slice(0, idx).trimEnd();
  const metaRaw = raw.slice(idx + MARKER.length).trim();
  try {
    const parsed = JSON.parse(metaRaw);
    return { userNotes, meta: parsed && typeof parsed === "object" ? parsed : {} };
  } catch {
    return { userNotes, meta: {} };
  }
}

function buildNotes(userNotes, meta) {
  const u = (userNotes || "").trimEnd();
  const json = JSON.stringify(meta ?? {});
  if (!json || json === "{}") return u;
  return (u ? u + "\n\n" : "") + MARKER.trim() + "\n" + json;
}

/**
 * Merge metadata into notes for a call.
 * @param {string} callId
 * @param {object} patch
 */
export async function mergeCallNotesMeta(callId, patch) {
  const { data: row } = await supabaseAdmin
    .from("calls")
    .select("notes")
    .eq("id", callId)
    .maybeSingle();

  const { userNotes, meta } = splitNotesAndMeta(row?.notes);
  const merged = { ...(meta || {}), ...(patch || {}) };
  const nextNotes = buildNotes(userNotes, merged);

  await supabaseAdmin.from("calls").update({ notes: nextNotes }).eq("id", callId);
}

/**
 * Extract meta payload from notes.
 * @param {string|null|undefined} notes
 */
export function extractNotesMeta(notes) {
  return splitNotesAndMeta(notes).meta || {};
}

