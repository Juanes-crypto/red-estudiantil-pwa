import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// Tipos de datos
interface Student {
  id: string;
  full_name: string;
  grupo_id: string | null; // Puede ser nulo si es nuevo
}

interface Group {
  id: string;
  name: string;
}

export default function AdminStudentManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null) // ID del estudiante que se está actualizando

  // Cargar datos al inicio
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 1. Obtener Grupos (de mi colegio)
        // Gracias al RLS del Paso 68, esto ya filtra por colegio automático
        const { data: groupsData, error: groupsError } = await supabase
          .from('grupos')
          .select('id, name')
          .order('name', { ascending: true })
        
        if (groupsError) throw groupsError

        // 2. Obtener Estudiantes (de mi colegio)
        // Gracias al RLS del Paso 79, el Admin ve a todos
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, full_name, grupo_id')
          .order('full_name', { ascending: true })

        if (studentsError) throw studentsError

        setGroups(groupsData || [])
        setStudents(studentsData || [])

      } catch (error: any) {
        console.error('Error cargando datos:', error.message)
        alert('Error cargando datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Función para cambiar el grupo
  const handleAssignGroup = async (studentId: string, newGroupId: string) => {
    try {
      setUpdating(studentId) // Mostramos spinner en este estudiante

      // Guardar en Supabase
      const { error } = await supabase
        .from('students')
        .update({ grupo_id: newGroupId })
        .eq('id', studentId)

      if (error) throw error

      // Actualizar estado local (para que se refleje en la UI sin recargar)
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, grupo_id: newGroupId } : s
      ))

    } catch (error: any) {
      console.error('Error asignando grupo:', error.message)
      alert('No se pudo asignar el grupo')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <p className="text-zinc-400 text-center">Cargando panel...</p>

  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-semibold text-white">Asignar Estudiantes a Grupos</h3>
      
      <div className="max-h-96 overflow-y-auto"> {/* Scroll si hay muchos */}
        <ul className="divide-y divide-zinc-600">
          {students.map((student) => (
            <li key={student.id} className="flex flex-col items-start justify-between gap-2 py-3 sm:flex-row sm:items-center">
              
              {/* Nombre */}
              <div className="flex-1">
                <p className="font-medium text-white">{student.full_name}</p>
                <p className="text-xs text-zinc-500">
                  {student.grupo_id ? 'Asignado' : '⚠️ Sin Grupo'}
                </p>
              </div>

              {/* Selector de Grupo */}
              <div className="relative w-full sm:w-48">
                {updating === student.id ? (
                  <p className="text-sm text-cyan-400 animate-pulse">Guardando...</p>
                ) : (
                  <select
                    value={student.grupo_id || ""}
                    onChange={(e) => handleAssignGroup(student.id, e.target.value)}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2 text-sm text-white focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Seleccionar Grupo</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

            </li>
          ))}
        </ul>
        
        {students.length === 0 && (
          <p className="text-center text-zinc-500 py-4">No hay estudiantes registrados aún.</p>
        )}
      </div>
    </div>
  )
}