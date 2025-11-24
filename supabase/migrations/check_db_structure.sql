-- ============================================================
-- SCRIPT DE DIAGNÓSTICO DE ESTRUCTURA DE BASE DE DATOS
-- ============================================================
-- Ejecuta este script en el SQL Editor de Supabase y
-- COPIA EL RESULTADO (JSON) para enviármelo.
-- ============================================================

WITH table_info AS (
    SELECT 
        t.table_name,
        json_agg(
            json_build_object(
                'column_name', c.column_name,
                'data_type', c.data_type,
                'is_nullable', c.is_nullable
            )
        ) as columns
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
      AND t.table_name IN ('medical_excuses', 'excuse_recipients', 'docentes_grupos', 'profiles', 'grupos', 'students')
    GROUP BY t.table_name
),
fk_info AS (
    SELECT 
        tc.table_name,
        json_agg(
            json_build_object(
                'constraint_name', tc.constraint_name,
                'column_name', kcu.column_name,
                'foreign_table_name', ccu.table_name,
                'foreign_column_name', ccu.column_name
            )
        ) as foreign_keys
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    GROUP BY tc.table_name
)
SELECT 
    json_build_object(
        'tables', (SELECT json_agg(json_build_object('name', table_name, 'columns', columns)) FROM table_info),
        'foreign_keys', (SELECT json_agg(json_build_object('table', table_name, 'keys', foreign_keys)) FROM fk_info)
    ) as db_structure;
