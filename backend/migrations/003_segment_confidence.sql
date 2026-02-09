-- Add a simple text column to store heuristic confidence
-- for the overall transcription quality.

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS segment_confidence TEXT CHECK (
  segment_confidence IN ('High', 'Medium', 'Low') OR segment_confidence IS NULL
);

