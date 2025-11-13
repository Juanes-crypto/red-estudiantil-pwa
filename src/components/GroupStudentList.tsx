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
  if (loading) return <p className="text-center text-zinc-400">Cargando estudiantes...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>
  if (studentList.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        No hay estudiantes registrados en este grupo.
      </p>
    )
  }

  // ¡Render si SÍ hay estudiantes!
  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <ul className="divide-y divide-zinc-600">
        
        {/* ¡NUEVO MAPA! */}
        {studentList.map((student) => (
          
          <li key={student.id} className="flex flex-col items-center justify-between py-3 sm:flex-row">
            
            {/* Nombre del estudiante */}
            <span className="mb-2 font-semibold text-white sm:mb-0">{student.full_name}</span>
            
            {/* --- Lógica de botones --- */}
            <div className="flex w-full shrink-0 space-x-2 sm:w-auto">
              
              {/* VISTA 1: Botones (Estado 'pending') */}
              {student.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'presente')}
                    className="w-1/3 flex-1 rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                  >
                    Presente
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'tarde')}
                    className="w-1/3 flex-1 rounded-md bg-yellow-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-yellow-700"
                  >
                    Tarde
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'falta')}
                    className="w-1/3 flex-1 rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                  >
                    Falta
                  </button>
                </>
              )}

              {/* VISTA 2: Cargando (Estado 'submitting') */}
              {student.status === 'submitting' && (
                <p className="w-full text-center text-sm italic text-zinc-400">Guardando...</p>
              )}

              {/* VISTA 3: Guardado (Estado 'submitted') */}
              {student.status === 'submitted' && (
                <p className="w-full text-center text-sm font-semibold text-green-400">¡Guardado! ✓</p>
              )}

            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}