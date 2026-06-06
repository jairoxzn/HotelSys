import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import {
  LayoutDashboard,
  Bed,
  CalendarRange,
  Users,
  CreditCard,
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
  Settings
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { hotelName, logoUrl } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPCIONISTA', 'CONTADOR'] },
    { name: 'Habitaciones', path: '/rooms', icon: Bed, roles: ['ADMIN', 'RECEPCIONISTA', 'CONTADOR'] },
    { name: 'Reservas', path: '/reservations', icon: CalendarRange, roles: ['ADMIN', 'RECEPCIONISTA', 'CONTADOR'] },
    { name: 'Clientes', path: '/customers', icon: Users, roles: ['ADMIN', 'RECEPCIONISTA'] },
    { name: 'Pagos', path: '/payments', icon: CreditCard, roles: ['ADMIN', 'CONTADOR'] },
    { name: 'Reportes', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'CONTADOR', 'RECEPCIONISTA'] },
    { name: 'Configuración', path: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentRole = user?.role || 'RECEPCIONISTA';

  // Filter menu items by user role
  const allowedNavigation = navigationItems.filter(item => item.roles.includes(currentRole));

  // Get first character of hotel name for logo
  const logoChar = hotelName.charAt(0).toUpperCase();

  const pageTitles: Record<string, string> = {
    '/dashboard': 'Panel de Control',
    '/rooms': 'Gestión de Habitaciones',
    '/reservations': 'Gestión de Reservas',
    '/customers': 'Clientes / Huéspedes',
    '/payments': 'Registro Financiero / Pagos',
    '/reports': 'Reportes Ejecutivos',
    '/settings': 'Configuración del Sistema',
  };

  const currentTitle = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || '';

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3 bg-primary-500 rounded-full shadow-lg text-white glow-primary hover:bg-primary-600 transition"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-darker border-r border-gray-800/50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800/40">
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-cover shadow-md bg-white/5" 
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md" style={{ background: `linear-gradient(135deg, var(--theme-primary), #8b5cf6)` }}>
                {logoChar}
              </div>
            )}
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              {hotelName}
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {allowedNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const isSettings = item.path === '/settings';
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'active bg-primary-500/10 text-primary-500 border-l-4 border-primary-500'
                    : isSettings
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 mt-auto'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary-500' : isSettings ? 'text-gray-500' : 'text-gray-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-gray-800/40 space-y-3 bg-bg-darker/60">
          <div className="flex items-center space-x-3 px-2 py-1.5">
            <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-300 border border-gray-700/50">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition duration-150"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-bg-darker/50 border-b border-gray-800/30 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-white tracking-wide">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400 border border-gray-800 bg-bg-darker/40 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-medium">Servidor Conectado</span>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
