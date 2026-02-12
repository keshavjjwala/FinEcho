import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_DIR = path.resolve(__dirname, "../ai");

/**
 * Run lightweight audio ingestion in Python.
 *
 * Uses backend/ai/audio_ingestion.py
 * Command:
 *   <PYTHON_PATH> audio_ingestion.py <audio_path>
 *
 * The Python script prints a single JSON object to stdout, for example:
 * {
 *   "audio_format": "mp3",
 *   "duration_sec": 124,
 *   "language": "en",
 *   "noise_level": "low",
 *   "call_quality": "Good",
 *   "speakers_detected": 2,
 *   "possible_tampering": false
 * }
 *
 * NOTE: This is a hackathon‑style, explainable heuristic pipeline – not production ML.
 *
 * @param {string} audioPath - absolute path to uploaded audio
 * @returns {Promise<object>} ingestion JSON payload
 */
export async function runAudioIngestion(audioPath) {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_PATH;

    if (!python) {
      return reject(
        new Error(
          "PYTHON_PATH is not set. Set it to your Python binary (e.g. whisper-env/bin/python3) in backend/.env"
        )
      );
    }

    const scriptName = "audio_ingestion.py";

    console.log("────────────────────────────────────");
    console.log("[Ingestion] Starting audio ingestion");
    console.log("[Ingestion] Python binary:", python);
    console.log("[Ingestion] Script:", scriptName);
    console.log("[Ingestion] Audio path:", audioPath);
    console.log("[Ingestion] Working dir:", AI_DIR);
    console.log("────────────────────────────────────");

    const args = [scriptName, audioPath];

    const proc = spawn(python, args, {
      cwd: AI_DIR,
      env: {
        ...process.env,
        // Provide an explicit ffmpeg binary path (works on Windows/macOS/Linux)
        FFMPEG_PATH: process.env.FFMPEG_PATH || ffmpegInstaller.path,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      console.log("[Ingestion stdout]", text.slice(0, 200));
    });

    proc.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      console.error("[Ingestion stderr]", text.slice(0, 500));
    });

    proc.on("close", (code) => {
      console.log("[Ingestion] Process exited with code:", code);

      if (code !== 0) {
        return reject(
          new Error(
            stderr ||
              `Audio ingestion failed with exit code ${code}. Check logs above.`
          )
        );
      }

      try {
        const trimmed = stdout.trim();
        if (!trimmed) {
          return reject(
            new Error("Audio ingestion produced empty output (expected JSON)")
          );
        }
        const json = JSON.parse(trimmed);
        console.log("[Ingestion] Parsed ingestion JSON payload");
        resolve(json);
      } catch (err) {
        console.error("[Ingestion] Failed to parse JSON from stdout:", err);
        reject(err);
      }
    });

    proc.on("error", (err) => {
      console.error("[Ingestion] Failed to spawn process:", err);
      reject(err);
    });
  });
}

