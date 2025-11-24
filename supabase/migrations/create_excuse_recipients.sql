-- Create table for linking excuses to specific teachers
CREATE TABLE IF NOT EXISTS excuse_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  excuse_id UUID NOT NULL REFERENCES medical_excuses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_excuse_recipients_excuse ON excuse_recipients(excuse_id);
CREATE INDEX idx_excuse_recipients_teacher ON excuse_recipients(teacher_id);

-- RLS Policies
ALTER TABLE excuse_recipients ENABLE ROW LEVEL SECURITY;

-- Parents can insert recipients when creating an excuse
CREATE POLICY "Padres asignan destinatarios" ON excuse_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medical_excuses 
      WHERE id = excuse_id AND parent_id = auth.uid()
    )
  );

-- Teachers can see if they are a recipient
CREATE POLICY "Docentes ven sus asignaciones" ON excuse_recipients FOR SELECT
  USING (teacher_id = auth.uid());

-- Parents can see who they sent it to
CREATE POLICY "Padres ven destinatarios" ON excuse_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM medical_excuses 
      WHERE id = excuse_id AND parent_id = auth.uid()
    )
  );
