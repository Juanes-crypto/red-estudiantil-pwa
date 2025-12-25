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
    <div className="auth-container">
      <div className="auth-card animate-enter">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="inline-block bg-white p-3 rounded-2xl shadow-lg mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Red Estudiantil</h1>
          <p className="text-blue-100 text-sm font-medium">Plataforma Educativa</p>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setUserType('padre')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${userType === 'padre'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-100 text-slate-400 hover:border-blue-200'
                }`}
            >
              <span className="font-bold text-sm uppercase tracking-wider">Familia</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('estudiante')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${userType === 'estudiante'
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                  : 'border-slate-100 text-slate-400 hover:border-cyan-200'
                }`}
            >
              <span className="font-bold text-sm uppercase tracking-wider">Estudiante</span>
            </button>
          </div>

          {/* Login/Register Toggle (Parents only) */}
          {userType === 'padre' && (
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Ingresar
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Registrar
              </button>
            </div>
          )}

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-5">
            {/* Email Field */}
            {userType === 'padre' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="nombre@ejemplo.com"
                  required
                />
              </div>
            )}

            {/* Document Field */}
            {userType === 'estudiante' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  Documento de Identidad
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="input-field"
                  placeholder="123456789"
                  required
                />
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {/* School Selector */}
            {userType === 'padre' && !isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  Colegio
                </label>
                <select
                  value={selectedColegio}
                  onChange={(e) => setSelectedColegio(e.target.value)}
                  className="input-field"
                  required
                  disabled={loadingColegios}
                >
                  <option value="" disabled>
                    {loadingColegios ? 'Cargando...' : 'Selecciona tu colegio'}
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
              disabled={loading}
              className="btn-primary mt-4"
            >
              {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>

          {/* Messages */}
          {mensaje && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium text-center ${mensaje.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
              }`}>
              {mensaje}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-white/60 text-xs font-medium">
        © 2025 Red Estudiantil
      </div>
    </div>
  );
}