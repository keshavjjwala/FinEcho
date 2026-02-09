-- Store structured financial understanding / NLP insights per call.

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS understanding_metadata JSONB DEFAULT '{}'::jsonb;

