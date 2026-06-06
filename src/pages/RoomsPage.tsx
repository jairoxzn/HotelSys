import React, { useState, useEffect } from 'react';
import { roomService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  // Form fields
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Individual');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomStatus, setRoomStatus] = useState('DISPONIBLE');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await roomService.getAll({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setRooms(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener habitaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [statusFilter, typeFilter]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setRoomType('Individual');
    setRoomPrice('');
    setRoomStatus('DISPONIBLE');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (room: any) => {
    setEditingRoom(room);
    setRoomNumber(room.number);
    setRoomType(room.type);
    setRoomPrice(room.price.toString());
    setRoomStatus(room.status);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    if (!roomNumber || !roomType || !roomPrice) {
      setFormError('Todos los campos son obligatorios.');
      setFormLoading(false);
      return;
    }

    const priceNum = parseFloat(roomPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('El precio debe ser un número positivo.');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        number: roomNumber,
        type: roomType,
        price: priceNum,
        status: roomStatus,
      };

      if (editingRoom) {
        await roomService.update(editingRoom.id, payload);
      } else {
        await roomService.create(payload);
      }
      setShowModal(false);
      fetchRooms();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar habitación.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      await roomService.updateStatus(roomId, newStatus);
      // Inline state update
      setRooms(prev =>
        prev.map(r => (r.id === roomId ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert(err.message || 'No se pudo cambiar el estado de la habitación.');
    }
  };

  const handleDelete = async (roomId: string, roomNum: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la habitación ${roomNum}?`)) {
      return;
    }

    try {
      await roomService.delete(roomId);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la habitación.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-bg-darker/35 p-4 rounded-2xl border border-gray-800/40">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-dark text-xs font-semibold text-gray-300 border border-gray-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition appearance-none pr-8 cursor-pointer"
            >
              <option value="">Todos los Estados</option>
              <option value="DISPONIBLE">Disponibles</option>
              <option value="OCUPADA">Ocupadas</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-bg-dark text-xs font-semibold text-gray-300 border border-gray-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition appearance-none pr-8 cursor-pointer"
            >
              <option value="">Todos los Tipos</option>
              <option value="Individual">Individual</option>
              <option value="Doble">Doble</option>
              <option value="Suite">Suite</option>
              <option value="Delux">Delux</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 font-semibold text-sm text-white rounded-xl shadow-md glow-primary transition cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <Plus size={16} />
            <span>Agregar Habitación</span>
          </button>
        )}
      </div>

      {/* Grid area */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin glow-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-gray-500 glass-card rounded-2xl border border-gray-800/50">
          No se encontraron habitaciones para los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="glass-card glass-card-hover rounded-2xl p-5 border border-gray-800/50 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-white leading-none tracking-tight">Hab. {room.number}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                    room.status === 'DISPONIBLE'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : room.status === 'OCUPADA'
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {room.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{room.type}</p>
                  <p className="text-xl font-bold text-white">S/. {room.price.toFixed(2)} <span className="text-xs text-gray-500 font-normal">/ noche</span></p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-5 pt-3.5 border-t border-gray-800/40 flex items-center justify-between gap-3">
                {/* Status Switcher (for admins & receptionists) */}
                <div className="flex-1">
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, e.target.value)}
                    className="w-full bg-bg-dark border border-gray-850 hover:border-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer font-medium"
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="OCUPADA" disabled>Ocupada</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                  </select>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(room)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition"
                      title="Editar Habitación"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id, room.number)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition"
                      title="Eliminar Habitación"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-darker/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3.5 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">Número de Habitación</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Ej: 101"
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Tipo de Habitación</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Doble">Doble</option>
                    <option value="Suite">Suite</option>
                    <option value="Delux">Delux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Precio / Noche</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(e.target.value)}
                    placeholder="Ej: 45.00"
                    className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Estado Inicial</label>
                <select
                  value={roomStatus}
                  onChange={(e) => setRoomStatus(e.target.value)}
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer"
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="OCUPADA">Ocupada</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-750 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm shadow-md glow-primary transition disabled:opacity-50"
                >
                  {formLoading ? 'Guardando...' : 'Guardar Habitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
