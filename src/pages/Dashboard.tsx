import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
// Importamos el tipo 'User' de Supabase
import { User } from '@supabase/supabase-js'
import RegisterChildForm from '../components/RegisterChildForm'
import StudentList from '../components/StudentList'
import TeacherGroupsList from '../components/TeacherGroupsList'

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

  // --- ¡NUEVO ESTADO PARA LAS VISTAS! ---
  // 'menu' (default), 'register', o 'list'
  const [parentView, setParentView] = useState<'menu' | 'register' | 'list'>('menu')

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

  // ¡ACTUALIZADO! Ahora hace dos cosas:
  const handleChildRegistered = () => {
    // 1. Incrementamos la llave para refrescar la lista
    setListKey(prevKey => prevKey + 1)
    // 2. ¡Redirigimos a la vista de la lista!
    setParentView('list')
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
    // Ajustamos el padding para que el contenido no esté pegado arriba
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

      {/* --- INICIO DE LÓGICA DE ROL (¡AQUÍ ESTÁ LA MAGIA!) --- */}

      {/* Si el rol es 'padre' */}
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
              {/* (Aquí pondremos "Ver Asistencias" en el futuro) */}
            </div>
          )}

          {/* --- VISTA 2: REGISTRAR HIJO --- */}
          {parentView === 'register' && (
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
          
        </div>
      )}

      {/* (Aquí podríamos poner un 'else if (profile.role === 'docente')' en el futuro) */}
      {/* --- FIN DE LÓGICA DE ROL --- */}

      {/* --- INICIO DE LÓGICA DE ROL DOCENTE --- */}
  {profile && profile.role === 'docente' && (
    <div className="mt-8 w-full max-w-md space-y-6">
      <h2 className="mb-4 text-center text-xl font-semibold text-white">
        Panel de Docente
      </h2>

      {/* ¡Aquí usamos el nuevo componente! */}
      <TeacherGroupsList />

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