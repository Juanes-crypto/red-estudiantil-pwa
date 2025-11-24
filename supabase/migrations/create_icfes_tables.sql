-- ================================================
-- MIGRACIÓN: Sistema ICFES - Tablas y Funciones
-- ================================================
-- Autor: Red Estudiantil
-- Fecha: 2025-11-23
-- Descripción: Sistema completo de entrenamiento ICFES
-- ================================================

-- ================================================
-- 1. AGREGAR COLUMNA PARA API KEY EN STUDENTS
-- ================================================

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

COMMENT ON COLUMN students.gemini_api_key IS 'API Key de Google Gemini para IA personalizada';

-- ================================================
-- 2. TABLA: icfes_questions (Banco de preguntas)
-- ================================================

CREATE TABLE IF NOT EXISTS icfes_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo TEXT NOT NULL CHECK (modulo IN ('lectura', 'matematicas', 'sociales', 'ingles', 'ciencias')),
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

-- Índice para búsquedas por módulo (MUY frecuente)
CREATE INDEX IF NOT EXISTS idx_icfes_questions_modulo 
ON icfes_questions(modulo);

COMMENT ON TABLE icfes_questions IS 'Banco de preguntas ICFES por módulo';

-- ================================================
-- 3. TABLA: icfes_attempts (Intentos de respuesta)
-- ================================================

CREATE TABLE IF NOT EXISTS icfes_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES icfes_questions(id) ON DELETE CASCADE,
  respuesta_estudiante TEXT NOT NULL CHECK (respuesta_estudiante IN ('A', 'B', 'C', 'D')),
  es_correcta BOOLEAN NOT NULL,
  tiempo_respuesta_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para estadísticas
CREATE INDEX IF NOT EXISTS idx_icfes_attempts_student 
ON icfes_attempts(student_id, es_correcta);

CREATE INDEX IF NOT EXISTS idx_icfes_attempts_question 
ON icfes_attempts(question_id);

COMMENT ON TABLE icfes_attempts IS 'Histórico de intentos de respuesta de estudiantes';

-- ================================================
-- 4. TABLA: icfes_scores (Leaderboard automático)
-- ================================================

CREATE TABLE IF NOT EXISTS icfes_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  total_correctas INTEGER DEFAULT 0,
  total_intentos INTEGER DEFAULT 0,
  porcentaje_acierto DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_intentos > 0 THEN (total_correctas::DECIMAL / total_intentos * 100)
      ELSE 0
    END
  ) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ranking (ORDER BY más rápido)
CREATE INDEX IF NOT EXISTS idx_icfes_scores_ranking 
ON icfes_scores(total_correctas DESC, porcentaje_acierto DESC);

COMMENT ON TABLE icfes_scores IS 'Puntajes acumulados de estudiantes para leaderboard';

-- ================================================
-- 5. TRIGGER: Actualizar puntaje automáticamente
-- ================================================

CREATE OR REPLACE FUNCTION update_icfes_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar o actualizar puntaje del estudiante
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

-- Trigger que se ejecuta en cada INSERT de icfes_attempts
CREATE TRIGGER on_icfes_attempt_insert
  AFTER INSERT ON icfes_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_icfes_score();

COMMENT ON FUNCTION update_icfes_score IS 'Auto-actualiza puntajes en leaderboard';

-- ================================================
-- 6. RLS POLICIES (Seguridad)
-- ================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE icfes_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE icfes_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE icfes_scores ENABLE ROW LEVEL SECURITY;

-- POLICY: Todos pueden leer preguntas
CREATE POLICY "read_icfes_questions" 
ON icfes_questions FOR SELECT 
USING (true);

-- POLICY: Estudiantes ven solo sus propios intentos
CREATE POLICY "read_own_icfes_attempts" 
ON icfes_attempts FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- POLICY: Estudiantes insertan solo sus propios intentos
CREATE POLICY "insert_own_icfes_attempts" 
ON icfes_attempts FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- POLICY: Todos pueden ver el leaderboard
CREATE POLICY "read_icfes_leaderboard" 
ON icfes_scores FOR SELECT 
USING (true);

-- ================================================
-- 7. PREGUNTAS DE EJEMPLO (Basadas en ICFES oficial)
-- ================================================

-- LECTURA CRÍTICA (10 preguntas)
INSERT INTO icfes_questions (modulo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, year) VALUES
('lectura', 'En el texto "El amor en los tiempos del cólera" de García Márquez, ¿cuál es el tema principal?', 'El amor que perdura a través del tiempo', 'La enfermedad del cólera en Colombia', 'Los conflictos políticos del siglo XIX', 'La vida urbana en Cartagena', 'A', 'El tema central es el amor que persiste a pesar del paso del tiempo y las adversidades, como se muestra en la relación entre Florentino y Fermina.', 2024),
('lectura', '¿Qué figura literaria se presenta en: "Tus ojos son dos luceros"?', 'Metáfora', 'Símil', 'Hipérbole', 'Personificación', 'A', 'Es una metáfora porque hace una comparación directa sin usar "como" o "cual", identificando los ojos con luceros.', 2024),
('lectura', 'En un texto argumentativo, ¿cuál es la función de la tesis?', 'Presentar datos estadísticos', 'Exponer la idea principal que se defenderá', 'Concluir el texto', 'Refutar argumentos contrarios', 'B', 'La tesis es la idea central que el autor va a defender y sustentar a lo largo del texto argumentativo.', 2023),
('lectura', 'Identifica el tipo de texto: "Instrucciones para armar un mueble"', 'Narrativo', 'Descriptivo', 'Instructivo', 'Argumentativo', 'C', 'Es un texto instructivo porque su objetivo es guiar paso a paso en la realización de una tarea específica.', 2023),
('lectura', '¿Qué es un texto expositivo?', 'Un texto que narra hechos ficticios', 'Un texto que informa objetivamente sobre un tema', 'Un texto que convence al lector', 'Un texto que describe sentimientos', 'B', 'El texto expositivo presenta información de manera objetiva y clara sobre un tema específico, sin opiniones personales.', 2024),
('lectura', 'En la oración "El niño corre rápido", la palabra "rápido" es:', 'Sustantivo', 'Verbo', 'Adverbio', 'Adjetivo', 'C', 'Es un adverbio de modo porque modifica al verbo "corre", indicando cómo se realiza la acción.', 2023),
('lectura', '¿Cuál es la función del prólogo en un libro?', 'Resumir toda la historia', 'Introducir y contextualizar la obra', 'Cerrar la narración', 'Presentar al autor', 'B', 'El prólogo sirve para introducir la obra, dar contexto y preparar al lector para la lectura.', 2024),
('lectura', 'Identifica la idea principal: "El agua es esencial para la vida. Sin ella, no existirían plantas ni animales."', 'Las plantas necesitan agua', 'El agua es vital para la vida', 'Los animales beben agua', 'Sin agua no hay plantas', 'B', 'La idea principal es que el agua es esencial/vital para la vida, las demás son ideas secundarias que la apoyan.', 2023),
('lectura', '¿Qué es una inferencia en lectura?', 'Copiar textualmente lo que dice el autor', 'Deducir información no explícita del texto', 'Resumir el texto', 'Memorizar datos importantes', 'B', 'Inferir es deducir o concluir información que no está escrita explícitamente, pero se puede extraer del contexto.', 2024),
('lectura', 'En "El coronel no tiene quien le escriba", el coronel espera:', 'Una carta del gobierno', 'Una pensión por sus servicios', 'Noticias de su hijo', 'Un empleo nuevo', 'B', 'El coronel espera una pensión del gobierno por sus servicios militares, que nunca llega.', 2023);

-- MATEMÁTICAS (10 preguntas)
INSERT INTO icfes_questions (modulo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, year) VALUES
('matematicas', 'Si x + 5 = 12, ¿cuánto vale x?', '5', '7', '17', '12', 'B', 'Para despejar x, restamos 5 en ambos lados: x = 12 - 5 = 7', 2024),
('matematicas', '¿Cuál es el área de un rectángulo de 8 cm de largo y 3 cm de ancho?', '11 cm²', '22 cm²', '24 cm²', '16 cm²', 'C', 'El área del rectángulo es base × altura = 8 × 3 = 24 cm²', 2024),
('matematicas', 'El 25% de 200 es:', '25', '50', '75', '100', 'B', '25% = 25/100 = 0.25, entonces 0.25 × 200 = 50', 2023),
('matematicas', '¿Cuántos lados tiene un hexágono?', '5', '6', '7', '8', 'B', 'El prefijo "hexa" significa seis, por lo tanto un hexágono tiene 6 lados.', 2023),
('matematicas', 'Si 2x = 18, entonces x es:', '9', '16', '20', '36', 'A', 'Dividiendo ambos lados entre 2: x = 18 ÷ 2 = 9', 2024),
('matematicas', 'La raíz cuadrada de 64 es:', '6', '7', '8', '9', 'C', '8 × 8 = 64, por lo tanto √64 = 8', 2023),
('matematicas', '¿Cuál es el perímetro de un cuadrado de lado 5 cm?', '10 cm', '15 cm', '20 cm', '25 cm', 'C', 'El perímetro es la suma de todos los lados: 5 + 5 + 5 + 5 = 20 cm', 2024),
('matematicas', 'Si un producto cuesta $80 y tiene 20% de descuento, ¿cuánto pagas?', '$60', '$64', '$72', '$76', 'B', 'El 20% de $80 es $16, entonces pagas $80 - $16 = $64', 2023),
('matematicas', '¿Cuántos grados tiene un ángulo recto?', '45°', '60°', '90°', '180°', 'C', 'Por definición, un ángulo recto mide exactamente 90°', 2024),
('matematicas', 'El resultado de 7² es:', '14', '49', '21', '28', 'B', '7² significa 7 × 7 = 49', 2023);

-- CIENCIAS SOCIALES (10 preguntas)
INSERT INTO icfes_questions (modulo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, year) VALUES
('sociales', '¿En qué año se firmó la independencia de Colombia?', '1810', '1819', '1820', '1830', 'B', 'La independencia definitiva de Colombia se firmó el 7 de agosto de 1819 tras la Batalla de Boyacá.', 2024),
('sociales', '¿Quién fue Simón Bolívar?', 'Un científico colombiano', 'El libertador de varios países sudamericanos', 'Un escritor del siglo XIX', 'Un explorador español', 'B', 'Simón Bolívar fue el principal líder de la independencia de Venezuela, Colombia, Ecuador, Perú y Bolivia.', 2023),
('sociales', '¿Cuál es la capital de Colombia?', 'Medellín', 'Cali', 'Bogotá', 'Cartagena', 'C', 'Bogotá es la capital y ciudad más grande de Colombia desde 1991.', 2024),
('sociales', 'Los tres poderes públicos en Colombia son:', 'Federal, Estatal y Municipal', 'Ejecutivo, Legislativo y Judicial', 'Presidente, Senado y Corte', 'Nacional, Regional y Local', 'B', 'La división de poderes de Montesquieu incluye el Ejecutivo (presidente), Legislativo (congreso) y Judicial (cortes).', 2023),
('sociales', '¿Qué es la Constitución Política?', 'Un libro de historia', 'La ley fundamental del Estado', 'Un tratado internacional', 'El código penal', 'B', 'La Constitución es la norma suprema que establece los derechos, deberes y organización del Estado.', 2024),
('sociales', '¿En qué continente está Colombia?', 'África', 'Asia', 'América del Sur', 'Europa', 'C', 'Colombia está ubicada en el extremo norte de América del Sur.', 2023),
('sociales', 'La Revolución Industrial comenzó en:', 'Francia', 'Inglaterra', 'Estados Unidos', 'Alemania', 'B', 'La Revolución Industrial se inició en Inglaterra a mediados del siglo XVIII.', 2024),
('sociales', '¿Qué océano baña las costas de Colombia?', 'Solo el Atlántico', 'Solo el Pacífico', 'Atlántico y Pacífico', 'Índico', 'C', 'Colombia tiene costas tanto en el Océano Atlántico (Mar Caribe) como en el Océano Pacífico.', 2023),
('sociales', 'La ONU (Organización de Naciones Unidas) se fundó en:', '1918', '1939', '1945', '1960', 'C', 'La ONU fue fundada en 1945 después de la Segunda Guerra Mundial para promover la paz mundial.', 2024),
('sociales', '¿Qué son los derechos humanos?', 'Privilegios de algunos ciudadanos', 'Derechos fundamentales de todas las personas', 'Normas religiosas', 'Leyes económicas', 'B', 'Los derechos humanos son derechos inherentes a todos los seres humanos, sin distinción alguna.', 2023);

-- CIENCIAS NATURALES (10 preguntas)
INSERT INTO icfes_questions (modulo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, year) VALUES
('ciencias', '¿Cuál es la unidad básica de la vida?', 'El átomo', 'La molécula', 'La célula', 'El tejido', 'C', 'La célula es la unidad estructural y funcional más pequeña de todos los seres vivos.', 2024),
('ciencias', 'La fotosíntesis la realizan:', 'Los animales', 'Las plantas', 'Los hongos', 'Las bacterias', 'B', 'Las plantas realizan fotosíntesis para producir su alimento usando luz solar, agua y CO₂.', 2023),
('ciencias', '¿Cuántos planetas tiene el Sistema Solar?', '7', '8', '9', '10', 'B', 'El Sistema Solar tiene 8 planetas desde que Plutón fue reclasificado como planeta enano en 2006.', 2024),
('ciencias', 'El agua está compuesta por:', 'Hidrógeno y oxígeno', 'Carbono y oxígeno', 'Nitrógeno e hidrógeno', 'Oxígeno puro', 'A', 'La molécula de agua (H₂O) está formada por dos átomos de hidrógeno y uno de oxígeno.', 2023),
('ciencias', '¿Qué es la gravedad?', 'Una forma de energía', 'La fuerza que atrae objetos hacia la Tierra', 'Un tipo de movimiento', 'Una sustancia química', 'B', 'La gravedad es la fuerza de atracción que ejerce la Tierra sobre los objetos hacia su centro.', 2024),
('ciencias', 'Los seres vivos se clasifican en:', 'Tres reinos', 'Cinco reinos', 'Siete reinos', 'Diez reinos', 'B', 'Los cinco reinos son: Monera, Protista, Fungi, Plantae y Animalia.', 2023),
('ciencias', '¿Qué gas expulsamos al respirar?', 'Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno', 'C', 'Al respirar inhalamos oxígeno y exhalamos dióxido de carbono (CO₂) como producto del metabolismo.', 2024),
('ciencias', 'La Tierra gira alrededor del Sol en un movimiento llamado:', 'Rotación', 'Traslación', 'Oscilación', 'Vibración', 'B', 'El movimiento de traslación es el que realiza la Tierra alrededor del Sol y dura 365 días.', 2023),
('ciencias', '¿Cuál es el órgano más grande del cuerpo humano?', 'El corazón', 'El cerebro', 'La piel', 'El hígado', 'C', 'La piel es el órgano más grande del cuerpo y cumple funciones de protección y regulación térmica.', 2024),
('ciencias', 'Los animales que comen solo plantas se llaman:', 'Carnívoros', 'Herbívoros', 'Omnívoros', 'Insectívoros', 'B', 'Los herbívoros son animales que se alimentan exclusivamente de plantas y vegetales.', 2023);

-- INGLÉS (10 preguntas)
INSERT INTO icfes_questions (modulo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, year) VALUES
('ingles', 'Complete: "She _____ to school every day"', 'go', 'goes', 'going', 'gone', 'B', 'Con el pronombre "she" (tercera persona singular), el verbo en presente simple lleva -s o -es: goes.', 2024),
('ingles', 'What is the opposite of "hot"?', 'Warm', 'Cold', 'Big', 'Small', 'B', 'El opuesto de "hot" (caliente) es "cold" (frío).', 2023),
('ingles', 'Choose the correct sentence:', 'I am have a book', 'I has a book', 'I have a book', 'I having a book', 'C', 'La forma correcta es "I have" en presente simple para el pronombre "I".', 2024),
('ingles', 'What time is it? 3:15', 'Three o''clock', 'Quarter past three', 'Half past three', 'Three thirty', 'B', '3:15 se lee como "quarter past three" (un cuarto después de las tres).', 2023),
('ingles', '"Beautiful" is:', 'A noun', 'A verb', 'An adjective', 'An adverb', 'C', '"Beautiful" es un adjetivo que describe la cualidad de hermoso/a.', 2024),
('ingles', 'The past tense of "eat" is:', 'Eated', 'Ate', 'Eaten', 'Eats', 'B', 'El pasado simple del verbo irregular "eat" es "ate".', 2023),
('ingles', 'How do you say "libro" in English?', 'Book', 'Cook', 'Look', 'Hook', 'A', 'Libro en inglés se dice "book".', 2024),
('ingles', '"They _____ playing soccer now"', 'is', 'am', 'are', 'be', 'C', 'Con el pronombre "they" se usa "are" en presente continuo: They are playing.', 2023),
('ingles', 'What color is the sky on a clear day?', 'Green', 'Blue', 'Red', 'Yellow', 'B', 'El cielo en un día despejado es azul (blue).', 2024),
('ingles', 'Choose the correct question:', 'Where you are from?', 'Where are you from?', 'Where from you are?', 'You are from where?', 'B', 'La forma correcta de preguntar es "Where are you from?" (¿De dónde eres?).', 2023);

-- ================================================
-- 8. VERIFICACIÓN
-- ================================================

-- Ver total de preguntas por módulo
SELECT modulo, COUNT(*) as total_preguntas 
FROM icfes_questions 
GROUP BY modulo 
ORDER BY modulo;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ ICFES Database Setup Complete!';
  RAISE NOTICE '📚 Total questions: 50 (10 per module)';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Triggers and functions created';
END $$;
