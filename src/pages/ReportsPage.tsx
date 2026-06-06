import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Bed, Users, Printer, TrendingUp, FileClock, Search, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'INICIO_SESION', label: 'Inicio de Sesión' },
  { value: 'REGISTRO_USUARIO', label: 'Registro de Usuario' },
  { value: 'CREAR_HABITACION', label: 'Crear Habitación' },
  { value: 'MODIFICAR_HABITACION', label: 'Modificar Habitación' },
  { value: 'MODIFICAR_ESTADO_HABITACION', label: 'Cambiar Estado' },
  { value: 'ELIMINAR_HABITACION', label: 'Eliminar Habitación' },
  { value: 'CREAR_CLIENTE', label: 'Crear Huésped' },
  { value: 'MODIFICAR_CLIENTE', label: 'Modificar Huésped' },
  { value: 'ELIMINAR_CLIENTE', label: 'Eliminar Huésped' },
  { value: 'CREAR_RESERVA', label: 'Crear Reserva' },
  { value: 'MODIFICAR_RESERVA', label: 'Modificar Reserva' },
  { value: 'CHECK_IN', label: 'Check-In' },
  { value: 'CHECK_OUT', label: 'Check-Out' },
  { value: 'CANCELAR_RESERVA', label: 'Cancelar Reserva' },
  { value: 'PAGO_REGISTRADO', label: 'Registrar Pago' }
];

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const currentRole = user?.role || 'RECEPCIONISTA';

  // Tabs: 'financial', 'rooms', 'customers', 'audit'
  const [activeTab, setActiveTab] = useState<'financial' | 'rooms' | 'customers' | 'audit'>('rooms');

  // Set default tab based on role permissions
  useEffect(() => {
    if (currentRole === 'RECEPCIONISTA') {
      setActiveTab('rooms');
    } else {
      setActiveTab('financial');
    }
  }, [currentRole]);

  // Data states
  const [finData, setFinData] = useState<any>(null);
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [custData, setCustData] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Audit Log
  const [auditFilters, setAuditFilters] = useState({ search: '', action: '' });

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'financial') {
        const data = await reportService.getFinancial();
        setFinData(data);
      } else if (activeTab === 'rooms') {
        const data = await reportService.getRooms();
        setRoomsData(data);
      } else if (activeTab === 'customers') {
        const data = await reportService.getCustomers();
        setCustData(data);
      } else if (activeTab === 'audit') {
        const data = await reportService.getAuditLogs(auditFilters);
        setAuditData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar reporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, auditFilters]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Tabs Selector Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between bg-bg-darker/35 p-3 rounded-2xl border border-gray-800/40 no-print">
        <div className="flex flex-wrap gap-2">
          {currentRole !== 'RECEPCIONISTA' && (
            <button
              onClick={() => setActiveTab('financial')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'financial'
                  ? 'bg-primary-500 text-white glow-primary'
                  : 'bg-bg-dark text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span>Reporte Financiero</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-primary-500 text-white glow-primary'
                : 'bg-bg-dark text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            <Bed size={14} />
            <span>Utilización de Habitaciones</span>
          </button>

          {currentRole !== 'RECEPCIONISTA' && (
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-primary-500 text-white glow-primary'
                  : 'bg-bg-dark text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Clientes Frecuentes (VIP)</span>
            </button>
          )}

          {currentRole !== 'RECEPCIONISTA' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-primary-500 text-white glow-primary'
                  : 'bg-bg-dark text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              <FileClock size={14} />
              <span>Logs de Auditoría</span>
            </button>
          )}
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <Printer size={14} />
          <span>Imprimir Reporte</span>
        </button>
      </div>

      {/* Main Report Body */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin glow-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="print-card glass-card p-6 rounded-2xl border border-gray-800/50 space-y-6">
          {/* Print specific header */}
          <div className="hidden print:flex justify-between items-center border-b pb-4 mb-4 text-black">
            <div>
              <h2 className="text-xl font-bold">Reporte de Gestión HotelFlow</h2>
              <p className="text-xs text-gray-600">Generado el {new Date().toLocaleDateString('es-ES')}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold uppercase">
                {activeTab === 'financial' && 'Finanzas'}
                {activeTab === 'rooms' && 'Ocupación'}
                {activeTab === 'customers' && 'Clientes VIP'}
                {activeTab === 'audit' && 'Auditoría'}
              </span>
            </div>
          </div>

          {/* 1. FINANCIAL REPORT TAB */}
          {activeTab === 'financial' && finData && (
            <div className="space-y-6">
              {/* Stats and Chart */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Financial KPI */}
                <div className="bg-bg-dark/40 border border-gray-850 p-5 rounded-2xl print-card flex items-center space-x-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block uppercase">Ingresos Totales ({finData.year})</span>
                    <span className="text-2xl font-black text-white block mt-0.5">S/. {finData.totalIncome.toFixed(2)}</span>
                  </div>
                </div>

                {/* Recharts Chart bar */}
                <div className="md:col-span-2 bg-bg-dark/40 border border-gray-850 p-5 rounded-2xl print-card h-52">
                  <span className="text-xs text-gray-500 font-semibold block uppercase mb-4">Ingresos por Mes</span>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={finData.monthlyIncome} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#161720', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-gray-850 rounded-xl overflow-hidden print-card">
                <table className="min-w-full divide-y divide-gray-850 text-sm">
                  <thead className="bg-bg-darker/60">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Mes</th>
                      <th className="px-6 py-3 text-right scope='col' text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 bg-transparent text-gray-300">
                    {finData.monthlyIncome.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-800/10 transition">
                        <td className="px-6 py-3 font-semibold">{row.month}</td>
                        <td className="px-6 py-3 text-right font-bold text-white">S/. {row.ingresos.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. ROOMS UTILIZATION TAB */}
          {activeTab === 'rooms' && (
            <div className="border border-gray-850 rounded-xl overflow-hidden print-card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-850 text-sm">
                <thead className="bg-bg-darker/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Habitación</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tarifa / Noche</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Nº Reservas</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Noches Ocupada</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 bg-transparent text-gray-300">
                  {roomsData.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-800/10 transition">
                      <td className="px-6 py-3.5 font-bold text-white">Hab. {row.number}</td>
                      <td className="px-6 py-3.5 font-semibold text-gray-400">{row.type}</td>
                      <td className="px-6 py-3.5">S/. {row.price.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-center font-bold text-white">{row.bookingsCount}</td>
                      <td className="px-6 py-3.5 text-center text-gray-300">{row.nightsOccupied}</td>
                      <td className="px-6 py-3.5 text-right font-black text-emerald-400">S/. {row.revenueGenerated.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. FREQUENT CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="border border-gray-850 rounded-xl overflow-hidden print-card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-850 text-sm">
                <thead className="bg-bg-darker/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Huésped VIP</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Nº Reservas</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Noches Hospedado</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Gastado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 bg-transparent text-gray-300">
                  {custData.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-800/10 transition">
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-white block">{row.fullname}</span>
                        <span className="text-gray-500 text-xs block mt-0.5">DNI: {row.dni}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-400">
                        <p>{row.phone}</p>
                        <p className="mt-0.5">{row.email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-white">{row.reservationsCount}</td>
                      <td className="px-6 py-3.5 text-center text-gray-300">{row.nightsStayed} noches</td>
                      <td className="px-6 py-3.5 text-right font-black text-emerald-400">S/. {row.totalSpent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. AUDIT LOG TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Audit Filters Bar (no-print) */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-bg-dark/40 border border-gray-850 p-4 rounded-xl no-print">
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Text search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por usuario o detalles..."
                      value={auditFilters.search}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                  {/* Action Dropdown */}
                  <select
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters(prev => ({ ...prev, action: e.target.value }))}
                    className="bg-gray-900 border border-gray-800 rounded-xl py-2 px-3.5 text-xs font-bold text-gray-300 focus:outline-none focus:border-primary-500 transition"
                  >
                    {ACTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-bg-darker">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={loadReportData}
                  className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <RefreshCw size={13} className="text-gray-400" />
                  <span>Actualizar</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="border border-gray-850 rounded-xl overflow-hidden print-card overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-850 text-sm">
                  <thead className="bg-bg-darker/60">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha / Hora</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 bg-transparent text-gray-300">
                    {auditData.length > 0 ? (
                      auditData.map((row: any) => (
                        <tr key={row.id} className="hover:bg-gray-800/10 transition">
                          <td className="px-6 py-3.5 font-medium text-gray-400">
                            {new Date(row.createdAt).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="font-bold text-white block">{row.user?.name}</span>
                            <span className="text-gray-500 text-xs block mt-0.5">{row.user?.role}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase inline-block ${getLogBadgeStyles(row.action)}`}>
                              {row.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-300 leading-normal max-w-md break-words">
                            {row.details}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                          No se encontraron registros de auditoría que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
