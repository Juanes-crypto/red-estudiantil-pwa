import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// Tipos
interface Teacher {
  id: string;
  full_name: string | null;
  email?: string; // Opcional, si logramos traerlo
}

interface Group {
  id: string;
  name: string;
}

// Tipo para la tabla puente
interface Assignment {
  docente_id: string;
  grupo_id: string;
}

export default function AdminTeacherManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([]) // "Memoria" de qué profe tiene qué grupo
  const [loading, setLoading] = useState(true)
  
  // Estado para saber qué profe estamos editando (expandido)
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 1. Traer Profesores (de mi colegio)
        // (Usamos la política pública de 'profiles' filtrando por rol)
        // NOTA: Necesitamos filtrar por colegio_id MANUALMENTE en la query
        // porque la política de profiles deja ver TODO.
        const { data: { user } } = await supabase.auth.getUser()
        
        // Primero averiguamos mi colegio (truco rápido)
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('colegio_id')
          .eq('id', user?.id)
          .single()
            
        const myColegioId = myProfile?.colegio_id

        // Ahora sí, traemos los docentes de MI colegio
        const { data: teachersData, error: tError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'docente')
          .eq('colegio_id', myColegioId) // Filtro manual importante
          .order('full_name', { ascending: true })
        
        if (tError) throw tError

        // 2. Traer Grupos (El RLS ya filtra por colegio)
        const { data: groupsData, error: gError } = await supabase
          .from('grupos')
          .select('id, name')
          .order('name', { ascending: true })

        if (gError) throw gError

        // 3. Traer Asignaciones Actuales (El RLS del Paso 82 funciona aquí)
        const { data: assignData, error: aError } = await supabase
          .from('docentes_grupos')
          .select('docente_id, grupo_id')

        if (aError) throw aError

        setTeachers(teachersData || [])
        setGroups(groupsData || [])
        setAssignments(assignData || [])

      } catch (error: any) {
        console.error('Error cargando datos:', error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Función: Toggle (Poner/Quitar) Grupo
  const handleToggleGroup = async (teacherId: string, groupId: string) => {
    // 1. Verificamos si ya lo tiene
    const exists = assignments.find(
      a => a.docente_id === teacherId && a.grupo_id === groupId
    )

    try {
      if (exists) {
        // --- BORRAR (Desmarcar) ---
        const { error } = await supabase
          .from('docentes_grupos')
          .delete()
          .eq('docente_id', teacherId)
          .eq('grupo_id', groupId)
        
        if (error) throw error

        // Actualizar estado local (quitar de la lista)
        setAssignments(prev => prev.filter(
          a => !(a.docente_id === teacherId && a.grupo_id === groupId)
        ))

      } else {
        // --- INSERTAR (Marcar) ---
        const { error } = await supabase
          .from('docentes_grupos')
          .insert({ docente_id: teacherId, grupo_id: groupId })

        if (error) throw error

        // Actualizar estado local (añadir a la lista)
        setAssignments(prev => [...prev, { docente_id: teacherId, grupo_id: groupId }])
      }
    } catch (error: any) {
      alert('Error al actualizar carga: ' + error.message)
    }
  }

  // Helper para saber si un checkbox debe estar marcado
  const isAssigned = (teacherId: string, groupId: string) => {
    return assignments.some(a => a.docente_id === teacherId && a.grupo_id === groupId)
  }

  if (loading) return <p className="text-center text-zinc-400">Cargando docentes...</p>

  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-semibold text-white">Asignar Carga Académica</h3>
      
      <div className="space-y-2">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="rounded-lg border border-zinc-600 bg-zinc-700 overflow-hidden">
            
            {/* CABECERA DEL PROFE (Click para expandir) */}
            <button
              onClick={() => setExpandedTeacherId(expandedTeacherId === teacher.id ? null : teacher.id)}
              className="flex w-full items-center justify-between bg-zinc-600 px-4 py-3 text-left hover:bg-zinc-500 transition-colors"
            >
              <span className="font-medium text-white">{teacher.full_name || 'Docente Sin Nombre'}</span>
              <span className="text-xs text-zinc-300">
                {/* Contador de grupos asignados */}
                {assignments.filter(a => a.docente_id === teacher.id).length} grupos asignados ▼
              </span>
            </button>

            {/* CUERPO EXPANDIBLE (Los Checkboxes) */}
            {expandedTeacherId === teacher.id && (
              <div className="p-4 bg-zinc-800 border-t border-zinc-600">
                <p className="mb-3 text-sm text-zinc-400">Selecciona los grupos para este docente:</p>
                
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {groups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-indigo-600 focus:ring-indigo-500"
                        checked={isAssigned(teacher.id, group.id)}
                        onChange={() => handleToggleGroup(teacher.id, group.id)}
                      />
                      <span className={`text-sm ${isAssigned(teacher.id, group.id) ? 'text-white font-medium' : 'text-zinc-400'}`}>
                        {group.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}

        {teachers.length === 0 && (
          <p className="text-center text-zinc-500 py-4">
            No hay docentes registrados con el rol 'docente' en tu colegio.
          </p>
        )}
      </div>
    </div>
  )
}