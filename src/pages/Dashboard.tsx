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

// Componente auxiliar para las tarjetas del menú
const MenuCard = ({
  icon,
  title,
  description,
  onClick
}: {
  icon: React.ReactNode,
  title: string,
  description: string,
  onClick: () => void
}) => (
  <button onClick={onClick} className="menu-card group w-full text-left">
    <div className="menu-card-icon">
      {icon}
    </div>
    <div className="menu-card-content">
      <h3 className="menu-card-title">{title}</h3>
      <p className="menu-card-desc">{description}</p>
    </div>
    <div className="menu-card-arrow">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

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
      <div className="flex h-screen w-screen items-center justify-center bg-blue-50">
        <div className="text-center animate-enter">
          <div className="mb-6">
            <Logo size="lg" className="mx-auto" />
          </div>
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-blue-800 font-bold text-sm uppercase tracking-wide">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pb-12">
      {/* Header Blue Theme */}
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <Logo size="sm" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Red Estudiantil</h1>
                <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">
                  {profile?.role === 'padre' && 'Portal Familias'}
                  {profile?.role === 'docente' && 'Portal Docente'}
                  {profile?.role === 'admin' && 'Administración'}
                  {profile?.role === 'estudiante' && 'Portal Estudiante'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* Welcome Section */}
        <div className="mb-8 animate-enter">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Hola, {profile?.full_name?.split(' ')[0]}
          </h2>
          <p className="text-slate-500">¿Qué deseas hacer hoy?</p>
        </div>

        {/* PARENT VIEW */}
        {profile && profile.role === 'padre' && user && (
          <div className="w-full animate-enter">
            {parentView === 'menu' && (
              <div className="flex flex-col gap-4">
                <MenuCard
                  title="Mis Hijos"
                  description="Ver perfiles y códigos QR"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                  onClick={() => setParentView('list')}
                />

                <MenuCard
                  title="Asistencia"
                  description="Revisar historial de entradas y salidas"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                  onClick={() => setParentView('attendance')}
                />

                <MenuCard
                  title="Anuncios"
                  description="Notificaciones y comunicados"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                  onClick={() => setParentView('notifications')}
                />

                <MenuCard
                  title="Enviar Excusa"
                  description="Reportar inasistencia médica"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  onClick={() => setParentView('excuse')}
                />

                <MenuCard
                  title="Registrar Hijo"
                  description="Añadir nuevo estudiante"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                  onClick={() => setParentView('register')}
                />
              </div>
            )}

            {/* Sub-vistas Padre */}
            {parentView !== 'menu' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <button
                    onClick={() => setParentView('menu')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="font-bold text-slate-800">
                    {parentView === 'list' && 'Mis Hijos'}
                    {parentView === 'attendance' && 'Asistencia'}
                    {parentView === 'notifications' && 'Anuncios'}
                    {parentView === 'excuse' && 'Enviar Excusa'}
                    {parentView === 'register' && 'Registrar Nuevo Hijo'}
                  </h3>
                </div>

                <div className="p-6">
                  {parentView === 'register' && (
                    <RegisterChildForm parentId={user.id} colegioId={profile.colegio_id} onChildRegistered={handleChildRegistered} />
                  )}
                  {parentView === 'list' && (
                    <StudentList key={listKey} parentId={user.id} />
                  )}
                  {parentView === 'attendance' && (
                    <ParentAttendanceView parentId={user.id} />
                  )}
                  {parentView === 'excuse' && (
                    <MedicalExcuseForm
                      parentId={user.id}
                      onSuccess={() => {
                        alert('Excusa enviada correctamente');
                        setParentView('menu');
                      }}
                      onCancel={() => setParentView('menu')}
                    />
                  )}
                  {parentView === 'notifications' && (
                    <ParentNotificationsView parentId={user.id} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEACHER VIEW */}
        {profile && profile.role === 'docente' && (
          <div className="w-full animate-enter">
            {teacherView === 'menu' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Mis Grupos</h3>
                  <TeacherGroupsList onSelectGroup={handleGroupSelect} />
                </div>

                <MenuCard
                  title="Comunicación"
                  description="Enviar mensajes a padres"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                  onClick={() => setTeacherView('communication')}
                />
              </div>
            )}

            {teacherView === 'attendance' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <button
                    onClick={() => setTeacherView('menu')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="font-bold text-slate-800">
                    Toma de Asistencia - {selectedGroup?.name}
                  </h3>
                </div>
                <div className="p-6">
                  {selectedGroup && <TeacherAttendanceView groupId={selectedGroup.id} groupName={selectedGroup.name} />}
                </div>
              </div>
            )}

            {teacherView === 'communication' && user && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <button
                    onClick={() => setTeacherView('menu')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="font-bold text-slate-800">Centro de Comunicación</h3>
                </div>
                <div className="p-6">
                  <TeacherCommunicationPanel teacherId={user.id} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN VIEW */}
        {profile && profile.role === 'admin' && (
          <div className="w-full animate-enter">
            {adminView === 'menu' && (
              <div className="flex flex-col gap-4">
                <MenuCard
                  title="Estudiantes"
                  description="Gestionar alumnos"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                  onClick={() => setAdminView('students')}
                />
                <MenuCard
                  title="Profesores"
                  description="Gestionar docentes"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  onClick={() => setAdminView('teachers')}
                />
                <MenuCard
                  title="Grupos"
                  description="Gestionar cursos"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                  onClick={() => setAdminView('groups')}
                />
              </div>
            )}

            {adminView !== 'menu' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <button
                    onClick={() => setAdminView('menu')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="font-bold text-slate-800">
                    {adminView === 'students' && 'Gestión de Estudiantes'}
                    {adminView === 'teachers' && 'Gestión de Profesores'}
                    {adminView === 'groups' && 'Gestión de Grupos'}
                  </h3>
                </div>
                <div className="p-6">
                  {adminView === 'students' && <AdminStudentManager />}
                  {adminView === 'teachers' && <AdminTeacherManager />}
                  {adminView === 'groups' && <AdminGroupManager />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STUDENT VIEW - ICFES MODULE */}
        {profile && profile.role === 'estudiante' && studentData && (
          <div className="w-full animate-enter">
            {studentView === 'setup' && (
              <div className="bg-white shadow-sm border border-slate-100 rounded-3xl p-6">
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

            {studentView === 'menu' && (
              <div className="flex flex-col gap-4">
                <MenuCard
                  title="Entrenar ICFES"
                  description="Practicar con IA"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                  onClick={() => setStudentView('training')}
                />

                <MenuCard
                  title="Ranking"
                  description="Ver tabla de posiciones"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  onClick={() => setStudentView('leaderboard')}
                />

                <MenuCard
                  title="Mis Deberes"
                  description="Tareas pendientes"
                  icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
                  onClick={() => setStudentView('board')}
                />

                <button
                  onClick={() => setStudentView('setup')}
                  className="w-full bg-white border border-slate-200 p-4 rounded-xl hover:bg-slate-50 transition-all text-left flex items-center gap-4 group mt-4"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide group-hover:text-slate-900">Configuración IA</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {studentData.apiKey ? 'API Key activa' : 'Sin configurar'}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {studentView !== 'menu' && studentView !== 'setup' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <button
                    onClick={() => setStudentView('menu')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="font-bold text-slate-800">
                    {studentView === 'training' && 'Entrenamiento ICFES'}
                    {studentView === 'leaderboard' && 'Ranking'}
                    {studentView === 'board' && 'Mis Deberes'}
                  </h3>
                </div>
                <div className="p-6">
                  {studentView === 'training' && (
                    <ICFESTraining
                      studentId={studentData.id}
                      studentName={studentData.name || ''}
                      apiKey={studentData.apiKey!}
                      onConfigureApiKey={() => setStudentView('setup')}
                    />
                  )}
                  {studentView === 'leaderboard' && <ICFESLeaderboard />}
                  {studentView === 'board' && <StudentBoard studentId={studentData.id} />}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}