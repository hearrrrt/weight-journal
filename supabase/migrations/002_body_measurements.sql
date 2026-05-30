-- Body measurement tracking table
-- Tracks waist, hip, thigh measurements over time

CREATE TABLE body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  waist decimal(4,1),
  hip decimal(4,1),
  thigh decimal(4,1),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date),
  CONSTRAINT at_least_one_measurement CHECK (
    waist IS NOT NULL OR hip IS NOT NULL OR thigh IS NOT NULL
  )
);

-- Index for efficient per-user date-ordered queries
CREATE INDEX idx_body_measurements_user_date
  ON body_measurements(user_id, log_date DESC);

-- RLS: self full CRUD
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own measurements" ON body_measurements
  FOR ALL USING (auth.uid() = user_id);

-- RLS: partner can read
CREATE POLICY "Partner can read measurements" ON body_measurements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.partner_id = body_measurements.user_id
    )
  );
