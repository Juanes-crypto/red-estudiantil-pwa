import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import RegisterChildForm from '../components/RegisterChildForm';
import StudentList from '../components/StudentList';
import TeacherGroupsList from '../components/TeacherGroupsList';
import AdminStudentManager from '../components/AdminStudentManager';
import AdminTeacherManager from '../components/AdminTeacherManager';
import AdminGroupManager from '../components/AdminGroupManager';
import InstallPrompt from '../components/InstallPrompt';
import TeacherAttendanceView from '../components/TeacherAttendanceView';
import ParentAttendanceView from '../components/ParentAttendanceView';

interface Profile {
  full_name: string | null;
  role: string;
  colegio_id: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [listKey, setListKey] = useState(0);

  const [parentView, setParentView] = useState<'menu' | 'register' | 'list' | 'attendance'>('menu');
  const [teacherView, setTeacherView] = useState<'menu' | 'attendance'>('menu');
  const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string } | null>(null);
  const [adminView, setAdminView] = useState<'menu' | 'students' | 'teachers' | 'groups'>('menu');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('full_name, role, colegio_id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error al cargar el perfil:', error.message);
        } else {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChildRegistered = () => {
    setListKey(prevKey => prevKey + 1);
    setParentView('list');
  };

  const handleGroupSelect = (groupId: string, groupName: string) => {
    setSelectedGroup({ id: groupId, name: groupName });
    setTeacherView('attendance');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                <span className="text-xl font-bold text-white">RE</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Red Estudiantil</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              {profile && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profile.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">
            {profile?.role === 'padre' && 'Bienvenido, Padre de Familia'}
            {profile?.role === 'docente' && 'Bienvenido, Profesor'}
            {profile?.role === 'admin' && 'Panel de Administración'}
          </h2>
          <p className="text-blue-100">
            {profile?.role === 'padre' && 'Gestiona la información de tus hijos y revisa su asistencia'}
            {profile?.role === 'docente' && 'Gestiona tus grupos y toma asistencia de manera eficiente'}
            {profile?.role === 'admin' && 'Administra estudiantes, profesores y grupos'}
          </p>
        </div>

        {/* PARENT VIEW */}
        {profile && profile.role === 'padre' && user && (
          <div className="w-full">
            {parentView === 'menu' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setParentView('register')}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 group-hover:bg-blue-600 transition">
                    <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrar Hijo</h3>
                  <p className="text-sm text-gray-500">Añade un nuevo hijo a tu cuenta</p>
                </button>

                <button
                  onClick={() => setParentView('list')}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-xl mb-4 group-hover:bg-cyan-600 transition">
                    <svg className="w-6 h-6 text-cyan-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mis Hijos</h3>
                  <p className="text-sm text-gray-500">Ver lista de hijos registrados</p>
                </button>

                <button
                  onClick={() => setParentView('attendance')}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4 group-hover:bg-green-600 transition">
                    <svg className="w-6 h-6 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Asistencia</h3>
                  <p className="text-sm text-gray-500">Revisar historial de asistencia</p>
                </button>
              </div>
            )}

            {parentView === 'register' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Registrar Nuevo Hijo</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <RegisterChildForm parentId={user.id} colegioId={profile.colegio_id} onChildRegistered={handleChildRegistered} />
              </div>
            )}

            {parentView === 'list' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Mis Hijos Registrados</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    Volver
                  </button>
                </div>
                <StudentList key={listKey} parentId={user.id} />
              </div>
            )}

            {parentView === 'attendance' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Historial de Asistencia</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    Volver
                  </button>
                </div>
                <ParentAttendanceView parentId={user.id} />
              </div>
            )}
          </div>
        )}

        {/* TEACHER VIEW */}
        {profile && profile.role === 'docente' && (
          <div className="w-full">
            {teacherView === 'menu' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Mis Grupos</h3>
                <TeacherGroupsList onSelectGroup={handleGroupSelect} />
              </div>
            )}

            {teacherView === 'attendance' && (
              <div>
                {selectedGroup && <TeacherAttendanceView groupId={selectedGroup.id} groupName={selectedGroup.name} />}
                <button
                  onClick={() => setTeacherView('menu')}
                  className="mt-6 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Volver a mis grupos
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADMIN VIEW */}
        {profile && profile.role === 'admin' && (
          <div className="w-full">
            {adminView === 'menu' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setAdminView('students')}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 group-hover:bg-blue-600 transition">
                    <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Estudiantes</h3>
                  <p className="text-sm text-gray-500">Gestionar estudiantes</p>
                </button>

                <button
                  onClick={() => setAdminView('teachers')}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-xl mb-4 group-hover:bg-cyan-600 transition">
                    <svg className="w-6 h-6 text-cyan-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Profesores</h3>
                  <p className="text-sm text-gray-500">Gestionar profesores</p>
                </button>

                <button
                  onClick={() => setAdminView('groups')}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4 group-hover:bg-purple-600 transition">
                    <svg className="w-6 h-6 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Grupos</h3>
                  <p className="text-sm text-gray-500">Gestionar grupos</p>
                </button>
              </div>
            )}

            {adminView === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Gestión de Estudiantes</h3>
                  <button
                    onClick={() => setAdminView('menu')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    Volver
                  </button>
                </div>
                <AdminStudentManager />
              </div>
            )}

            {adminView === 'teachers' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Gestión de Profesores</h3>
                  <button
                    onClick={() => setAdminView('menu')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    Volver
                  </button>
                </div>
                <AdminTeacherManager />
              </div>
            )}

            {adminView === 'groups' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Gestión de Grupos</h3>
                  <button
                    onClick={() => setAdminView('menu')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    Volver
                  </button>
                </div>
                <AdminGroupManager />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}