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

        const validData = (data || []).filter(d => d.students) as unknown as AttendanceRecord[]
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
      case 'presente': return 'bg-green-100 text-green-700 border-green-200'
      case 'tarde': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'falta': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // (Tus 'loading', 'error' y 'length === 0' están perfectos)
  if (loading) return <p className="text-center text-slate-400">Cargando asistencias...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>
  if (attendance.length === 0) {
    return (
      <p className="text-center text-slate-500">
        No hay registros de asistencia para tus hijos.
      </p>
    )
  }

  // ¡Render si SÍ hay registros!
  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <ul className="divide-y divide-slate-100">
        {attendance.map((record) => (
          <li key={record.id} className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {record.students?.full_name}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {formatDate(record.created_at)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Registrado por: {record.teacher_id?.full_name || 'N/A'}
                </p>
              </div>
              <span
                className={`rounded-xl px-4 py-2 text-sm font-bold border ${getStatusColor(record.status)}`}
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