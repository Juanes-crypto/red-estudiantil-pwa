-- ================================================
-- CORREGIR POLÍTICAS RLS - ICFES
-- ================================================
-- Ejecutar DESPUÉS del script principal
-- Fecha: 2025-11-23
-- ================================================

-- ELIMINAR POLÍTICAS INCORRECTAS
DROP POLICY IF EXISTS "read_own_icfes_attempts" ON icfes_attempts;
DROP POLICY IF EXISTS "insert_own_icfes_attempts" ON icfes_attempts;

-- CREAR POLÍTICAS CORRECTAS
-- Los PADRES pueden ver los intentos de sus hijos
CREATE POLICY "read_own_icfes_attempts"
ON icfes_attempts FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Los PADRES pueden insertar intentos para sus hijos
CREATE POLICY "insert_own_icfes_attempts"
ON icfes_attempts FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies corregidas!';
  RAISE NOTICE 'Ahora usando parent_id en lugar de user_id';
END $$;
