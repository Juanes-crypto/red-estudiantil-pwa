// 1. Imports
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// 2. Definimos las "Props"
interface Props {
  parentId: string; // Necesita saber de QUIÉN buscar los hijos
}

// 3. Definimos el "tipo" de un estudiante (¡TypeScript nos ayuda!)
interface Student {
  id: string;
  full_name: string;
  document_number: string;
}

export default function StudentList({ parentId }: Props) {
  // 4. Estados
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 5. ¡El useEffect! Se ejecuta cuando el componente carga
  useEffect(() => {
    
    const fetchStudents = async () => {
      try {
        setLoading(true)
        
        // 6. ¡La Consulta!
        // Leemos la tabla 'students', solo el nombre y documento
        // Donde 'parent_id' sea igual al 'parentId' que nos pasaron
        // ¡Nuestras POLÍTICAS DE RLS (Paso 25) lo permiten!
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name, document_number')
          .eq('parent_id', parentId)

        if (error) throw error
        
        setStudents(data) // Guardamos la lista en el estado
        
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents() // ¡Llamamos a la función!
  }, [parentId]) // Se re-ejecuta si el parentId cambia

  // 7. RENDER (Lo que se ve)
  if (loading) return <p className="text-center text-zinc-400">Cargando hijos...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>

  // Render si no hay hijos
  if (students.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        Aún no has registrado ningún hijo.
      </p>
    )
  }

  // ¡Render si SÍ hay hijos!
  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <ul className="divide-y divide-zinc-600">
        {students.map((student) => (
          // ¡'key' es vital para que React identifique cada elemento!
          <li key={student.id} className="py-3">
            <h3 className="font-semibold text-white">{student.full_name}</h3>
            <p className="text-sm text-zinc-400">Doc: {student.document_number}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}