// PASO 1: Importar las herramientas que necesitamos
import { useState, useEffect } from 'react' // ¡Añadimos useEffect!
// ¡Importamos nuestra "tubería" (el cliente) de Supabase!
import { supabase } from '../lib/supabaseClient'

// --- ¡NUEVO! ---
// Definimos el "tipo" de un Colegio
interface Colegio {
  id: string;
  name: string;
}
// --- FIN DE LO NUEVO ---

export default function AuthPage() {
  // PASO 2: "Estado" de React
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [isLogin, setIsLogin] = useState(false)

  // --- ¡NUEVOS ESTADOS! ---
  const [colegios, setColegios] = useState<Colegio[]>([])
  const [selectedColegio, setSelectedColegio] = useState('')
  const [loadingColegios, setLoadingColegios] = useState(true)
  // --- FIN DE LO NUEVO ---

  // --- ¡NUEVO useEffect! ---
  // Se ejecuta UNA VEZ cuando la página carga
  // para traer la lista de colegios.
  useEffect(() => {
    const fetchColegios = async () => {
      try {
        setLoadingColegios(true);
        // ¡Gracias al Paso 71, esto es público!
        const { data, error } = await supabase
          .from('colegios')
          .select('id, name')
          .order('name', { ascending: true }); // Los ordenamos alfabéticamente

        if (error) throw error;
        setColegios(data || []);
      } catch (error: any) {
        setMensaje(`Error cargando colegios: ${error.message}`);
      } finally {
        setLoadingColegios(false);
      }
    };
    
    fetchColegios();
  }, []); // El '[]' vacío significa "ejecuta esto solo al inicio"
  // --- FIN DE LO NUEVO ---

  // PASO 3: La función MÁGICA (¡ACTUALIZADA!)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault() // Evita que la página se recargue

    // Validación
    if (!selectedColegio) {
      setMensaje('Error: Debes seleccionar un colegio para registrarte.');
      return;
    }

    try {
      setMensaje('Registrando...') // Damos feedback al usuario
      
      // ¡AQUÍ ESTÁ LA MAGIA "MULTI-TENANT"!
      // Pasamos el 'colegio_id' en 'options.data'.
      // Nuestro trigger en la DB (que arreglaremos AHORA) leerá esto.
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            colegio_id: selectedColegio
          }
        }
      })

      if (error) throw error // Si hay un error, saltamos al 'catch'

      // ¡Éxito!
      setMensaje('¡Registro exitoso! Revisa tu email para confirmar.')
      
      // ¡Ya no hacemos nada más!
      // El Trigger 'handle_new_user' (Paso 73)
      // se encargará de crear el 'profile' con el 'colegio_id' correcto.

    } catch (error: any) {
      // Manejo de errores
      console.error(error.message)
      setMensaje(`Error: ${error.message}`)
    }
  }

  // NUEVA FUNCIÓN: INICIAR SESIÓN (Sin cambios)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault() 
    try {
      setMensaje('Iniciando sesión...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      if (error) throw error 
      setMensaje('¡Bienvenido!')
    } catch (error: any) {
      console.error(error.message)
      if (error.message.includes('Invalid login credentials')) {
        setMensaje('Error: Email o contraseña incorrectos.')
      } else {
        setMensaje(`Error: ${error.message}`)
      }
    }
  }

  // PASO 4: El HTML (JSX) con estilos de Tailwind
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-900 text-white">
      <div className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-800 p-8 shadow-lg">

        <h1 className="mb-6 text-center text-3xl font-bold text-cyan-400">
          {isLogin ? 'Inicia Sesión' : 'Crea tu cuenta'}
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-400">
          {isLogin ? 'Bienvenido de vuelta' : 'Ingresa tus datos para registrarte'}
        </p>

        <form onSubmit={isLogin ? handleSignIn : handleSignUp}>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2.5 text-white placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4"> {/* (Cambiado a mb-4) */}
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2.5 text-white placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {/* --- ¡NUEVO BLOQUE! --- */}
          {/* Solo mostramos el selector de colegio en modo "Registro" */}
          {!isLogin && (
            <div className="mb-6">
              <label htmlFor="colegio" className="mb-2 block text-sm font-medium text-zinc-300">
                Tu Colegio
              </label>
              <select
                id="colegio"
                value={selectedColegio}
                onChange={(e) => setSelectedColegio(e.target.value)}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2.5 text-white placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500"
                required
                disabled={loadingColegios} // Se deshabilita mientras cargan
              >
                <option value="" disabled>
                  {loadingColegios ? 'Cargando colegios...' : 'Selecciona tu colegio'}
                </option>
                {colegios.map((colegio) => (
                  <option key={colegio.id} value={colegio.id}>
                    {colegio.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* --- FIN DEL NUEVO BLOQUE --- */}


          {/* Botón de Enviar */}
          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-600 px-5 py-2.5 text-center font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-800"
            // Deshabilitamos el botón si están cargando los colegios
            disabled={!isLogin && loadingColegios}
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarme'}
          </button>
        </form>

        {/* Mensaje de feedback */}
        {mensaje && (
          <p className="mt-4 text-center text-sm font-medium text-green-400">
            {mensaje}
          </p>
        )}

        {/* El "interruptor" para cambiar de modo */}
        <button
          onClick={() => setIsLogin(!isLogin)} // Invierte el estado
          className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-cyan-400 hover:underline"
        >
          {isLogin
            ? '¿No tienes una cuenta? Regístrate'
            : '¿Ya tienes una cuenta? Inicia Sesión'}
        </button>
      </div>
    </div>
  )
}