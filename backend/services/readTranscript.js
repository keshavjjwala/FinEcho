import fs from "fs";
import path from "path";

export function readTranscript() {
  const filePath = path.join(
    process.cwd(),
    "data",
    "transcript.json"
  );

  const raw = fs.readFileSync(filePath, "utf-8");
  const transcript = JSON.parse(raw);

  return transcript;
}
