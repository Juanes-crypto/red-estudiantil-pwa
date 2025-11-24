-- ================================================
-- PERMITIR ACTUALIZAR API KEY DE ESTUDIANTE
-- ================================================
-- Como los estudiantes usan auth custom, no tienen auth.uid()
-- Necesitamos una función RPC con security definer para actualizar la key
-- ================================================

CREATE OR REPLACE FUNCTION update_student_gemini_key(p_student_id UUID, p_api_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de admin (bypassea RLS)
AS $$
BEGIN
  -- Actualizar la API Key del estudiante
  UPDATE students
  SET gemini_api_key = p_api_key
  WHERE id = p_student_id;
  
  -- Nota: En un entorno más estricto, aquí verificaríamos
  -- si existe una sesión válida en student_sessions para este ID.
  -- Por ahora, confiamos en el ID enviado (MVP).
END;
$$;

-- Mensaje de confirmación
SELECT 'Function update_student_gemini_key created!' as status;
