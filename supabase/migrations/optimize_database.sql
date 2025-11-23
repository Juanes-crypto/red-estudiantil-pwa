-- ================================================
-- RED ESTUDIANTIL - DATABASE OPTIMIZATIONS
-- ================================================
-- Ejecutar este script en Supabase SQL Editor
-- Para optimizar performance y preparar escalabilidad
-- ================================================

-- ================================================
-- ÍNDICES CRÍTICOS PARA PERFORMANCE
-- ================================================

-- 1. Asistencia: Consultas por estudiante y fecha (usado en calendario, historial)
CREATE INDEX IF NOT EXISTS idx_asistencia_student_date 
ON asistencia(student_id, created_at DESC);

-- 2. Asistencia: Consultas por profesor (reportes de profesor)
CREATE INDEX IF NOT EXISTS idx_asistencia_teacher 
ON asistencia(teacher_id, created_at DESC);

-- 3. Asistencia: Consultas por grupo (estadísticas por clase)
CREATE INDEX IF NOT EXISTS idx_asistencia_grupo_date 
ON asistencia(student_id, created_at DESC) 
WHERE status IN ('tarde', 'falta');

-- 4. Students: Búsqueda por padre (consulta MÁS frecuente)
CREATE INDEX IF NOT EXISTS idx_students_parent 
ON students(parent_id);

-- 5. Students: Búsqueda por grupo (para profesores)
CREATE INDEX IF NOT EXISTS idx_students_grupo 
ON students(grupo_id);

-- 6. Profiles: Búsqueda por FCM token (para notificaciones)
CREATE INDEX IF NOT EXISTS idx_profiles_fcm 
ON profiles(fcm_token) 
WHERE fcm_token IS NOT NULL;

-- 7. Profiles: Búsqueda por rol y colegio (para admins)
CREATE INDEX IF NOT EXISTS idx_profiles_role_colegio 
ON profiles(role, colegio_id);

-- 8. Docentes-Grupos: Join frecuente
CREATE INDEX IF NOT EXISTS idx_docentes_grupos_teacher 
ON docentes_grupos(teacher_id);

CREATE INDEX IF NOT EXISTS idx_docentes_grupos_grupo 
ON docentes_grupos(grupo_id);

-- ================================================
-- ÍNDICES PARA MÓDULO ICFES (futuro)
-- ================================================

-- 9. ICFES Questions: Búsqueda por módulo
CREATE INDEX IF NOT EXISTS idx_icfes_questions_modulo 
ON icfes_questions(modulo);

-- 10. ICFES Attempts: Estadísticas por estudiante
CREATE INDEX IF NOT EXISTS idx_icfes_attempts_student 
ON icfes_attempts(student_id, es_correcta);

-- 11. ICFES Scores: Ranking (query MUY frecuente)
CREATE INDEX IF NOT EXISTS idx_icfes_scores_ranking 
ON icfes_scores(total_correctas DESC, porcentaje_acierto DESC);

-- ================================================
-- OPTIMIZACIÓN: POLÍTICAS RLS MEJORADAS
-- ================================================

-- Actualizar política de asistencia para usar índice
DROP POLICY IF EXISTS "Padres pueden ver asistencia de sus hijos" ON asistencia;
CREATE POLICY "Padres pueden ver asistencia de sus hijos"
  ON asistencia FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Optimizar política de estudiantes
DROP POLICY IF EXISTS "Padres pueden ver sus hijos" ON students;
CREATE POLICY "Padres pueden ver sus hijos"
  ON students FOR SELECT
  USING (parent_id = auth.uid());

-- ================================================
-- FUNCIÓN OPTIMIZADA: Obtener estadísticas de asistencia
-- ================================================

CREATE OR REPLACE FUNCTION get_attendance_stats(p_student_id UUID)
RETURNS TABLE(
  presente BIGINT,
  tarde BIGINT,
  falta BIGINT,
  total BIGINT,
  porcentaje_asistencia NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'presente') as presente,
    COUNT(*) FILTER (WHERE status = 'tarde') as tarde,
    COUNT(*) FILTER (WHERE status = 'falta') as falta,
    COUNT(*) as total,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'presente')::NUMERIC / 
       NULLIF(COUNT(*), 0) * 100), 
      2
    ) as porcentaje_asistencia
  FROM asistencia
  WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- FUNCIÓN: Obtener ranking de estudiantes por asistencia
-- ================================================

CREATE OR REPLACE FUNCTION get_attendance_ranking(p_colegio_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  total_presente BIGINT,
  total_asistencias BIGINT,
  porcentaje NUMERIC,
  ranking INT
) AS $$
BEGIN
  RETURN QUERY
  WITH student_stats AS (
    SELECT 
      s.id,
      s.full_name,
      COUNT(*) FILTER (WHERE a.status = 'presente') as presente,
      COUNT(*) as total
    FROM students s
    INNER JOIN asistencia a ON a.student_id = s.id
    WHERE s.colegio_id = p_colegio_id
    GROUP BY s.id, s.full_name
  )
  SELECT 
    id,
    full_name,
    presente,
    total,
    ROUND((presente::NUMERIC / NULLIF(total, 0) * 100), 2) as porcentaje,
    ROW_NUMBER() OVER (ORDER BY presente DESC, full_name ASC)::INT as ranking
  FROM student_stats
  WHERE total > 0
  ORDER BY presente DESC, full_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- OPTIMIZACIÓN: Limpieza de datos antiguos (opcional)
-- ================================================

-- Función para archivar asistencias viejas (ejecutar anualmente)
CREATE OR REPLACE FUNCTION archive_old_attendance(p_years_to_keep INT DEFAULT 2)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM asistencia
    WHERE created_at < NOW() - INTERVAL '1 year' * p_years_to_keep
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VACUUM Y ANALYZE (Mantenimiento)
-- ================================================

-- Ejecutar periódicamente para optimizar rendimiento
VACUUM ANALYZE asistencia;
VACUUM ANALYZE students;
VACUUM ANALYZE profiles;
VACUUM ANALYZE icfes_attempts;

-- ================================================
-- MONITOREO: Ver tamaño de tablas
-- ================================================

CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
  table_name TEXT,
  total_size TEXT,
  table_size TEXT,
  indexes_size TEXT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
    (SELECT COUNT(*) FROM (SELECT 1 FROM pg_class WHERE relname = tablename LIMIT 1) s) AS row_count
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Para ver el tamaño de las tablas:
-- SELECT * FROM get_table_sizes();

-- ================================================
-- FIN DE OPTIMIZACIONES
-- ================================================
-- Ejecutar: ANÁLIZE después de crear índices
ANALYZE;

-- Verificar que los índices se crearon:
-- SELECT * FROM pg_indexes WHERE schemaname = 'public';
