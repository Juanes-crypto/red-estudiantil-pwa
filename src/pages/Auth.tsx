import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';

interface Colegio {
  id: string;
  name: string;
}

export default function AuthPage() {
  const [userType, setUserType] = useState<'padre' | 'estudiante'>('padre');
  const [email, setEmail] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [selectedColegio, setSelectedColegio] = useState('');
  const [loadingColegios, setLoadingColegios] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchColegios = async () => {
      try {
        setLoadingColegios(true);
        const { data, error } = await supabase
          .from('colegios')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setColegios(data || []);
      } catch (error: any) {
        setMensaje(`Error cargando colegios: ${error.message}`);
      } finally {
        setLoadingColegios(false);
      }
    };

    fetchColegios();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedColegio) {
      setMensaje('Error: Debes seleccionar un colegio para registrarte.');
      return;
    }

    try {
      setLoading(true);
      setMensaje('');

      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            colegio_id: selectedColegio
          }
        }
      });

      if (error) throw error;

      setMensaje('Registro exitoso. Revisa tu email para confirmar.');
    } catch (error: any) {
      console.error(error.message);
      setMensaje(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMensaje('');

      if (userType === 'estudiante') {
        const { studentLogin, saveSession } = await import('../lib/studentAuth');

        const session = await studentLogin(documentNumber, password);
        saveSession(session);

        setMensaje('Bienvenido!');
        setTimeout(() => window.location.reload(), 500);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setMensaje('Bienvenido');
    } catch (error: any) {
      console.error(error.message);
      if (error.message.includes('Invalid login credentials')) {
        setMensaje('Error: Email o contraseña incorrectos.');
      } else {
        setMensaje(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59 130 246) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }}></div>

      {/* Acentos de color del logo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-300 opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-300 opacity-10 blur-3xl rounded-full"></div>

      {/* Card Principal */}
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-sm shadow-hard border border-neutral-200">
          {/* Header con Logo */}
          <div className="relative bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 px-8 py-12 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500"></div>
            <div className="absolute inset-0 bg-brand-700/20"></div>

            <div className="text-center relativez-10">
              <div className="inline-block mb-5">
                <div className="bg-white p-3 rounded-xl shadow-brand">
                  <Logo size="lg" />
                </div>
              </div>
              <h1 className="text-3xl font-bold font-display text-white mb-2 tracking-tight">
                Red Estudiantil
              </h1>
              <p className="text-brand-100 text-sm font-medium uppercase tracking-wider">
                Sistema de Gestión Educativa
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-10">
            {/* User Type Selector */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-neutral-700 mb-4 uppercase tracking-wide">
                Selecciona tu Rol
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setUserType('padre');
                    setMensaje('');
                  }}
                  className={`group relative p-6 border-2 transition-all duration-300 ${userType === 'padre'
                      ? 'border-brand-500 bg-brand-50 shadow-soft'
                      : 'border-neutral-300 hover:border-brand-300 hover:bg-neutral-50'
                    }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 ${userType === 'padre' ? 'bg-brand-600' : 'bg-transparent'
                    }`}></div>
                  <div className="flex flex-col items-center gap-2">
                    <svg className={`w-8 h-8 transition-colors ${userType === 'padre' ? 'text-brand-600' : 'text-neutral-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className={`text-xs font-bold uppercase tracking-wider ${userType === 'padre' ? 'text-brand-700' : 'text-neutral-600'
                      }`}>
                      Padre/Madre
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserType('estudiante');
                    setMensaje('');
                  }}
                  className={`group relative p-6 border-2 transition-all duration-300 ${userType === 'estudiante'
                      ? 'border-focus-500 bg-focus-50 shadow-soft'
                      : 'border-neutral-300 hover:border-focus-300 hover:bg-neutral-50'
                    }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 ${userType === 'estudiante' ? 'bg-focus-600' : 'bg-transparent'
                    }`}></div>
                  <div className="flex flex-col items-center gap-2">
                    <svg className={`w-8 h-8 transition-colors ${userType === 'estudiante' ? 'text-focus-600' : 'text-neutral-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div className={`text-xs font-bold uppercase tracking-wider ${userType === 'estudiante' ? 'text-focus-700' : 'text-neutral-600'
                      }`}>
                      Estudiante
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Selector - Solo para padres */}
            {userType === 'padre' && (
              <div className="flex border-2 border-neutral-300 mb-8 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-300 ${isLogin
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-300 ${!isLogin
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  Registro
                </button>
              </div>
            )}

            <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-6">
              {/* Email Field - Solo para padres */}
              {userType === 'padre' && (
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200 transition-all duration-300"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              )}

              {/* Document Field - Solo para estudiantes */}
              {userType === 'estudiante' && (
                <div>
                  <label htmlFor="document" className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                    Número de Documento
                  </label>
                  <input
                    id="document"
                    type="text"
                    inputMode="numeric"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-focus-500 focus:bg-white focus:ring-2 focus:ring-focus-200 transition-all duration-300"
                    placeholder="123456789"
                    required
                  />
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none ${userType === 'estudiante' ? 'focus:border-focus-500 focus:ring-focus-200' : 'focus:border-brand-500 focus:ring-brand-200'
                    } focus:bg-white focus:ring-2 transition-all duration-300`}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                {userType === 'estudiante' && (
                  <p className="mt-2 text-xs text-neutral-500 font-medium">
                    Usa tu número de documento como contraseña
                  </p>
                )}
              </div>

              {/* School Selector (Only for Parent Register) */}
              {userType === 'padre' && !isLogin && (
                <div>
                  <label htmlFor="colegio" className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                    Selecciona tu Colegio
                  </label>
                  <select
                    id="colegio"
                    value={selectedColegio}
                    onChange={(e) => setSelectedColegio(e.target.value)}
                    className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-300 text-neutral-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200 transition-all duration-300"
                    required
                    disabled={loadingColegios}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (userType === 'padre' && !isLogin && loadingColegios)}
                className={`w-full ${userType === 'estudiante'
                    ? 'bg-focus-600 hover:bg-focus-700 focus:ring-focus-500 shadow-[0_4px_14px_0_rgba(14,165,233,0.4)]'
                    : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 focus:ring-brand-500 shadow-brand'
                  } text-white py-4 font-bold uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {loading ? (
                  <span className="flex items-center justify-center gap-3 relative z-10">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </span>
                ) : (
                  <span className="relative z-10">
                    {userType === 'estudiante'
                      ? 'Ingresar'
                      : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
                    }
                  </span>
                )}
              </button>
            </form>

            {/* Message */}
            {mensaje && (
              <div className={`mt-6 p-4 border-l-4 text-sm font-semibold animate-fade-in-up ${mensaje.includes('Error') || mensaje.includes('incorrectos')
                  ? 'bg-red-50 text-red-800 border-red-600'
                  : 'bg-green-50 text-green-800 border-green-600'
                }`}>
                {mensaje}
              </div>
            )}
          </div>

          {/* Footer */}
          {userType === 'padre' && (
            <div className="px-8 py-6 bg-neutral-50 border-t-2 border-neutral-200">
              <p className="text-center text-sm text-neutral-600">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                {' '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMensaje('');
                  }}
                  className="font-bold text-brand-600 hover:text-brand-700 underline transition-colors"
                >
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <div className="text-center mt-8 flex items-center justify-center gap-2 opacity-60">
          <Logo size="xs" />
          <p className="text-xs text-neutral-600 font-medium tracking-wide">
            © 2025 Red Estudiantil · Sistema de Gestión Educativa
          </p>
        </div>
      </div>
    </div>
  );
}