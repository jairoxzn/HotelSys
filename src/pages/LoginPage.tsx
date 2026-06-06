import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { Lock, Mail, HelpCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { hotelName } = useConfig();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg-darker flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-accent-violet/10 rounded-full blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg glow-primary" style={{ background: `linear-gradient(135deg, var(--theme-primary), #8b5cf6)` }}>
            {hotelName.charAt(0).toUpperCase()}
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            {hotelName}
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white font-heading">
          Ingresar al sistema
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Administración integral para hoteles modernos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="glass-card py-8 px-6 shadow-2xl rounded-2xl border border-gray-800/80">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3.5 rounded-xl flex items-center">
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Correo electrónico
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@hotel.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-bg-dark border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 bg-bg-dark border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 cursor-pointer shadow-md glow-primary disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          {/* Quick autofill panel for testing */}
          <div className="mt-8 pt-6 border-t border-gray-800/60">
            <div className="flex items-center space-x-2 text-gray-400 mb-3 text-xs font-semibold uppercase tracking-wider">
              <HelpCircle size={14} />
              <span>Acceso de Prueba Rápido</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleQuickFill('admin@hotelflow.com', 'admin123')}
                className="flex items-center justify-between px-3.5 py-2 bg-gray-900/40 hover:bg-primary-500/10 border border-gray-800 hover:border-primary-500/30 rounded-xl text-left transition text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">Administrador</span>
                  <span className="text-gray-500">admin@hotelflow.com</span>
                </div>
                <span className="text-primary-500 font-medium">Cargar</span>
              </button>

              <button
                onClick={() => handleQuickFill('recepcionista@hotelflow.com', 'recep123')}
                className="flex items-center justify-between px-3.5 py-2 bg-gray-900/40 hover:bg-primary-500/10 border border-gray-800 hover:border-primary-500/30 rounded-xl text-left transition text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">Recepcionista</span>
                  <span className="text-gray-500">recepcionista@hotelflow.com</span>
                </div>
                <span className="text-primary-500 font-medium">Cargar</span>
              </button>

              <button
                onClick={() => handleQuickFill('contador@hotelflow.com', 'conta123')}
                className="flex items-center justify-between px-3.5 py-2 bg-gray-900/40 hover:bg-primary-500/10 border border-gray-800 hover:border-primary-500/30 rounded-xl text-left transition text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">Contador</span>
                  <span className="text-gray-500">contador@hotelflow.com</span>
                </div>
                <span className="text-primary-500 font-medium">Cargar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
