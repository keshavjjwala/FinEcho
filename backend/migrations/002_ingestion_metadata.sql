-- Add a JSONB column to store structured audio ingestion results
-- from the Python audio_ingestion.py pipeline.

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS ingestion_metadata JSONB DEFAULT '{}'::jsonb;

