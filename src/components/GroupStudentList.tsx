// 1. Imports
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// 2. Definimos las "Props"
interface Props {
  groupId: string; // El ID del grupo que seleccionó
}

// 3. ¡TIPO DE ESTUDIANTE MEJORADO!
// Ahora incluye un estado de UI para los botones
interface StudentWithStatus {
  id: string;
  full_name: string;
  status: 'pending' | 'submitting' | 'submitted'; // Estado para esta sesión
}

export default function GroupStudentList({ groupId }: Props) {
  // 4. Estados
  const [studentList, setStudentList] = useState<StudentWithStatus[]>([]) // Renombrado
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 5. ¡El useEffect! Se ejecuta cuando el ID del grupo cambia
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)

        // ¡La Consulta! (La misma que tenías)
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name')
          .eq('grupo_id', groupId)

        if (error) throw error

        // ¡NUEVO! Formateamos los estudiantes para añadir el estado de UI
        const formattedStudents = (data || []).map(student => ({
          ...student,
          status: 'pending' as 'pending' // Estado inicial
        }));

        setStudentList(formattedStudents); // Guardamos la lista formateada

      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchStudents() // ¡Llamamos a la función!
    }
  }, [groupId]) // Se re-ejecuta si el groupId cambia

  // 6. ¡NUEVA FUNCIÓN! Para marcar la asistencia
  const handleMarkAttendance = async (studentId: string, newStatus: 'presente' | 'tarde' | 'falta') => {
    try {
      // 0. Obtenemos el ID del docente logueado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No se pudo encontrar al docente.");

      // 1. Actualizar UI: Poner este estudiante en modo 'submitting'
      setStudentList(currentList =>
        currentList.map(student =>
          student.id === studentId ? { ...student, status: 'submitting' } : student
        )
      );

      // 2. ¡LA INSERCIÓN! (Nuestra Política RLS del Paso 28 lo permite)
      const { error } = await supabase.from('asistencia').insert({
        student_id: studentId,
        teacher_id: user.id, // ID del docente logueado
        status: newStatus,
        // 'created_at' y 'id' se manejan solos en la DB
      });

      if (error) throw error; // Si falla, salta al catch

      // 3. Actualizar UI: Marcar como 'submitted'
      setStudentList(currentList =>
        currentList.map(student =>
          student.id === studentId ? { ...student, status: 'submitted' } : student
        )
      );

    } catch (error: any) {
      console.error('Error al marcar asistencia:', error.message);
      // Si falla, lo regresamos a 'pending' para que pueda reintentar
      setStudentList(currentList =>
        currentList.map(student =>
          student.id === studentId ? { ...student, status: 'pending' } : student
        )
      );
      alert(`Error al guardar: ${error.message}`); // (Mejoraremos esto después)
    }
  };


  // 7. RENDER (Lo que se ve)
  if (loading) return <p className="text-center text-slate-400">Cargando estudiantes...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>
  if (studentList.length === 0) {
    return (
      <p className="text-center text-slate-500">
        No hay estudiantes registrados en este grupo.
      </p>
    )
  }

  // ¡Render si SÍ hay estudiantes!
  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <ul className="divide-y divide-slate-100">

        {/* ¡NUEVO MAPA! */}
        {studentList.map((student) => (

          <li key={student.id} className="flex flex-col items-center justify-between py-4 sm:flex-row gap-4">

            {/* Nombre del estudiante */}
            <span className="font-bold text-slate-800">{student.full_name}</span>

            {/* --- Lógica de botones --- */}
            <div className="flex w-full shrink-0 space-x-2 sm:w-auto">

              {/* VISTA 1: Botones (Estado 'pending') */}
              {student.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'presente')}
                    className="flex-1 rounded-xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-100 transition-colors border border-green-200"
                  >
                    Presente
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'tarde')}
                    className="flex-1 rounded-xl bg-yellow-50 px-4 py-2 text-sm font-bold text-yellow-700 hover:bg-yellow-100 transition-colors border border-yellow-200"
                  >
                    Tarde
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'falta')}
                    className="flex-1 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors border border-red-200"
                  >
                    Falta
                  </button>
                </>
              )}

              {/* VISTA 2: Cargando (Estado 'submitting') */}
              {student.status === 'submitting' && (
                <p className="w-full text-center text-sm italic text-slate-400">Guardando...</p>
              )}

              {/* VISTA 3: Guardado (Estado 'submitted') */}
              {student.status === 'submitted' && (
                <div className="w-full flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 rounded-xl border border-green-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-bold">Guardado</span>
                </div>
              )}

            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}