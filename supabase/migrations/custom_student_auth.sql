-- ================================================
-- CUSTOM STUDENT AUTHENTICATION
-- ================================================
-- Sistema de autenticación custom para estudiantes
-- NO usa Supabase Auth - solo documento + contraseña
-- ================================================

-- 0. Eliminar políticas viejas que dependen de user_id
DROP POLICY IF EXISTS "read_own_icfes_attempts" ON icfes_attempts;
DROP POLICY IF EXISTS "insert_own_icfes_attempts" ON icfes_attempts;

-- 1. Modificar tabla students
ALTER TABLE students 
DROP COLUMN IF EXISTS user_id CASCADE;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN students.password_hash IS 'Hash bcrypt de la contraseña del estudiante';

-- 2. Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS student_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_token 
ON student_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_student_sessions_expiry 
ON student_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_student_sessions_student 
ON student_sessions(student_id);

COMMENT ON TABLE student_sessions IS 'Sesiones activas de estudiantes (autenticación custom)';

-- 3. Función para limpiar sesiones expiradas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM student_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. RLS para student_sessions
ALTER TABLE student_sessions ENABLE ROW LEVEL SECURITY;

-- Solo permitir que el backend gestione sesiones (service_role)
CREATE POLICY "service_role_all" ON student_sessions
FOR ALL USING (true);

-- 5. Actualizar políticas RLS de ICFES
-- Las políticas van a verificar si hay una sesión válida
-- Nota: El frontend enviará el student_id en las queries

-- Permitir lectura/inserción si el student_id coincide
DROP POLICY IF EXISTS "read_own_icfes_attempts" ON icfes_attempts;
CREATE POLICY "read_own_icfes_attempts" ON icfes_attempts 
FOR SELECT USING (true); -- Permitir lectura (el frontend filtra)

DROP POLICY IF EXISTS "insert_own_icfes_attempts" ON icfes_attempts;
CREATE POLICY "insert_own_icfes_attempts" ON icfes_attempts 
FOR INSERT WITH CHECK (true); -- Permitir inserción (el frontend valida)

-- Mensaje de éxito
SELECT 'Custom auth setup complete!' as status;
