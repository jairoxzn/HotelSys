import React, { useState, useEffect } from 'react';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Edit2, Eye, Trash2, X, Phone, Mail, FileText } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [viewingHistory, setViewingHistory] = useState<any>(null);

  // Form fields
  const [fullname, setFullname] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll(searchQuery || undefined);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 350); // debounce queries for speed

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFullname('');
    setDni('');
    setPhone('');
    setEmail('');
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    setFullname(c.fullname);
    setDni(c.dni);
    setPhone(c.phone);
    setEmail(c.email);
    setFormError(null);
    setShowFormModal(true);
  };

  const openHistoryModal = async (c: any) => {
    try {
      // Get detailed customer profile with reservations list
      const details = await customerService.getById(c.id);
      setViewingHistory(details);
      setShowHistoryModal(true);
    } catch (err: any) {
      alert(err.message || 'Error al cargar el historial del cliente.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    if (!fullname || !dni || !phone || !email) {
      setFormError('Todos los campos son obligatorios.');
      setFormLoading(false);
      return;
    }

    try {
      const payload = { fullname, dni, phone, email };
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, payload);
      } else {
        await customerService.create(payload);
      }
      setShowFormModal(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar cliente.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (cId: string, cName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${cName}?`)) {
      return;
    }

    try {
      await customerService.delete(cId);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el cliente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-bg-darker/35 p-4 rounded-2xl border border-gray-800/40">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Buscar por Nombre, DNI, Teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-bg-dark border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 font-semibold text-sm text-white rounded-xl shadow-md glow-primary transition cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} />
          <span>Registrar Huésped</span>
        </button>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin glow-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
          {error}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-500 glass-card rounded-2xl border border-gray-800/50">
          No se encontraron huéspedes registrados.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-gray-800/50 shadow-xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800/50">
            <thead className="bg-bg-darker/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Huésped</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">DNI / ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Teléfono</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850 bg-transparent text-sm">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/10 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">{c.fullname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300 font-medium">{c.dni}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">{c.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">{c.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => openHistoryModal(c)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                      title="Historial de Estadías"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                      title="Editar Huésped"
                    >
                      <Edit2 size={14} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(c.id, c.fullname)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition"
                        title="Eliminar Huésped"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-darker/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingCustomer ? 'Editar Ficha Huésped' : 'Registrar Huésped'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3.5 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">DNI / Cédula / Pasaporte</label>
                <input
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 12345678A"
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +34 600 111 222"
                    className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: juan.perez@example.com"
                    className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-750 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm shadow-md glow-primary transition disabled:opacity-50"
                >
                  {formLoading ? 'Guardando...' : 'Registrar Huésped'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && viewingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-darker/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Historial de Estadías</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Profile Card Summary */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between bg-gray-900/30 border border-gray-850 p-4 rounded-xl text-sm">
                <div>
                  <h4 className="text-base font-extrabold text-white">{viewingHistory.fullname}</h4>
                  <p className="text-gray-400 text-xs mt-1">DNI/ID: {viewingHistory.dni}</p>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center space-x-1.5">
                    <Phone size={12} className="text-primary-500" />
                    <span>{viewingHistory.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Mail size={12} className="text-primary-500" />
                    <span>{viewingHistory.email}</span>
                  </div>
                </div>
              </div>

              {/* Reservations History Grid */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-1.5">
                  <FileText size={16} className="text-primary-500" />
                  <span>Estadías y Reservaciones ({viewingHistory.reservations.length})</span>
                </h4>

                {viewingHistory.reservations.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-xs bg-gray-900/10 border border-gray-850/50 rounded-xl">
                    Este cliente aún no registra reservaciones en el hotel.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {viewingHistory.reservations.map((res: any) => (
                      <div
                        key={res.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-900/20 border border-gray-850 rounded-xl text-xs gap-3"
                      >
                        <div>
                          <span className="font-bold text-white block">Habitación {res.room.number} ({res.room.type})</span>
                          <span className="text-gray-400 mt-1 block">
                            {new Date(res.checkIn).toLocaleDateString('es-ES')} - {new Date(res.checkOut).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            res.status === 'COMPLETADA'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : res.status === 'CONFIRMADA'
                              ? 'bg-primary-500/10 text-primary-400'
                              : res.status === 'CANCELADA'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {res.status}
                          </span>
                          <span className="font-bold text-white block">${res.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
