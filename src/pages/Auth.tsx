// PASO 1: Importar las herramientas que necesitamos
import { useState } from 'react'
// ¡Importamos nuestra "tubería" (el cliente) de Supabase!
import { supabase } from '../lib/supabaseClient'

export default function AuthPage() {
  // PASO 2: "Estado" de React para guardar lo que el usuario escribe
  // Usamos 'useState' para crear "cajitas" de memoria
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Estado para mostrar mensajes (ej: "Revisa tu email!")
  const [mensaje, setMensaje] = useState('')

  // ¡NUEVO ESTADO! Para saber si estamos en modo Login o Registro
  const [isLogin, setIsLogin] = useState(false)
  // (Empezamos en 'false', o sea, en modo Registro por defecto)

  // PASO 3: La función MÁGICA que se ejecuta al enviar
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault() // Evita que la página se recargue

    try {
      setMensaje('Registrando...') // Damos feedback al usuario
      
      // ¡Aquí usamos Supabase!
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (error) throw error // Si hay un error, saltamos al 'catch'

      // ¡Éxito!
      setMensaje('¡Registro exitoso! Revisa tu email para confirmar.')
      
      // Aquí es donde nuestro TRIGGER en la DB (handle_new_user)
      // está trabajando en secreto, creando el 'profile' con rol 'padre'.
      // ¡No tenemos que hacer NADA en el frontend! ¡Eso es SOLID!

    } catch (error: any) {
      // Manejo de errores
      console.error(error.message)
      setMensaje(`Error: ${error.message}`)
    }
  }

  // NUEVA FUNCIÓN: INICIAR SESIÓN
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault() // Evita que la página se recargue

    try {
      setMensaje('Iniciando sesión...')

      // ¡Aquí usamos la OTRA función de Supabase!
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) throw error // Si hay un error (ej: pass incorrecta), salta

      // ¡Éxito!
      setMensaje('¡Bienvenido!')
      // (Aquí no se imprime nada en la consola, pero Supabase
      // guarda la sesión del usuario en el navegador)

    } catch (error: any) {
      console.error(error.message)
      // Damos un mensaje más amigable
      if (error.message.includes('Invalid login credentials')) {
        setMensaje('Error: Email o contraseña incorrectos.')
      } else {
        setMensaje(`Error: ${error.message}`)
      }
    }
  }

  // PASO 4: El HTML (JSX) con estilos de Tailwind
  // Esto es lo que el usuario VE
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-900 text-white">
      <div className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-800 p-8 shadow-lg">

        <h1 className="mb-6 text-center text-3xl font-bold text-cyan-400">
          {/* NUEVO: Título dinámico */}
          {isLogin ? 'Inicia Sesión' : 'Crea tu cuenta'}
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-400">
          {/* NUEVO: Subtítulo dinámico */}
          {isLogin ? 'Bienvenido de vuelta' : 'Ingresa tus datos para registrarte'}
        </p>

        {/* DEJAREMOS EL FORMULARIO IGUAL POR AHORA... */}
        <form onSubmit={isLogin ? handleSignIn : handleSignUp}>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email} // Conectamos el input al "estado"
              onChange={(e) => setEmail(e.target.value)} // Guardamos lo que escribe
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2.5 text-white placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password} // Conectamos el input al "estado"
              onChange={(e) => setPassword(e.target.value)} // Guardamos lo que escribe
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2.5 text-white placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500"
              placeholder="••••••••"
              minLength={6} // Supabase requiere 6+ caracteres
              required
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-600 px-5 py-2.5 text-center font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-800"
          >
            {/* NUEVO: Texto de botón dinámico */}
            {isLogin ? 'Iniciar Sesión' : 'Registrarme'}
          </button>
        </form>

        {/* Mensaje de feedback */}
        {mensaje && (
          <p className="mt-4 text-center text-sm font-medium text-green-400">
            {mensaje}
          </p>
        )}

        {/* NUEVO: El "interruptor" para cambiar de modo */}
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