# 📖 RED EST UDIANTIL - BIBLIA DEL PROYECTO

> **Este documento es tu única fuente de verdad**. Contiene TODO sobre el proyecto: qué existe, qué falta, cómo hacerlo, y qué NO tocar. Léelo antes de empezar cualquier implementación.

---

## 📑 ÍNDICE

1. [Estado Actual del Proyecto](#estado-actual)
2. [Arquitectura y Principios](#arquitectura)
3. [Lo que YA EXISTE y NO se debe modificar](#no-modificar)
4. [Optimizaciones Aplicadas](#optimizaciones)
5. [MVP 3: ICFES - A Implementar](#mvp-3-icfes)
6. [Funcionalidades Futuras](#futuro)

---

<a name="estado-actual"></a>
## ✅ ESTADO ACTUAL DEL PROYECTO

### Stack Tecnológico
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS (version 3)
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Notificaciones**: Firebase Cloud Messaging (FCM)
- **PWA**: vite-plugin-pwa + Service Workers
- **IA**: Google Gemini API (pendiente implementar)

### Lo que FUNCIONA (100%)

#### ✅ Sistema de Autenticación
- **Login/Registro** con Supabase Auth
- **Gestión de sesiones** automática
- **Trigger automático** asigna rol "padre" a nuevos usuarios

#### ✅ Base de Datos Robusta

**Tablas activas:**
```
- profiles (usuarios con roles: padre/docente/admin/estudiante)
- students (estudiantes vinculados a padres)
- asistencia (registro diario de asistencia)
- grupos (clases/cursos)
- docentes_grupos (asignación de profesores a grupos)
```

**Seguridad RLS activa:**
- Padres solo ven sus propios hijos
- Profesores solo ven estudiantes de sus grupos
- Estudiantes solo ven su propia información
- Admin tiene acceso completo

**Funciones SQL:**
- `handle_new_user()`: Auto-asigna rol
- `get_my_role()`: Obtiene rol para RLS
- `is_my_child()`: Valida relación padre-hijo
- `get_attendance_stats()`: Estadísticas de asistencia (**NUEVA - Optimización**)
- `get_attendance_ranking()`: Top estudiantes (**NUEVA - Optimización**)

#### ✅ Flujos de Usuario Completos

**Padre:**
- Registrarse/Login
- Registrar hijos
- Ver lista de hijos
- Ver historial de asistencia de cada hijo
- Recibir notificaciones push

**Profesor:**
- Login con cuenta asignada por admin
- Ver grupos asignados
- Ver lista de estudiantes por grupo
- Tomar asistencia (Presente/Tarde/Falta)
- Sistema marca automáticamente con colores

**Admin:**
- Gestionar estudiantes
- Gestionar profesores
- Gestionar grupos
- Asignar profesores a grupos

#### ✅ Sistema de Notificaciones Push

**Edge Function:** `push-notification`
- **Ubicación:** `supabase/functions/push-notification/index.ts`
- **Trigger:** Webhook de base de datos en INSERT de `asistencia`
- **Función:**
  - Obtiene datos del estudiante y padre
  - **NUEVO:** Obtiene nombre del profesor
  - Genera mensaje personalizado
  - Envía vía Firebase FCM
  - **NUEVO:** URL apunta a producción Vercel

**Formato de notificación:**
```
🔔 Alerta de Asistencia
Juan Pérez faltó a la clase. Profesor: María López
```

**Service Worker:** `public/firebase-messaging-sw.js`
- Maneja notificaciones en background
- **NUEVO:** Usa logo de Red Estudiantil (`pwa-192x192.png`)

#### ✅ PWA Completa

**Características:**
- ✅ Instalable en móviles y desktop
- ✅ Iconos personalizados (192x192, 512x512, iOS)
- ✅ Manifest.json configurado
- ✅ Meta tags PWA en `index.html`
- ✅ Banner de instalación (`InstallPrompt` component)
- ✅ Service Worker integrado

**Componente:** `InstallPrompt.tsx`
- Se muestra en Dashboard para todos los roles
- Detecta si la app es instalable
- Permite activar notificaciones
- Se oculta automáticamente después de instalar

---

<a name="arquitectura"></a>
## 🏗️ ARQUITECTURA Y PRINCIPIOS

### Principios SOLID Aplicados

#### 1. Single Responsibility Principle (SRP)

**Service Layer** (`src/lib/services.ts`) ✅ YA EXISTE
- Cada servicio maneja UN solo dominio
- `AttendanceService`: Solo asistencia
- `StudentService`: Solo estudiantes
- `ProfileService`: Solo perfiles
- `GroupService`: Solo grupos
- `ICFESService`: Solo módulo ICFES (futuro)
- `AdminService`: Solo funciones admin

**Custom Hooks** (`src/hooks/useData.ts`) ✅ YA EXISTE
- Cada hook tiene UNA responsabilidad
- `useStudents`: Manejar lista de estudiantes
- `useAttendance`: Manejar asistencia
- `useProfile`: Manejar perfil de usuario
- `useMarkAttendance`: Marcar asistencia

**UI Components** (`src/components/ui/index.tsx`) ✅ YA EXISTE
- Componentes reutilizables y genéricos
- `Button`, `Card`, `Loading`, `Input`, `Select`
- `Badge`, `Modal`, `StatsCard`, `EmptyState`
- Todos configurables vía props

#### 2. Open/Closed Principle
- Componentes abiertos para extensión (props)
- Cerrados para modificación (no cambiar lógica interna)

#### 3. Interface Segregation
- Props específicos para cada componente
- No forzar dependencias innecesarias

#### 4. Dependency Inversion
- Componentes dependen de interfaces (props)
- No de implementaciones concretas

### Estructura de Directorios

```
src/
├── components/
│   ├── ui/                    ← Componentes reutilizables UI
│   │   └── index.tsx
│   ├── AdminGroupManager.tsx
│   ├── AdminStudentManager.tsx
│   ├── AdminTeacherManager.tsx
│   ├── ChildAttendanceList.tsx
│   ├── GroupStudentList.tsx
│   ├── InstallPrompt.tsx
│   ├── RegisterChildForm.tsx
│   ├── StudentList.tsx
│   └── TeacherGroupsList.tsx
├── hooks/
│   ├── useNotifications.ts   ← Notificaciones FCM
│   └── useData.ts            ← Queries a Supabase
├── lib/
│   ├── firebase.ts           ← Configuración Firebase
│   ├── supabaseClient.ts     ← Cliente Supabase
│   └── services.ts           ← Service Layer (NUEVO)
├── pages/
│   ├── Auth.tsx             ← Login/Registro
│   └── Dashboard.tsx        ← Dashboard principal
└── main.tsx
```

---

<a name="no-modificar"></a>
## ⚠️ LO QUE YA EXISTE Y **NO SE DEBE MODIFICAR**

### 🔴 CRÍTICO - NO TOCAR

#### Base de Datos - Tablas Existentes
```sql
-- NO modificar estructura de estas tablas:
- profiles (columnas: id, email, full_name, role, colegio_id, fcm_token)
- students (columnas: id, full_name, parent_id, grupo_id, colegio_id, user_id)
- asistencia (columnas: id, student_id, teacher_id, status, created_at)
- grupos (columnas: id, nombre, grado, colegio_id)
- docentes_grupos (columnas: id, teacher_id, grupo_id)
```

**PUEDE agregarse:**
- Nuevas columnas (con valores DEFAULT)
- Nuevas tablas para nuevos módulos
- Nuevos índices

**NO puede:**
- Eliminar columnas existentes
- Cambiar tipos de datos
- Eliminar tablas
- Modificar PK/FK existentes

#### RLS Policies Existentes
- **NO modificar** políticas de `profiles`, `students`, `asistencia`
- **SÍ puede** agregar nuevas políticas para nuevas tablas

#### Edge Function `push-notification`
- **Ubicación:** `supabase/functions/push-notification/index.ts`
- **Estado:** Actualizado y listo para deploy
- **NO modificar** estructura principal
- **SÍ puede:** Mejorar mensajes, agregar logging

#### Service Workers
- `public/firebase-messaging-sw.js` - NO modificar configuración
- Solo cambiar: iconos o mensajes personalizados

#### Componentes de Usuario Existentes
- `Dashboard.tsx` - Estructura principal OK
- `Auth.tsx` - NO modificar flujo de autenticación
- Todos los componentes en `src/components/` funcionan

---

<a name="optimizaciones"></a>
## ⚡ OPTIMIZACIONES APLICADAS

### 1. Base de Datos - Índices Agregados

**Script:** `supabase/migrations/optimize_database.sql` ✅ CREADO

**Índices nuevos:**
```sql
-- Asistencia (queries MÁS frecuentes)
idx_asistencia_student_date  → Calendario/historial
idx_asistencia_teacher       → Reportes de profesor
idx_asistencia_grupo_date    → Estadísticas por grupo

-- Students
idx_students_parent          → Vista de padre (MUY frecuente)
idx_students_grupo           → Lista para profesor

-- Profiles
idx_profiles_fcm             → Notificaciones
idx_profiles_role_colegio    → Admin queries

-- ICFES (futuro)
idx_icfes_questions_modulo
idx_icfes_attempts_student
idx_icfes_scores_ranking
```

**Funciones de utilidad:**
- `get_table_sizes()` - Ver tamaño de tablas
- `archive_old_attendance()` - Limpiar datos viejos

**Cómo ejecutar:**
1. Ir a Supabase Dashboard → SQL Editor
2. Copiar contenido de `optimize_database.sql`
3. Ejecutar

### 2. Service Layer (SOLID)

**Archivo:** `src/lib/services.ts` ✅ CREADO

**Ventajas:**
- Queries centralizadas en un solo lugar
- Fácil de debuggear
- Reutilizable
- Evita duplicación de código

**Cómo usar:**
```typescript
import { StudentService } from '../lib/services';

// Obtener estudiantes de un padre
const students = await StudentService.getByParent(parentId);

// Crear estudiante
const newStudent = await StudentService.create({...});
```

### 3. Custom Hooks (Separación de Lógica)

**Archivo:** `src/hooks/useData.ts` ✅ CREADO

**Hooks disponibles:**
- `useStudents(parentId)` - Lista de estudiantes
- `useAttendance(studentId)` - Historial de asistencia
- `useAttendanceStats(studentId)` - Estadísticas
- `useProfile()` - Perfil del usuario
- `useGroupStudents(groupId)` - Estudiantes de un grupo
- `useMarkAttendance()` - Marcar asistencia
- `useDebounce(value, delay)` - Utilidad

**Cómo usar:**
```typescript
import { useStudents } from '../hooks/useData';

function MyComponent() {
  const { students, loading, error, refetch } = useStudents(parentId);
  
  if (loading) return <Loading />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <StudentList students={students} />;
}
```

### 4. UI Component Library

**Archivo:** `src/components/ui/index.tsx` ✅ CREADO

**Componentes disponibles:**
- `<Button variant="primary|secondary|success|danger" />`
- `<Card title="..." footer={...} />`
- `<Loading text="..." size="sm|md|lg" />`
- `<EmptyState icon="📭" title="..." action={...} />`
- `<ErrorDisplay error="..." onRetry={() => ...} />`
- `<Input label="..." error="..." />`
- `<Select label="..." options={[...]} />`
- `<Badge variant="success|warning|danger" />`
- `<Modal isOpen={...} onClose={...} title="..." />`
- `<StatsCard title="..." value="..." icon="..." />`

**Cómo usar:**
```typescript
import { Button, Card, Loading } from '../components/ui';

<Card title="Mis Estudiantes">
  {loading ? (
    <Loading />
  ) : (
    <Button variant="success" onClick={handleClick}>
      Agregar Estudiante
    </Button>
  )}
</Card>
```

---

<a name="mvp-3-icfes"></a>
## 🎯 MVP 3: MODO ICFES - A IMPLEMENTAR EL LUNES

### Resumen

Sistema de entrenamiento ICFES con IA:
- 5 módulos (Matemáticas, Español, Sociales, Inglés, Ciencias)
- Preguntas de CSV
- IA explica respuestas con Gemini
- Leaderboard de mejores estudiantes
- Sistema de puntos automático

### Base de Datos Nueva

#### Tablas a Crear:

**1. `icfes_questions`**
```sql
CREATE TABLE icfes_questions (
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

CREATE INDEX idx_icfes_modulo ON icfes_questions(modulo);
```

**2. `icfes_attempts`**
```sql
CREATE TABLE icfes_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES icfes_questions(id) ON DELETE CASCADE,
  respuesta_estudiante TEXT NOT NULL CHECK (respuesta_estudiante IN ('A', 'B', 'C', 'D')),
  es_correcta BOOLEAN NOT NULL,
  tiempo_respuesta_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_icfes_attempts_student ON icfes_attempts(student_id, es_correcta);
```

**3. `icfes_scores`** (Leaderboard)
```sql
CREATE TABLE icfes_scores (
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

CREATE INDEX idx_icfes_scores_ranking ON icfes_scores(total_correctas DESC, porcentaje_acierto DESC);
```

**4. Trigger Automático de Puntajes**
```sql
CREATE OR REPLACE FUNCTION update_icfes_score()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER on_icfes_attempt_insert
  AFTER INSERT ON icfes_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_icfes_score();
```

**5. RLS Policies**
```sql
-- Habilitar RLS
ALTER TABLE icfes_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE icfes_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE icfes_scores ENABLE ROW LEVEL SECURITY;

-- Todos leen preguntas
CREATE POLICY "read_questions" ON icfes_questions FOR SELECT USING (true);

-- Estudiantes ven sus intentos
CREATE POLICY "read_own_attempts" ON icfes_attempts FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Estudiantes insertan sus intentos
CREATE POLICY "insert_own_attempts" ON icfes_attempts FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Todos ven leaderboard
CREATE POLICY "read_leaderboard" ON icfes_scores FOR SELECT USING (true);
```

### Componentes a Crear

#### 1. `ICFESTraining.tsx`

**Ubicación:** `src/components/ICFESTraining.tsx`

**Props:**
```typescript
interface Props {
  studentId: string;
}
```

**Funcionalidad:**
1. Mostrar 5 botones de módulos
2. Al seleccionar módulo:
   - IA saluda y motiva (Gemini)
   - Carga pregunta aleatoria del CSV
3. Muestra pregunta con 4 opciones (A, B, C, D)
4. Usuario selecciona respuesta
5. Se guarda en `icfes_attempts`
6. IA genera feedback:
   - ✅ Correcta: Felicitación + explicación POR QUÉ es correcta
   - ❌ Incorrecta: Motivación + explicación de la correcta
7. Botón "Siguiente pregunta"

**Código completo en ROADMAP líneas 189-406**

#### 2. `ICFESLeaderboard.tsx`

**Ubicación:** `src/components/ICFESLeaderboard.tsx`

**Funcionalidad:**
1. Query a `icfes_scores` ordenado por `total_correctas DESC`
2. Mostrar top 10
3. Podio visual:
   - 🥇 1er lugar: Fondo dorado
   - 🥈 2do lugar: Fondo plateado
   - 🥉 3er lugar: Fondo bronce
4. Mostrar: Nombre, correctas/total, porcentaje

**Código completo en ROADMAP líneas 412-492**

### Integración en Dashboard

**Modificar:** `src/pages/Dashboard.tsx`

**Agregar:**
```typescript
import ICFESTraining from '../components/ICFESTraining';
import ICFESLeaderboard from '../components/ICFESLeaderboard';

// Nuevo estado
const [studentView, setStudentView] = useState<'menu' | 'icfes' | 'leaderboard'>('menu');

// En el render (agregar nueva sección para estudiantes)
{profile && profile.role === 'estudiante' && (
  <div className="mt-8 w-full max-w-md space-y-6">
    {studentView === 'menu' && (
      <>
        <Button onClick={() => setStudentView('icfes')} fullWidth variant="primary">
          🎓 Entrenar ICFES
        </Button>
        <Button onClick={() => setStudentView('leaderboard')} fullWidth variant="secondary">
          🏆 Ver Ranking
        </Button>
      </>
    )}
    
    {studentView === 'icfes' && (
      <>
        <ICFESTraining studentId={selectedStudent.id} />
        <Button onClick={() => setStudentView('menu')} variant="secondary">Volver</Button>
      </>
    )}
    
    {studentView === 'leaderboard' && (
      <>
        <ICFESLeaderboard />
        <Button onClick={() => setStudentView('menu')} variant="secondary">Volver</Button>
      </>
    )}
  </div>
)}
```

### Dependencias Necesarias

```bash
npm install @google/generative-ai papaparse
npm install -D @types/papaparse
```

### Variables de Entorno

```env
# .env.local
VITE_GEMINI_API_KEY=tu-api-key-aqui
```

**Obtener API Key:**
1. https://makersuite.google.com/app/apikey
2. Crear proyecto
3. Generar API Key
4. Copiar a `.env.local`

### Importar Preguntas CSV

**Script:** `scripts/import-icfes.js` (crear nuevo)

```javascript
import fs from 'fs';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function importCSV(filePath, modulo) {
  const csvFile = fs.readFileSync(filePath, 'utf8');
  const { data } = Papa.parse(csvFile, { header: true });

  for (const row of data) {
    await supabase.from('icfes_questions').insert({
      modulo,
      enunciado: row.enunciado,
      opcion_a: row.opcion_a,
      opcion_b: row.opcion_b,
      opcion_c: row.opcion_c,
      opcion_d: row.opcion_d,
      respuesta_correcta: row.respuesta_correcta.toUpperCase(),
      explicacion: row.explicacion,
      year: parseInt(row.year) || null
    });
  }
  
  console.log(`✅ Importadas ${data.length} preguntas de ${modulo}`);
}

// Ejecutar
importCSV('./data/matematicas.csv', 'matematicas');
```

**Formato CSV:**
```csv
enunciado,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta,explicacion,year
"¿Cuánto es 2+2?","3","4","5","6","B","La suma de 2+2 es 4",2023
```

### Checklist Día por Día

**Día 1: Base de Datos (Lunes)**
- [ ] Crear tablas en Supabase SQL Editor
- [ ] Crear trigger de puntajes
- [ ] Configurar RLS policies
- [ ] Probar INSERT manual

**Día 2: Importar Datos (Martes)**
- [ ] Conseguir/crear CSVs de preguntas ICFES
- [ ] Crear script de importación
- [ ] Importar 50+ preguntas por módulo
- [ ] Verificar en Table Editor

**Día 3: Frontend - Training (Miércoles)**
- [ ] Crear `ICFESTraining.tsx`
- [ ] Implementar selección de módulos
- [ ] Implementar flujo pregunta-respuesta
- [ ] Integrar Gemini para feedback
- [ ] Probar localmente

**Día 4: Frontend - Leaderboard (Jueves)**
- [ ] Crear `ICFESLeaderboard.tsx`
- [ ] Diseñar podio visual
- [ ] Integrar en Dashboard
- [ ] Probar con datos reales

**Día 5: Deploy y Testing (Viernes)**
- [ ] Deploy a Vercel
- [ ] Probar flujo completo en producción
- [ ] Verificar que puntajes se actualicen
- [ ] Verificar ranking

---

<a name="futuro"></a>
## 🚀 FUNCIONALIDADES FUTURAS (Post-ICFES)

### Prioridad Media

#### Calendario Visual de Asistencia
- Mostrar asistencia en calendario mensual
- Colores: verde (presente), amarillo (tarde), rojo (falta)
- Dependencia: `react-calendar`

#### Gráficas de Estadísticas
- Pie chart de asistencia
- Tendencias semanales/mensuales
- Dependencia: `recharts`

#### ChatPadre-Profesor
- Mensajería en tiempo real
- Supabase Realtime
- Historial de conversaciones

### Prioridad Baja

- Módulo de Calificaciones
- Módulo de Tareas
- Módulo de Horarios
- Reportes exportables (PDF/Excel)
- Multi-colegio (subdominios)
- Analytics y monitoring

---

## 📦 DEPLOYMENT

### Pendiente (Hacer el Lunes)

1. **Desplegar Edge Function**
   - Opción A: Dashboard Supabase (copiar/pegar código)
   - Opción B: CLI `npx supabase functions deploy push-notification`

2. **Desplegar Frontend**
   ```bash
   git add .
   git commit -m "feat: optimize code + ICFES ready"
   git push origin main
   ```
   Vercel despliega automático

3. **Ejecutar Optimizaciones DB**
   - SQL Editor → Copiar `optimize_database.sql` → Ejecutar

---

## 🎯 INSTRUCCIONES PARA EL LUNES

### Paso 1: Deployment de lo Actual

```bash
# En la U, con buena conexión
1. Abrir dashboard.supabase.com
2. Edge Functions → push-notification → EDIT
3. Copiar TODO el contenido de supabase/functions/push-notification/index.ts
4. Pegar → DEPLOY
5. Verificar en Logs que funcione
```

### Paso 2: Abrir esta Conversación

- Buscar en historial o usar link guardado
- Decir: **"Claude, vamos con el MVP 3 ICFES"**

### Paso 3: Implementación ICFES

Claude te guiará paso a paso:
1. Crear tablas
2. Importar CSVs
3. Crear componentes
4. Integrar en Dashboard
5. Probar y deployar

**Duración estimada:** 3-5 días

---

## ⚡ TIPS DE PERFORMANCE

### Queries Optimizadas

**✅ BUENO:**
```typescript
// Usa índices
const students = await StudentService.getByParent(parentId);
```

**❌ MALO:**
```typescript
// Query sin índice
const students = await supabase.from('students').select('*');
```

### Componentes

**✅ BUENO:**
```typescript
// Usa custom hooks
const { students, loading } = useStudents(parentId);
```

**❌ MALO:**
```typescript
// Lógica directa en componente
const [students, setStudents] = useState([]);
useEffect(() => { /* query */ }, []);
```

### UI

**✅ BUENO:**
```typescript
import { Button, Card } from '../components/ui';
<Button variant="primary">Click</Button>
```

**❌ MALO:**
```typescript
<button className="bg-cyan-600 hover:bg-cyan-700...">Click</button>
```

---

## 📚 RECURSOS

- **Supabase Docs:** https://supabase.com/docs
- **Firebase FCM:** https://firebase.google.com/docs/cloud-messaging
- **Gemini API:** https://ai.google.dev/
- **React Hooks:** https://react.dev/reference/react
- **TailwindCSS:** https://tailwindcss.com/docs

---

## 🎉 RESUMEN EJECUTIVO

**LO QUE TIENES:**
- Sistema de asistencia completo ✅
- Notificaciones push funcionales ✅
- PWA instalable ✅
- 3 roles completos (padre, profesor, admin) ✅
- Base de datos optimizada ✅
- Código refactorizado con SOLID ✅

**LO QUE FALTA:**
- MVP 3: Sistema ICFES con IA 🎯 (3-5 días)
- Calendario visual 📅 (1 día)
- Gráficas 📊 (1 día)
- Chat tiempo real 💬 (2-3 días)

**ESCALABILIDAD:**
- Free tier: 1-3 colegios
- Supabase Pro ($25/mes): 10-50 colegios
- Firebase: Gratis hasta millones de notificaciones

**PRÓXIMO PASO:** Deploy actual + Implementar ICFES el lunes

---

¿Listo para el lunes? 🚀
