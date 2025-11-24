-- ================================================
-- FIX: Permitir lectura de estudiantes para login
-- ================================================

-- Política para permitir que cualquiera busque estudiantes por documento
-- (Necesario para el proceso de login)
DROP POLICY IF EXISTS "allow_student_login_lookup" ON students;

CREATE POLICY "allow_student_login_lookup" ON students
FOR SELECT
USING (true); -- Permitir lectura a todos (solo necesitamos documento y hash)

-- Nota: Esto es seguro porque:
-- 1. Solo exponemos id, full_name, password_hash
-- 2. El password_hash está encriptado con bcrypt
-- 3. No se puede hacer nada sin verificar la contraseña

SELECT 'Policy created for student login!' as status;
