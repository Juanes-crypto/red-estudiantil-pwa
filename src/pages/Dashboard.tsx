import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import RegisterChildForm from '../components/RegisterChildForm'
import StudentList from '../components/StudentList'
import TeacherGroupsList from '../components/TeacherGroupsList'
import GroupStudentList from '../components/GroupStudentList'
import ChildAttendanceList from '../components/ChildAttendanceList'
import AdminStudentManager from '../components/AdminStudentManager'
import AdminTeacherManager from '../components/AdminTeacherManager'
import AdminGroupManager from '../components/AdminGroupManager'

// Interfaz del Perfil
interface Profile {
  full_name: string | null;
  role: string;
  colegio_id: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [listKey, setListKey] = useState(0)

  // --- ESTADOS DE VISTAS ---
  const [parentView, setParentView] = useState<'menu' | 'register' | 'list' | 'attendance'>('menu')
  const [teacherView, setTeacherView] = useState<'menu' | 'attendance'>('menu')
  const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string } | null>(null)
  
  const [adminView, setAdminView] = useState<'menu' | 'students' | 'teachers' | 'groups'>('menu')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('full_name, role, colegio_id') 
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

  const handleChildRegistered = () => {
    setListKey(prevKey => prevKey + 1)
    setParentView('list')
  }

  const handleGroupSelect = (groupId: string, groupName: string) => {
    setSelectedGroup({ id: groupId, name: groupName });
    setTeacherView('attendance');
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-900 text-white">
        <h1 className="text-3xl font-bold text-cyan-400">Cargando...</h1>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-zinc-900 p-8 text-white">
      
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
          {parentView === 'menu' && (
            <div className="space-y-4">
              <h2 className="mb-4 text-center text-xl font-semibold text-white">¿Qué quieres hacer?</h2>
              <button onClick={() => setParentView('register')} className="w-full rounded-lg bg-cyan-600 px-5 py-3 text-center font-medium text-white hover:bg-cyan-700">Registrar Nuevo Hijo</button>
              <button onClick={() => setParentView('list')} className="w-full rounded-lg bg-zinc-700 px-5 py-3 text-center font-medium text-white hover:bg-zinc-600">Ver Mis Hijos Registrados</button>
              <button onClick={() => setParentView('attendance')} className="w-full rounded-lg bg-zinc-700 px-5 py-3 text-center font-medium text-white hover:bg-zinc-600">Ver Asistencias de Mis Hijos</button>
            </div>
          )}
          {parentView === 'register' && (
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">Registrar Nuevo Hijo</h2>
              <RegisterChildForm parentId={user.id} colegioId={profile.colegio_id} onChildRegistered={handleChildRegistered} />
              <button onClick={() => setParentView('menu')} className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline">Volver al menú</button>
            </div>
          )}
          {parentView === 'list' && (
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">Mis Hijos Registrados</h2>
              <StudentList key={listKey} parentId={user.id} />
              <button onClick={() => setParentView('menu')} className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline">Volver al menú</button>
            </div>
          )}
          {parentView === 'attendance' && (
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">Historial de Asistencia</h2>
              <ChildAttendanceList parentId={user.id} />
              <button onClick={() => setParentView('menu')} className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline">Volver al menú</button>
            </div>
          )}
        </div>
      )}


      {/* --- INICIO DE LÓGICA DE ROL DOCENTE --- */}
      {profile && profile.role === 'docente' && (
        <div className="mt-8 w-full max-w-md space-y-6">
           {teacherView === 'menu' && (
            <div>
              <h2 className="mb-4 text-center text-xl font-semibold text-white">Mis Grupos Asignados</h2>
              <TeacherGroupsList onSelectGroup={handleGroupSelect} />
            </div>
          )}
          {teacherView === 'attendance' && (
            <div>
              <h2 className="mb-2 text-center text-xl font-semibold text-white">Tomar Asistencia</h2>
              <p className="mb-6 text-center text-lg text-cyan-400">{selectedGroup?.name}</p>
              {selectedGroup && <GroupStudentList groupId={selectedGroup.id} />}
              <button onClick={() => setTeacherView('menu')} className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline">Volver a mis grupos</button>
            </div>
          )}
        </div>
      )}


      {/* --- INICIO DE LÓGICA DE ROL ADMIN --- */}
      {profile && profile.role === 'admin' && (
        <div className="mt-8 w-full max-w-md space-y-6">
          
          {/* MENÚ PRINCIPAL DE ADMIN */}
          {adminView === 'menu' && (
            <div className="space-y-4">
              <h2 className="mb-4 text-center text-xl font-semibold text-white">
                Panel de Administración
              </h2>
              
              <button
                onClick={() => setAdminView('students')}
                className="flex w-full items-center justify-between rounded-lg bg-indigo-600 px-5 py-4 text-left font-medium text-white hover:bg-indigo-700"
              >
                <span>🎓 Gestionar Estudiantes</span>
                <span className="text-indigo-200">→</span>
              </button>

              <button
                onClick={() => setAdminView('teachers')}
                className="flex w-full items-center justify-between rounded-lg bg-purple-600 px-5 py-4 text-left font-medium text-white hover:bg-purple-700"
              >
                <span>👨‍🏫 Gestionar Docentes</span>
                <span className="text-purple-200">→</span>
              </button>

              <button
                onClick={() => setAdminView('groups')}
                className="flex w-full items-center justify-between rounded-lg bg-pink-600 px-5 py-4 text-left font-medium text-white hover:bg-pink-700"
              >
                <span>🏫 Gestionar Grupos</span>
                <span className="text-pink-200">→</span>
              </button>
            </div>
          )}

          {/* VISTA 1: ESTUDIANTES (¡CONECTADA!) */}
          {adminView === 'students' && (
            <div className="text-center">
              <h2 className="mb-4 text-xl font-semibold text-white">Gestión de Estudiantes</h2>
              
              {/* --- ¡AQUÍ ESTÁ LA MAGIA! --- */}
              <AdminStudentManager />
              {/* --- FIN DE LA MAGIA --- */}
              
              <button onClick={() => setAdminView('menu')} className="mt-6 text-sm text-zinc-400 hover:text-white hover:underline">Volver al menú</button>
            </div>
          )}

          {/* PLACEHOLDER 2: DOCENTES */}
          {adminView === 'teachers' && (
            <div className="text-center">
              <h2 className="mb-4 text-xl font-semibold text-white">Gestión de Docentes</h2>
              <AdminTeacherManager />
              <button onClick={() => setAdminView('menu')} className="mt-6 text-sm text-zinc-400 hover:text-white hover:underline">Volver al menú</button>
            </div>
          )}

          {/* PLACEHOLDER 3: GRUPOS */}
          {adminView === 'groups' && (
            <div className="text-center">
              <h2 className="mb-4 text-xl font-semibold text-white">Gestión de Grupos</h2>
              <AdminGroupManager/>
              <button onClick={() => setAdminView('menu')} className="mt-6 text-sm text-zinc-400 hover:text-white hover:underline">Volver al menú</button>
            </div>
          )}

        </div>
      )}
      {/* --- FIN DE LÓGICA DE ROL ADMIN --- */}

      <button
        onClick={handleSignOut}
        className="mt-12 rounded-lg bg-red-600 px-5 py-2.5 text-center font-medium text-white hover:bg-red-700"
      >
        Cerrar Sesión
      </button>
    </div>
  )
}