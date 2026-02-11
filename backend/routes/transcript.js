import express from "express";
import { readTranscript } from "../services/readTranscript.js";

const router = express.Router();

router.get("/transcript", (req, res) => {
  const transcript = readTranscript();

  res.json({
    text: transcript.text,
    segments: transcript.segments
  });
});

export default router;
