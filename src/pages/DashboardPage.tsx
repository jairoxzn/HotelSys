import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import {
  BedDouble,
  CalendarCheck2,
  DollarSign,
  TrendingUp,
  ClipboardList
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const getLogBadgeStyles = (type: string) => {
  switch (type) {
    case 'INICIO_SESION':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'REGISTRO_USUARIO':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'CREAR_HABITACION':
    case 'MODIFICAR_HABITACION':
    case 'MODIFICAR_ESTADO_HABITACION':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    case 'ELIMINAR_HABITACION':
    case 'ELIMINAR_CLIENTE':
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    case 'CREAR_CLIENTE':
    case 'MODIFICAR_CLIENTE':
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    case 'CREAR_RESERVA':
    case 'MODIFICAR_RESERVA':
      return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    case 'CHECK_IN':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'CHECK_OUT':
      return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
    case 'CANCELAR_RESERVA':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    case 'PAGO_REGISTRADO':
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar estadísticas.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin glow-primary"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
        {error || 'Error al obtener la información.'}
      </div>
    );
  }

  const { roomStats, activeReservations, todayTasks, financialStats, activityLog, weeklyRevenue } = stats;

  // Pie chart data structure
  const pieData = [
    { name: 'Disponibles', value: roomStats.available, color: '#10b981' },
    { name: 'Ocupadas', value: roomStats.occupied, color: '#6366f1' },
    { name: 'Mantenimiento', value: roomStats.maintenance, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Occupancy Card */}
        <div className="glass-card p-5 rounded-2xl border border-gray-800/50 flex items-center space-x-4">
          <div className="p-3 bg-primary-500/10 rounded-xl text-primary-500">
            <BedDouble size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Ocupación</p>
            <h3 className="text-2xl font-bold text-white mt-1">{roomStats.occupancyRate}%</h3>
            <p className="text-xs text-gray-500 mt-1">
              {roomStats.occupied} de {roomStats.total - roomStats.maintenance} hab. activas
            </p>
          </div>
        </div>

        {/* Active bookings Card */}
        <div className="glass-card p-5 rounded-2xl border border-gray-800/50 flex items-center space-x-4">
          <div className="p-3 bg-accent-violet/10 rounded-xl text-accent-violet">
            <CalendarCheck2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Reservas Activas</p>
            <h3 className="text-2xl font-bold text-white mt-1">{activeReservations}</h3>
            <p className="text-xs text-gray-500 mt-1">Pendientes o activas hoy</p>
          </div>
        </div>

        {/* Daily Income Card */}
        <div className="glass-card p-5 rounded-2xl border border-gray-800/50 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Ingresos de Hoy</p>
            <h3 className="text-2xl font-bold text-white mt-1">S/. {financialStats.todayIncome.toFixed(2)}</h3>
            <p className="text-xs text-emerald-500 flex items-center mt-1 font-medium">
              <TrendingUp size={12} className="mr-0.5" />
              <span>Transacciones registradas</span>
            </p>
          </div>
        </div>

        {/* Monthly Projection Card */}
        <div className="glass-card p-5 rounded-2xl border border-gray-800/50 flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Ingresos del Mes</p>
            <h3 className="text-2xl font-bold text-white mt-1">S/. {financialStats.monthlyForecast.toFixed(2)}</h3>
            <p className="text-xs text-gray-500 mt-1">Facturación acumulada del mes</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Tasks Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-gray-800/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Facturación Semanal</h3>
            <span className="text-xs text-gray-400 bg-gray-900/60 px-2.5 py-1 rounded-md border border-gray-850">
              Últimos 7 días
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161720', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Area type="monotone" dataKey="monto" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMonto)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room breakdown Pie */}
        <div className="glass-card p-6 rounded-2xl border border-gray-800/50 flex flex-col">
          <h3 className="text-base font-bold text-white mb-4">Estado de Habitaciones</h3>
          <div className="flex-1 flex items-center justify-center min-h-48 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161720', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-gray-500 text-sm">Sin habitaciones</span>
            )}
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{roomStats.total}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total</span>
            </div>
          </div>
          {/* Custom Legends */}
          <div className="flex justify-center space-x-4 text-xs font-semibold mt-4">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-300">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task List and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's checklist */}
        <div className="glass-card p-6 rounded-2xl border border-gray-800/50 flex flex-col">
          <div className="flex items-center space-x-2 pb-3.5 border-b border-gray-800/40 mb-4">
            <ClipboardList size={18} className="text-primary-500" />
            <h3 className="text-base font-bold text-white">Tareas Pendientes Hoy</h3>
          </div>
          <div className="flex-1 space-y-4 justify-center flex flex-col">
            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-850 rounded-xl">
              <div>
                <span className="text-sm font-semibold text-white block">Check-ins Esperados</span>
                <span className="text-xs text-gray-500 font-medium">Ingresos a procesar hoy</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                todayTasks.checkIns > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-850 text-gray-500'
              }`}>
                {todayTasks.checkIns} pendientes
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-gray-850 rounded-xl">
              <div>
                <span className="text-sm font-semibold text-white block">Check-outs Pendientes</span>
                <span className="text-xs text-gray-500 font-medium">Salidas y cobros hoy</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                todayTasks.checkOuts > 0 ? 'bg-primary-500/10 text-primary-400' : 'bg-gray-850 text-gray-500'
              }`}>
                {todayTasks.checkOuts} pendientes
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity feed */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-gray-800/50">
          <h3 className="text-base font-bold text-white mb-4 pb-3.5 border-b border-gray-800/40">Actividad Reciente</h3>
          <div className="space-y-4">
            {activityLog.length > 0 ? (
              activityLog.map((log: any) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-900/20 border border-gray-850 rounded-xl hover:bg-gray-900/30 transition gap-2">
                  <div className="flex items-start space-x-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase flex-shrink-0 mt-0.5 ${getLogBadgeStyles(log.type)}`}>
                      {log.type.replace(/_/g, ' ')}
                    </span>
                    <div>
                      <p className="text-sm text-gray-200 font-medium leading-normal">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Realizado por <span className="text-gray-400 font-semibold">{log.user?.name}</span> ({log.user?.role})
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 text-xs text-gray-500 font-medium sm:self-center">
                    {new Date(log.date).toLocaleString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">Sin actividades recientes.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
