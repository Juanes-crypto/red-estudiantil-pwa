// 1. Importamos las herramientas de React
import { useState, useEffect } from 'react'
// 2. Importamos Supabase
import { supabase } from './lib/supabaseClient'
// 3. Importamos nuestras DOS páginas
import AuthPage from './pages/Auth'
import Dashboard from './pages/Dashboard'
// 4. Importamos el tipo 'Session' para TypeScript
import { Session } from '@supabase/supabase-js'

function App() {
  // 5. Creamos un "estado" para guardar la sesión del usuario
  // (Puede ser 'Session' o 'null' si no está logueado)
  const [session, setSession] = useState<Session | null>(null)

  // 6. ¡EL NÚCLEO! Esto se ejecuta UNA SOLA VEZ cuando la app carga
  useEffect(() => {
    // Primero, intentamos obtener la sesión actual (si recargó la pág)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Segundo, "escuchamos" cambios en la autenticación
    // (Ej: si inicia sesión, cierra sesión, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    // "Limpiamos" el "escuchador" cuando el componente se destruye
    return () => subscription.unsubscribe()
  }, []) // El '[]' vacío significa "ejecuta esto solo al inicio"

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