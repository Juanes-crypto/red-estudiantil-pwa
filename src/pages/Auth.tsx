import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Colegio {
  id: string;
  name: string;
}

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLogin, setIsLogin] = useState(false);
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

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                <span className="text-3xl font-bold text-blue-600">RE</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Red Estudiantil
              </h1>
              <p className="text-blue-100 text-sm">
                Plataforma de gestión escolar
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            {/* Tab Selector */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${!isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Registro
              </button>
            </div>

            <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              {/* School Selector (Only for Register) */}
              {!isLogin && (
                <div>
                  <label htmlFor="colegio" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona tu colegio
                  </label>
                  <select
                    id="colegio"
                    value={selectedColegio}
                    onChange={(e) => setSelectedColegio(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                disabled={loading || (!isLogin && loadingColegios)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </span>
                ) : (
                  <span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                )}
              </button>
            </form>

            {/* Message */}
            {mensaje && (
              <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${mensaje.includes('Error') || mensaje.includes('incorrectos')
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : 'bg-green-50 text-green-700 border border-green-100'
                }`}>
                {mensaje}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              {' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMensaje('');
                }}
                className="font-medium text-blue-600 hover:text-cyan-600 transition"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Red Estudiantil. Conectando educación.
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}