 import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import Logo from '../components/Logo';
import RegisterChildForm from '../components/RegisterChildForm';
import StudentList from '../components/StudentList';
import TeacherGroupsList from '../components/TeacherGroupsList';
import AdminStudentManager from '../components/AdminStudentManager';
import AdminTeacherManager from '../components/AdminTeacherManager';
import AdminGroupManager from '../components/AdminGroupManager';
import InstallPrompt from '../components/InstallPrompt';
import TeacherAttendanceView from '../components/TeacherAttendanceView';
import ParentAttendanceView from '../components/ParentAttendanceView';
import ICFESTraining from '../components/ICFESTraining';
import ICFESLeaderboard from '../components/ICFESLeaderboard';
import ICFESApiKeySetup from '../components/ICFESApiKeySetup';
import TeacherCommunicationPanel from '../components/TeacherCommunicationPanel';
import MedicalExcuseForm from '../components/MedicalExcuseForm';
import ParentNotificationsView from '../components/ParentNotificationsView';
import StudentBoard from '../components/StudentBoard';

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

  const [parentView, setParentView] = useState<'menu' | 'register' | 'list' | 'attendance' | 'excuse' | 'notifications'>('menu');
  const [teacherView, setTeacherView] = useState<'menu' | 'attendance' | 'communication'>('menu');
  const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string } | null>(null);
  const [adminView, setAdminView] = useState<'menu' | 'students' | 'teachers' | 'groups'>('menu');

  // Estados para ICFES (estudiantes)
  const [studentView, setStudentView] = useState<'menu' | 'setup' | 'training' | 'leaderboard' | 'board'>('menu');
  const [studentData, setStudentData] = useState<{ id: string; name: string; apiKey: string | null } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Primero verificar si hay sesión de estudiante (custom auth)
      const { getCurrentSession } = await import('../lib/studentAuth');
      const studentSession = getCurrentSession();

      if (studentSession) {
        // Usuario estudiante con auth custom
        const { data: studentInfo, error: studentError } = await supabase
          .from('students')
          .select('id, full_name, gemini_api_key, colegio_id')
          .eq('id', studentSession.studentId)
          .single();

        if (!studentError && studentInfo) {
          // Crear perfil "fake" para estudiante
          setProfile({
            full_name: studentInfo.full_name,
            role: 'estudiante',
            colegio_id: studentInfo.colegio_id
          });

          setStudentData({
            id: studentInfo.id,
            name: studentInfo.full_name,
            apiKey: studentInfo.gemini_api_key
          });

          // Si no tiene API key, mostrar setup
          if (!studentInfo.gemini_api_key) {
            setStudentView('setup');
          }
        }

        setLoading(false);
        return;
      }

      // Si no hay sesión de estudiante, verificar Supabase Auth (padres/profesores/admin)
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
    // Verificar si hay sesión de estudiante
    const { getCurrentSession, studentLogout } = await import('../lib/studentAuth');
    const studentSession = getCurrentSession();

    if (studentSession) {
      // Logout de estudiante
      studentLogout();
      window.location.reload();
      return;
    }

    // Logout de Supabase Auth (padres/profesores/admin)
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-brand-50 to-neutral-100">
        <div className="text-center animate-fade-in-up">
          <div className="mb-6">
            <Logo size="lg" className="mx-auto" />
          </div>
          <div className="inline-block w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-700 font-semibold text-sm uppercase tracking-wide">Cargando su sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-surface-50">
      {/* Header Mejorado con Glassmorphism */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-card">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-600"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y Marca */}
            <div className="flex items-center gap-4">
              <div className="bg-white/50 p-2 rounded-xl shadow-soft border border-white/50 backdrop-blur-sm">
                <Logo size="sm" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">Red Estudiantil</h1>
                <p className="text-xs text-brand-600 font-bold uppercase tracking-widest">Dashboard</p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-6">
              {profile && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-800">{user?.email || studentData?.name}</p>
                  <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${profile.role === 'estudiante'
                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                    : 'bg-brand-100 text-brand-800 border border-brand-200'
                    }`}>
                    {profile.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-white hover:bg-brand-600 rounded-lg border border-slate-200 hover:border-brand-600 transition-all duration-300 shadow-sm hover:shadow-brand"
              >
                SALIR
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Banner - Clean Red Theme */}
        <div className="relative rounded-3xl overflow-hidden shadow-card mb-12 bg-white border border-neutral-200">
          <div className="absolute inset-0 bg-brand-50"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>

          <div className="relative z-10 p-10 md:p-14">
            <h2 className="text-4xl md:text-5xl font-black font-display text-neutral-900 mb-4 tracking-tight">
              {profile?.role === 'padre' && 'Bienvenido, Padre de Familia'}
              {profile?.role === 'docente' && 'Bienvenido, Profesor'}
              {profile?.role === 'admin' && 'Panel de Administración'}
              {profile?.role === 'estudiante' && 'Bienvenido, Estudiante'}
            </h2>
            <p className="text-neutral-700 text-lg font-medium max-w-2xl leading-relaxed">
              {profile?.role === 'padre' && 'Gestiona la información de tus hijos y revisa su asistencia en tiempo real.'}
              {profile?.role === 'docente' && 'Gestiona tus grupos y toma asistencia de manera eficiente y moderna.'}
              {profile?.role === 'admin' && 'Administra estudiantes, profesores y grupos con control total.'}
              {profile?.role === 'estudiante' && 'Practica, compite y mejora tus habilidades académicas.'}
            </p>
          </div>
        </div>

        {/* PARENT VIEW */}
        {profile && profile.role === 'padre' && user && (
          <div className="w-full animate-fade-in-up">
            {parentView === 'menu' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <button
                  onClick={() => setParentView('register')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Registrar Hijo</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Añade un nuevo estudiante a tu núcleo familiar.</p>
                </button>

                <button
                  onClick={() => setParentView('list')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Mis Hijos</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Gestiona los perfiles de tus hijos registrados.</p>
                </button>

                <button
                  onClick={() => setParentView('attendance')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Asistencia</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Revisa el historial de asistencia detallado.</p>
                </button>

                <button
                  onClick={() => setParentView('excuse')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Enviar Excusa</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Reporta inasistencias médicas o calamidades.</p>
                </button>

                <button
                  onClick={() => setParentView('notifications')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Anuncios</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Revisa tareas, eventos y alertas del colegio.</p>
                </button>
              </div>
            )}

            {parentView === 'register' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-10">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-200">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Registrar Nuevo Hijo</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-50 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all"
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
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Mis Hijos Registrados</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <StudentList key={listKey} parentId={user.id} />
              </div>
            )}

            {parentView === 'attendance' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Historial de Asistencia</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <ParentAttendanceView parentId={user.id} />
              </div>
            )}

            {parentView === 'excuse' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Enviar Excusa Médica</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <MedicalExcuseForm
                  parentId={user.id}
                  onSuccess={() => {
                    alert('Excusa enviada correctamente');
                    setParentView('menu');
                  }}
                  onCancel={() => setParentView('menu')}
                />
              </div>
            )}

            {parentView === 'notifications' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Anuncios y Notificaciones</h3>
                  <button
                    onClick={() => setParentView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <ParentNotificationsView parentId={user.id} />
              </div>
            )}
          </div>
        )}

        {/* TEACHER VIEW */}
        {profile && profile.role === 'docente' && (
          <div className="w-full animate-fade-in-up">
            {teacherView === 'menu' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Panel Docente</h3>
                  <button
                    onClick={() => setTeacherView('communication')}
                    className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Centro de Comunicación
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-card">
                  <h4 className="text-xl font-bold text-neutral-800 mb-6">Mis Grupos Asignados</h4>
                  <TeacherGroupsList onSelectGroup={handleGroupSelect} />
                </div>
              </div>
            )}

            {teacherView === 'attendance' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                {selectedGroup && <TeacherAttendanceView groupId={selectedGroup.id} groupName={selectedGroup.name} />}
                <button
                  onClick={() => setTeacherView('menu')}
                  className="mt-8 px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                >
                  ← Volver a mis grupos
                </button>
              </div>
            )}

            {teacherView === 'communication' && user && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <button
                    onClick={() => setTeacherView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver al Dashboard
                  </button>
                </div>
                <TeacherCommunicationPanel teacherId={user.id} />
              </div>
            )}
          </div>
        )}

        {/* ADMIN VIEW */}
        {profile && profile.role === 'admin' && (
          <div className="w-full animate-fade-in-up">
            {adminView === 'menu' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <button
                  onClick={() => setAdminView('students')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Estudiantes</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Gestión integral de alumnos.</p>
                </button>

                <button
                  onClick={() => setAdminView('teachers')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Profesores</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Gestión del cuerpo docente.</p>
                </button>

                <button
                  onClick={() => setAdminView('groups')}
                  className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                    <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Grupos</h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed">Gestión de grupos y cursos.</p>
                </button>
              </div>
            )}

            {adminView === 'students' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Gestión de Estudiantes</h3>
                  <button
                    onClick={() => setAdminView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <AdminStudentManager />
              </div>
            )}

            {adminView === 'teachers' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Gestión de Profesores</h3>
                  <button
                    onClick={() => setAdminView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <AdminTeacherManager />
              </div>
            )}

            {adminView === 'groups' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Gestión de Grupos</h3>
                  <button
                    onClick={() => setAdminView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <AdminGroupManager />
              </div>
            )}
          </div>
        )}

        {/* STUDENT VIEW - ICFES MODULE */}
        {profile && profile.role === 'estudiante' && studentData && (
          <div className="w-full animate-fade-in-up">
            {/* Setup API Key */}
            {studentView === 'setup' && (
              <div className="bg-white shadow-card border border-neutral-200 rounded-3xl p-10 max-w-2xl mx-auto">
                <ICFESApiKeySetup
                  studentId={studentData.id}
                  studentName={studentData.name}
                  currentApiKey={studentData.apiKey}
                  onSave={(newApiKey) => {
                    setStudentData({ ...studentData, apiKey: newApiKey });
                    setStudentView('menu');
                  }}
                  isModal={false}
                />
              </div>
            )}

            {/* Main Menu */}
            {studentView === 'menu' && (
              <div className="space-y-8">
                <h3 className="text-3xl font-bold font-display text-neutral-900 tracking-tight">Panel del Estudiante</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <button
                    onClick={() => setStudentView('training')}
                    className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                    <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                      <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Entrenar ICFES</h3>
                    <p className="text-sm text-neutral-500 font-medium leading-relaxed">Practica con preguntas ICFES generadas por IA personalizada.</p>
                  </button>

                  <button
                    onClick={() => setStudentView('leaderboard')}
                    className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                    <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                      <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Ver Ranking</h3>
                    <p className="text-sm text-neutral-500 font-medium leading-relaxed">Compara tu desempeño con los mejores estudiantes.</p>
                  </button>

                  <button
                    onClick={() => setStudentView('board')}
                    className="group relative bg-white border border-neutral-200 p-8 rounded-2xl shadow-card hover:shadow-floating hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                    <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl group-hover:bg-brand-600 group-hover:text-white mb-6 transition-colors duration-300 shadow-sm">
                      <svg className="w-8 h-8 text-brand-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold font-display text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">Deberes</h3>
                    <p className="text-sm text-neutral-500 font-medium leading-relaxed">Revisa tus tareas y anuncios pendientes.</p>
                  </button>
                </div>

                <button
                  onClick={() => setStudentView('setup')}
                  className="w-full bg-white border border-neutral-200 p-6 rounded-xl hover:bg-neutral-50 transition-all text-left flex items-center gap-6 group"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-neutral-100 rounded-full group-hover:bg-neutral-200 transition-colors">
                    <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wide group-hover:text-neutral-900">Configuración de IA</h4>
                    <p className="text-xs text-neutral-500 font-medium mt-1">
                      {studentData.apiKey ? '✅ API Key activa' : '⚠️ Sin API Key configurada'}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Training View */}
            {studentView === 'training' && studentData.apiKey && (
              <div className="bg-white rounded-3xl p-8 shadow-card border border-neutral-200">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 uppercase tracking-tight">Entrenamiento ICFES</h3>
                  <button
                    onClick={() => setStudentView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <ICFESTraining
                  studentId={studentData.id}
                  studentName={studentData.name || ''}
                  apiKey={studentData.apiKey}
                  onConfigureApiKey={() => setStudentView('setup')}
                />
              </div>
            )}

            {/* Leaderboard View */}
            {studentView === 'leaderboard' && (
              <div className="bg-white rounded-3xl p-8 shadow-card border border-neutral-200">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 uppercase tracking-tight">Ranking ICFES</h3>
                  <button
                    onClick={() => setStudentView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <ICFESLeaderboard />
              </div>
            )}

            {/* Student Board View */}
            {studentView === 'board' && (
              <div className="bg-white rounded-3xl p-8 shadow-card border border-neutral-200">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold font-display text-neutral-900 uppercase tracking-tight">Mis Deberes</h3>
                  <button
                    onClick={() => setStudentView('menu')}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-brand-600 bg-neutral-50 hover:bg-brand-50 rounded-lg transition-all"
                  >
                    ← Volver
                  </button>
                </div>
                <StudentBoard studentId={studentData.id} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}