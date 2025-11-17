import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
// Importamos el tipo 'User' de Supabase
import { User } from '@supabase/supabase-js'
import RegisterChildForm from '../components/RegisterChildForm'
import StudentList from '../components/StudentList'
import TeacherGroupsList from '../components/TeacherGroupsList'
import GroupStudentList from '../components/GroupStudentList'
// --- ¡NUEVO AQUÍ! ---
// Importamos la lista de asistencias del hijo
import ChildAttendanceList from '../components/ChildAttendanceList'
// --- FIN DE LO NUEVO ---

// Interfaz para definir cómo se ve nuestro "perfil"
interface Profile {
  full_name: string | null;
  role: string;
}

export default function Dashboard() {
  // Estados para guardar la info del usuario
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [listKey, setListKey] = useState(0)

  // --- ¡ACTUALIZADO! ---
  // 'menu', 'register', 'list', o 'attendance'
  const [parentView, setParentView] = useState<'menu' | 'register' | 'list' | 'attendance'>('menu')
  // --- FIN DE LA ACTUALIZACIÓN ---

  // 'menu' (default) o 'attendance'
  const [teacherView, setTeacherView] = useState<'menu' | 'attendance'>('menu')
  const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string } | null>(null)
  
  // Se ejecuta cuando el componente carga
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error al cargar el perfil:', error.message)
        } else {
          setProfile(profileData)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Para el formulario de Padre
  const handleChildRegistered = () => {
    setListKey(prevKey => prevKey + 1)
    setParentView('list')
  }

  // Para la lista de Grupos del Docente
  const handleGroupSelect = (groupId: string, groupName: string) => {
    setSelectedGroup({ id: groupId, name: groupName });
    setTeacherView('attendance'); // ¡Cambiamos a la vista de "Asistencia"!
  }

  // -- Función de Cerrar Sesión --
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // -- RENDER (Lo que se ve) --

  // Si está cargando...
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-900 text-white">
        <h1 className="text-3xl font-bold text-cyan-400">Cargando...</h1>
      </div>
    )
  }

  // Si terminó de cargar...
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-zinc-900 p-8 text-white">
      
      {/* --- CABECERA (Se ve siempre) --- */}
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-green-400">
          ¡Estás Dentro!
        </h1>
        <p className="mb-4 text-center text-zinc-400">{user?.email}</p>
        {profile && (
          <p className="mb-8 rounded-full bg-cyan-800 px-4 py-1 text-center text-lg font-medium text-cyan-300">
            Tu rol es: {profile.role}
          </p>
        )}
      </div>

      {/* --- INICIO DE LÓGICA DE ROL PADRE --- */}
      {profile && profile.role === 'padre' && user && (
        <div className="mt-4 w-full max-w-md">
          
          {/* --- VISTA 1: EL MENÚ (Default) --- */}
          {parentView === 'menu' && (
            <div className="space-y-4">
              <h2 className="mb-4 text-center text-xl font-semibold text-white">
                ¿Qué quieres hacer?
              </h2>
              <button
                onClick={() => setParentView('register')}
                className="w-full rounded-lg bg-cyan-600 px-5 py-3 text-center font-medium text-white hover:bg-cyan-700"
              >
                Registrar Nuevo Hijo
              </button>
              <button
                onClick={() => setParentView('list')}
                className="w-full rounded-lg bg-zinc-700 px-5 py-3 text-center font-medium text-white hover:bg-zinc-600"
              >
                Ver Mis Hijos Registrados
              </button>
              
              {/* --- ¡NUEVO BOTÓN AQUÍ! --- */}
              <button
                onClick={() => setParentView('attendance')}
                className="w-full rounded-lg bg-zinc-700 px-5 py-3 text-center font-medium text-white hover:bg-zinc-600"
              >
                Ver Asistencias de Mis Hijos
              </button>
              {/* --- FIN DE LO NUEVO --- */}

            </div>
          )}

          {/* --- VISTA 2: REGISTRAR HIJO --- */}
          {parentView === 'register' && (
            // ... (Tu código de 'register' - sin cambios)
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">
                Registrar Nuevo Hijo
              </h2>
              <RegisterChildForm 
                parentId={user.id}
                onChildRegistered={handleChildRegistered} 
              />
              <button
                onClick={() => setParentView('menu')}
                className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline"
              >
                Volver al menú
              </button>
            </div>
          )}

          {/* --- VISTA 3: VER LISTA DE HIJOS --- */}
          {parentView === 'list' && (
            // ... (Tu código de 'list' - sin cambios)
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">
                Mis Hijos Registrados
              </h2>
              <StudentList key={listKey} parentId={user.id} />
              <button
                onClick={() => setParentView('menu')}
                className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline"
              >
                Volver al menú
              </button>
            </div>
          )}
          
          {/* --- ¡NUEVA VISTA AQUÍ! --- */}
          {/* --- VISTA 4: VER ASISTENCIAS --- */}
          {parentView === 'attendance' && (
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">
                Historial de Asistencia
              </h2>
              {/* ¡Aquí usamos el nuevo componente! */}
              <ChildAttendanceList parentId={user.id} />
              <button
                onClick={() => setParentView('menu')}
                className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline"
              >
                Volver al menú
              </button>
            </div>
          )}
          {/* --- FIN DE LO NUEVO --- */}
          
        </div>
      )}
      {/* --- FIN DE LÓGICA DE ROL PADRE --- */}


      {/* --- INICIO DE LÓGICA DE ROL DOCENTE --- */}
      {profile && profile.role === 'docente' && (
        // ... (Tu código de 'docente' - sin cambios)
        <div className="mt-8 w-full max-w-md space-y-6">
          {teacherView === 'menu' && (
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">
                Mis Grupos Asignados
              </h2>
              <TeacherGroupsList onSelectGroup={handleGroupSelect} />
            </div>
          )}
          {teacherView === 'attendance' && (
            <div>
              <h2 className="mb-2 text-center text-xl font-semibold text-white">
                Tomar Asistencia
              </h2>
              <p className="mb-6 text-center text-lg text-cyan-400">
                {selectedGroup?.name}
              </p>
              {selectedGroup && (
                <GroupStudentList groupId={selectedGroup.id} />
              )}
              <button
                onClick={() => setTeacherView('menu')}
                className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline"
              >
                Volver a mis grupos
              </button>
            </div>
          )}
        </div>
      )}
      {/* --- FIN DE LÓGICA DE ROL DOCENTE --- */}


      {/* Botón de Cerrar Sesión (¡Siempre al final!) */}
      <button
        onClick={handleSignOut}
        className="mt-12 rounded-lg bg-red-600 px-5 py-2.5 text-center font-medium text-white hover:bg-red-700"
      >
        Cerrar Sesión
      </button>
    </div>
  )
}