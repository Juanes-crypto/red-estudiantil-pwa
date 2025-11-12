// 1. Imports
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// 2. Definimos el "tipo" de un Grupo (¡TypeScript!)
interface Group {
  id: string;
  name: string;
}

// 3. Props: ¡Este componente no necesita props!
// ¿Por qué? Porque puede usar auth.uid() para buscar
// los grupos del docente que está logueado. ¡Es autónomo!

export default function TeacherGroupsList() {
  // 4. Estados
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 5. ¡El useEffect! Se ejecuta cuando el componente carga
  useEffect(() => {
    
    const fetchGroups = async () => {
      try {
        setLoading(true)
        
        // 6. ¡LA CONSULTA MÁGICA!
        // Esta es una consulta avanzada que "salta" entre tablas
        
        // Desde la tabla 'grupos'...
        const { data, error } = await supabase
          .from('grupos')
          // ...queremos el id y el nombre...
          .select(`
            id,
            name,
            docentes_grupos!inner ( docente_id )
          `)
          // ...¡PERO! solo queremos los grupos donde
          // 'docentes_grupos.docente_id' sea igual
          // al usuario que está logueado (auth.uid())
          .eq('docentes_grupos.docente_id', (await supabase.auth.getUser()).data.user?.id)

        if (error) throw error
        
        setGroups(data || []) // Guardamos la lista en el estado
        
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups() // ¡Llamamos a la función!
  }, []) // El '[]' vacío significa "solo al inicio"

  // 7. RENDER (Lo que se ve)
  if (loading) return <p className="text-center text-zinc-400">Cargando grupos...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>
  if (groups.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        Aún no tienes grupos asignados.
      </p>
    )
  }

  // ¡Render si SÍ hay grupos!
  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <ul className="divide-y divide-zinc-600">
        {groups.map((group) => (
          <li key={group.id} className="py-3">
            <h3 className="font-semibold text-white">Grupo: {group.name}</h3>
            {/* Aquí pondremos un botón/link para "Tomar Asistencia" */}
          </li>
        ))}
      </ul>
    </div>
  )
}