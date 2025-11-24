// 1. Importamos las herramientas de React
import { useState, useEffect } from 'react'
// 2. Importamos Supabase
import { supabase } from './lib/supabaseClient'
// 3. Importamos nuestras DOS páginas
import AuthPage from './pages/Auth'
import Dashboard from './pages/Dashboard'
// 4. Importamos el tipo 'Session' para TypeScript
// 4. Importamos el tipo 'Session' para TypeScript
import type { Session } from '@supabase/supabase-js'
import { useNotifications } from './hooks/useNotifications'

function App() {
  // 5. Creamos un "estado" para guardar la sesión del usuario
  // (Puede ser 'Session' o 'null' si no está logueado)
  const [session, setSession] = useState<Session | null>(null)
  useNotifications();

  // 6. ¡EL NÚCLEO! Esto se ejecuta UNA SOLA VEZ cuando la app carga
  useEffect(() => {
    const checkAuth = async () => {
      // Primero verificar si hay sesión de estudiante (custom auth)
      const { getCurrentSession } = await import('./lib/studentAuth');
      const studentSession = getCurrentSession();

      if (studentSession) {
        // Crear sesión "fake" para que App.tsx muestre Dashboard
        setSession({ user: { id: studentSession.studentId } } as Session);
        return;
      }

      // Si no hay sesión de estudiante, verificar Supabase Auth
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });

      // Escuchar cambios en la autenticación de Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
        }
      );

      // Limpieza
      return () => subscription.unsubscribe();
    };

    checkAuth();
  }, []); // El '[]' vacío significa "ejecuta esto solo al inicio"

  // 7. EL RENDER LÓGICO (El Guardia)
  // Si NO hay sesión (session es null), muestra la página de Auth.
  // Si SÍ hay sesión, muestra el Dashboard.
  return (
    <div>
      {!session ? <AuthPage /> : <Dashboard />}
    </div>
  )
}

export default App