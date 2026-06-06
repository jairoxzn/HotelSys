import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { Lock, Mail, HelpCircle, Eye, EyeOff, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const slides = [
  {
    tag: "Operaciones",
    title: "Gestión Eficiente de Habitaciones",
    description: "Monitorea la disponibilidad, estado de limpieza y asignación de huéspedes en tiempo real con un panel de control intuitivo."
  },
  {
    tag: "Servicio",
    title: "Experiencias de Huéspedes Personalizadas",
    description: "Lleva el registro de preferencias de consumo y reservas de tus clientes para brindar una atención de categoría premium."
  },
  {
    tag: "Administración",
    title: "Análisis Financiero y Reportes",
    description: "Obtén resúmenes ejecutivos e informes automatizados de ingresos, facturación y ocupación para tomar mejores decisiones."
  }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { hotelName } = useConfig();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-bg-darker flex relative overflow-hidden">
      {/* LEFT SIDE: Brand presentation (Visible only on desktop) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden select-none">
        {/* Background Image with Ken Burns zoom effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1000ms] animate-kenburns"
          style={{ 
            backgroundImage: "url('/assets/hotel_login_bg.png')",
            zIndex: 1 
          }}
        />
        {/* Dark elegant overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-bg-darker via-bg-darker/85 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/5 via-transparent to-accent-violet/10 z-10" />
        
        {/* Header: Hotel Brand */}
        <div className="z-20 flex items-center space-x-3.5 animate-fadeInUp">
          <div 
            className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-xl glow-primary" 
            style={{ background: `linear-gradient(135deg, var(--theme-primary), #8b5cf6)` }}
          >
            {hotelName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-white font-heading block leading-none">
              {hotelName}
            </span>
            <span className="text-xs text-primary-400 font-semibold tracking-wider uppercase mt-1 block">
              Sistema de Gestión Hotelera
            </span>
          </div>
        </div>

        {/* Center: Slide content (Carousel) */}
        <div className="z-20 max-w-lg mb-12 animate-fadeInUp delay-200">
          <div className="min-h-[220px] flex flex-col justify-end">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-primary-600/20 border border-primary-500/30 w-fit mb-4">
              <Sparkles size={12} className="mr-1.5 text-primary-400 animate-pulse" />
              {slides[activeSlide].tag}
            </span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight font-heading transition-all duration-500">
              {slides[activeSlide].title}
            </h2>
            <p className="mt-4 text-base text-gray-300/95 leading-relaxed transition-all duration-500">
              {slides[activeSlide].description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="mt-8 flex space-x-2.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeSlide ? 'w-8 bg-primary-500' : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Ir a diapositiva ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="z-20 text-xs text-gray-500 flex justify-between items-center animate-fadeInUp delay-400">
          <span>&copy; {new Date().getFullYear()} {hotelName}. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Servicio Activo
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Login form container */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 relative z-20 bg-bg-darker">
        {/* Background neon glows for mobile / subtle extra glow on desktop */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-violet/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="mx-auto w-full max-w-md">
          {/* Header only for mobile (hidden on lg) */}
          <div className="lg:hidden flex flex-col items-center mb-8 animate-fadeInUp">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-xl glow-primary mb-4" 
              style={{ background: `linear-gradient(135deg, var(--theme-primary), #8b5cf6)` }}
            >
              {hotelName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-3xl font-extrabold text-white text-center font-heading">
              {hotelName}
            </h1>
            <p className="mt-1 text-center text-sm text-gray-400">
              Administración integral para hoteles modernos
            </p>
          </div>

          {/* Form Header (Visible on desktop) */}
          <div className="hidden lg:block animate-fadeInUp delay-100">
            <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Ingresa tus credenciales para acceder al panel administrativo.
            </p>
          </div>

          <div className="mt-8 animate-fadeInUp delay-200">
            <div className="glass-card py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-gray-800/80 backdrop-blur-xl">
              {error && (
                <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                  <span className="flex-1 leading-normal">{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Correo electrónico
                  </label>
                  <div className="mt-2 relative rounded-xl shadow-sm group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary-500 transition-colors">
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
                      className="block w-full pl-11 pr-4 py-3 bg-bg-dark/80 border border-gray-800 hover:border-gray-700/80 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <div className="mt-2 relative rounded-xl shadow-sm group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary-500 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-12 py-3 bg-bg-dark/80 border border-gray-800 hover:border-gray-700/80 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2.5 text-xs text-gray-400 hover:text-gray-300 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-800 bg-bg-dark text-primary-500 focus:ring-primary-500 focus:ring-offset-bg-darker focus:outline-none transition cursor-pointer"
                    />
                    <span>Recordar sesión</span>
                  </label>
                  <a href="#forgot" className="text-xs font-semibold text-primary-400 hover:text-primary-500 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-primary-500/20 hover:scale-[1.01] active:scale-[0.99] glow-primary disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>
                </div>
              </form>

              {/* Demo Accounts Panel */}
              <div className="mt-6 pt-5 border-t border-gray-800/60">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full flex items-center justify-between text-gray-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider py-1 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <HelpCircle size={14} className="text-primary-400" />
                    <span>Cuentas de Demostración</span>
                  </div>
                  {showDemoAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showDemoAccounts && (
                  <div className="mt-3 grid grid-cols-1 gap-2 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin@hotelflow.com', 'admin123')}
                      className="flex items-center justify-between px-4 py-2.5 bg-gray-900/40 hover:bg-primary-500/10 border border-gray-800 hover:border-primary-500/30 rounded-xl text-left transition-all duration-200 text-xs cursor-pointer group"
                    >
                      <div>
                        <span className="font-semibold text-white group-hover:text-primary-400 transition-colors block">
                          Administrador
                        </span>
                        <span className="text-gray-500 block mt-0.5">admin@hotelflow.com</span>
                      </div>
                      <span className="text-primary-500 font-semibold bg-primary-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider group-hover:bg-primary-500 group-hover:text-white transition-all">
                        Cargar
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('recepcionista@hotelflow.com', 'recep123')}
                      className="flex items-center justify-between px-4 py-2.5 bg-gray-900/40 hover:bg-primary-500/10 border border-gray-800 hover:border-primary-500/30 rounded-xl text-left transition-all duration-200 text-xs cursor-pointer group"
                    >
                      <div>
                        <span className="font-semibold text-white group-hover:text-primary-400 transition-colors block">
                          Recepcionista
                        </span>
                        <span className="text-gray-500 block mt-0.5">recepcionista@hotelflow.com</span>
                      </div>
                      <span className="text-primary-500 font-semibold bg-primary-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider group-hover:bg-primary-500 group-hover:text-white transition-all">
                        Cargar
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('contador@hotelflow.com', 'conta123')}
                      className="flex items-center justify-between px-4 py-2.5 bg-gray-900/40 hover:bg-primary-500/10 border border-gray-800 hover:border-primary-500/30 rounded-xl text-left transition-all duration-200 text-xs cursor-pointer group"
                    >
                      <div>
                        <span className="font-semibold text-white group-hover:text-primary-400 transition-colors block">
                          Contador
                        </span>
                        <span className="text-gray-500 block mt-0.5">contador@hotelflow.com</span>
                      </div>
                      <span className="text-primary-500 font-semibold bg-primary-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider group-hover:bg-primary-500 group-hover:text-white transition-all">
                        Cargar
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
