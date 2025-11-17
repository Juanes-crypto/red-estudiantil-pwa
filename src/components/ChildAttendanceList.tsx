// 1. Imports
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// 2. Definimos las "Props"
interface Props {
  parentId: string; // El ID del padre que está logueado
}

// 3. Definimos el "tipo" de un registro de asistencia (¡CORREGIDO!)
interface AttendanceRecord {
  id: string;
  created_at: string; // La fecha en que se tomó
  status: string;    // 'presente', 'tarde', 'falta'
  students: {        // ¡El estudiante (desde la otra tabla!)
    full_name: string;
  } | null;
  teacher_id: {        // ¡El docente (desde la otra tabla!)
    full_name: string | null;
  } | null;
}

export default function ChildAttendanceList({ parentId }: Props) {
  // 4. Estados
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 5. ¡El useEffect! Se ejecuta cuando el componente carga
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 6. ¡LA CONSULTA MÁGICA! (¡AHORA SÍ, LIMPIA!)
        const { data, error } = await supabase
          .from('asistencia')
          .select(`
            id,
            created_at,
            status,
            students ( full_name, parent_id ),
            teacher_id:profiles ( full_name )
          `)
          .eq('students.parent_id', parentId)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        const validData = data.filter(d => d.students) as AttendanceRecord[]
        setAttendance(validData)
        
      } catch (error: any) {
        // ¡Mejoramos el log de error!
        console.error("Error al cargar asistencias:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (parentId) {
      fetchAttendance() // ¡Llamamos a la función!
    }
  }, [parentId]) // Se re-ejecuta si el parentId cambia

  // 7. RENDER (Lo que se ve)
  
  // (Tus funciones 'formatDate' y 'getStatusColor' están perfectas)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'presente': return 'bg-green-600'
      case 'tarde': return 'bg-yellow-600'
      case 'falta': return 'bg-red-600'
      default: return 'bg-zinc-600'
    }
  }

  // (Tus 'loading', 'error' y 'length === 0' están perfectos)
  if (loading) return <p className="text-center text-zinc-400">Cargando asistencias...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>
  if (attendance.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        No hay registros de asistencia para tus hijos.
      </p>
    )
  }

  // ¡Render si SÍ hay registros!
  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <ul className="divide-y divide-zinc-600">
        {attendance.map((record) => (
          <li key={record.id} className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {record.students?.full_name}
                </h3>
                <p className="text-sm text-zinc-400">
                  {formatDate(record.created_at)}
                </p>
                <p className="text-sm text-zinc-500">
                  Registrado por: {record.teacher_id?.full_name || 'N/A'}
                </p>
              </div>
              <span 
                className={`rounded-full px-3 py-1 text-sm font-medium text-white ${getStatusColor(record.status)}`}
              >
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}