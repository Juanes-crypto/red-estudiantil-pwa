-- 1. Tabla de Excusas Médicas (Padre -> Docente)
CREATE TABLE IF NOT EXISTS medical_excuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  file_url TEXT, -- Opcional: URL del archivo en Storage
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  teacher_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para excusas
CREATE INDEX idx_excuses_student ON medical_excuses(student_id);
CREATE INDEX idx_excuses_parent ON medical_excuses(parent_id);

-- 2. Tabla de Anuncios/Recordatorios (Docente -> Grupos)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE, -- Opcional: Fecha del evento/entrega
  type TEXT NOT NULL CHECK (type IN ('homework', 'exam', 'event', 'reminder')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para anuncios
CREATE INDEX idx_announcements_teacher ON announcements(teacher_id);

-- Tabla intermedia para relacionar Anuncios con Grupos (Many-to-Many)
CREATE TABLE IF NOT EXISTS announcement_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_announcement_groups_group ON announcement_groups(group_id);

-- 3. Tabla de Alertas Privadas (Docente -> Padre)
CREATE TABLE IF NOT EXISTS private_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Se puede inferir de student, pero mejor explícito para queries rápidas
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_parent ON private_alerts(parent_id);
CREATE INDEX idx_alerts_student ON private_alerts(student_id);

-- ==========================================
-- RLS POLICIES (Seguridad)
-- ==========================================

-- Habilitar RLS
ALTER TABLE medical_excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_alerts ENABLE ROW LEVEL SECURITY;

-- Policies para Medical Excuses
-- Padres: Pueden ver e insertar sus propias excusas
CREATE POLICY "Padres ven sus excusas" ON medical_excuses FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Padres crean excusas" ON medical_excuses FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- Docentes: Pueden ver excusas de estudiantes en sus grupos
-- (Esta query es compleja, simplificamos asumiendo que si eres docente puedes ver excusas por ahora, 
--  o idealmente filtrar por grupos asignados. Para MVP, permitimos a docentes ver todas o filtramos en frontend)
CREATE POLICY "Docentes ven excusas" ON medical_excuses FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'docente'));
  
CREATE POLICY "Docentes actualizan excusas" ON medical_excuses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'docente'));

-- Policies para Announcements
-- Docentes: CRUD total de sus anuncios
CREATE POLICY "Docentes gestionan sus anuncios" ON announcements FOR ALL
  USING (teacher_id = auth.uid());

-- Todos (Estudiantes/Padres): Pueden ver anuncios (El filtrado por grupo se hace en la query via announcement_groups)
CREATE POLICY "Todos ven anuncios" ON announcements FOR SELECT USING (true);

-- Policies para Announcement Groups
CREATE POLICY "Docentes gestionan grupos de anuncios" ON announcement_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM announcements WHERE id = announcement_id AND teacher_id = auth.uid()));

CREATE POLICY "Todos ven grupos de anuncios" ON announcement_groups FOR SELECT USING (true);

-- Policies para Private Alerts
-- Docentes: Crean y ven alertas que ellos enviaron
CREATE POLICY "Docentes gestionan sus alertas" ON private_alerts FOR ALL
  USING (teacher_id = auth.uid());

-- Padres: Ven alertas dirigidas a ellos
CREATE POLICY "Padres ven sus alertas" ON private_alerts FOR SELECT
  USING (parent_id = auth.uid());

-- Padres: Pueden marcar como leido (UPDATE is_read)
CREATE POLICY "Padres marcan leido" ON private_alerts FOR UPDATE
  USING (parent_id = auth.uid());
