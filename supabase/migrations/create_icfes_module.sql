-- ============================================================
-- MÓDULO ICFES - TABLAS Y LÓGICA
-- ============================================================

-- 1. Tabla de Preguntas
CREATE TABLE IF NOT EXISTS icfes_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo TEXT NOT NULL CHECK (modulo IN ('matematicas', 'espanol', 'sociales', 'ingles', 'ciencias')),
  enunciado TEXT NOT NULL,
  opcion_a TEXT NOT NULL,
  opcion_b TEXT NOT NULL,
  opcion_c TEXT NOT NULL,
  opcion_d TEXT NOT NULL,
  respuesta_correcta TEXT NOT NULL CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')),
  explicacion TEXT NOT NULL,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icfes_modulo ON icfes_questions(modulo);

-- 2. Tabla de Intentos (Respuestas de estudiantes)
CREATE TABLE IF NOT EXISTS icfes_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES icfes_questions(id) ON DELETE CASCADE,
  respuesta_estudiante TEXT NOT NULL CHECK (respuesta_estudiante IN ('A', 'B', 'C', 'D')),
  es_correcta BOOLEAN NOT NULL,
  tiempo_respuesta_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icfes_attempts_student ON icfes_attempts(student_id, es_correcta);

-- 3. Tabla de Puntajes (Leaderboard)
CREATE TABLE IF NOT EXISTS icfes_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  total_correctas INTEGER DEFAULT 0,
  total_intentos INTEGER DEFAULT 0,
  -- Columna calculada para el porcentaje
  porcentaje_acierto DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_intentos > 0 THEN (total_correctas::DECIMAL / total_intentos * 100)
      ELSE 0
    END
  ) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icfes_scores_ranking ON icfes_scores(total_correctas DESC, porcentaje_acierto DESC);

-- 4. Trigger para actualizar puntajes automáticamente
CREATE OR REPLACE FUNCTION update_icfes_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar o actualizar el puntaje del estudiante
  INSERT INTO icfes_scores (student_id, total_correctas, total_intentos)
  VALUES (
    NEW.student_id,
    CASE WHEN NEW.es_correcta THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (student_id) DO UPDATE SET
    total_correctas = icfes_scores.total_correctas + CASE WHEN NEW.es_correcta THEN 1 ELSE 0 END,
    total_intentos = icfes_scores.total_intentos + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vincular trigger a la tabla de intentos
DROP TRIGGER IF EXISTS on_icfes_attempt_insert ON icfes_attempts;
CREATE TRIGGER on_icfes_attempt_insert
  AFTER INSERT ON icfes_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_icfes_score();

-- 5. Políticas de Seguridad (RLS)
ALTER TABLE icfes_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE icfes_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE icfes_scores ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer las preguntas (para poder responderlas)
CREATE POLICY "read_questions" ON icfes_questions FOR SELECT USING (true);

-- Estudiantes solo ven sus propios intentos (MVP: Abierto por ahora, filtrar en frontend)
-- Nota: Como los estudiantes usan auth personalizada, no tienen auth.uid()
CREATE POLICY "read_own_attempts" ON icfes_attempts FOR SELECT USING (true);

-- Estudiantes pueden insertar sus propios intentos
CREATE POLICY "insert_own_attempts" ON icfes_attempts FOR INSERT WITH CHECK (true);

-- Todos pueden ver el leaderboard (para fomentar competencia)
CREATE POLICY "read_leaderboard" ON icfes_scores FOR SELECT USING (true);
Good
Bad
Bad responseGood
Bad
Bad response

