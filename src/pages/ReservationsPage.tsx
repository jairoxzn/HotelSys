import React, { useState, useEffect } from 'react';
import { reservationService, roomService, customerService, paymentService } from '../services/api';
import { Calendar, Plus, CreditCard, ChevronRight, X, ArrowDownRight, Trash2 } from 'lucide-react';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form Booking fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [initialStatus, setInitialStatus] = useState('PENDIENTE');
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  // Form Payment fields
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('EFECTIVO');

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [timelineDays] = useState(15);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [resData, roomData, custData] = await Promise.all([
        reservationService.getAll({ status: statusFilter || undefined }),
        roomService.getAll(),
        customerService.getAll(),
      ]);
      setReservations(resData);
      setRooms(roomData);
      setCustomers(custData);
    } catch (err: any) {
      setError(err.message || 'Error al obtener reservaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  // Dynamically load available rooms when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);

      if (inDate < outDate) {
        // Filter rooms that do not have booking overlaps in those dates
        const checkAvailability = async () => {
          try {
            // Get all reservations to compare overlaps manually
            const allRes = await reservationService.getAll();
            const bookedRoomIds = allRes
              .filter((res: any) => {
                if (res.status === 'CANCELADA') return false;
                const resIn = new Date(res.checkIn);
                const resOut = new Date(res.checkOut);
                return resIn < outDate && resOut > inDate;
              })
              .map((res: any) => res.roomId);

            // Fetch available rooms that are not in maintenance and not booked
            const freeRooms = rooms.filter(
              (room: any) => room.status !== 'MANTENIMIENTO' && !bookedRoomIds.includes(room.id)
            );
            setAvailableRooms(freeRooms);
          } catch (e) {
            console.error('Error checking room availability', e);
          }
        };
        checkAvailability();
      } else {
        setAvailableRooms([]);
      }
    } else {
      setAvailableRooms([]);
    }
  }, [checkIn, checkOut, rooms]);

  const openBookingModal = (roomId?: string, checkInDate?: Date) => {
    setSelectedCustomerId('');
    setSelectedRoomId(roomId || '');
    if (checkInDate) {
      const year = checkInDate.getFullYear();
      const month = String(checkInDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkInDate.getDate()).padStart(2, '0');
      setCheckIn(`${year}-${month}-${day}`);
      
      const nextDay = new Date(checkInDate);
      nextDay.setDate(checkInDate.getDate() + 1);
      const nextYear = nextDay.getFullYear();
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nextDayStr = String(nextDay.getDate()).padStart(2, '0');
      setCheckOut(`${nextYear}-${nextMonth}-${nextDayStr}`);
    } else {
      setCheckIn('');
      setCheckOut('');
    }
    setInitialStatus('PENDIENTE');
    setFormError(null);
    setShowFormModal(true);
  };

  const getTimelinePosition = (resInStr: string, resOutStr: string) => {
    const resIn = new Date(resInStr);
    resIn.setHours(0, 0, 0, 0);
    const resOut = new Date(resOutStr);
    resOut.setHours(0, 0, 0, 0);
    
    const tStart = timelineStartDate.getTime();
    const tEnd = tStart + timelineDays * 24 * 60 * 60 * 1000;
    
    const rIn = resIn.getTime();
    const rOut = resOut.getTime();

    if (rOut <= tStart || rIn >= tEnd) {
      return null;
    }

    const start = Math.max(rIn, tStart);
    const end = Math.min(rOut, tEnd);

    const leftPercent = ((start - tStart) / (tEnd - tStart)) * 100;
    const widthPercent = ((end - start) / (tEnd - tStart)) * 100;

    return { left: leftPercent, width: widthPercent };
  };

  const dates: Date[] = [];
  for (let i = 0; i < timelineDays; i++) {
    const d = new Date(timelineStartDate);
    d.setDate(timelineStartDate.getDate() + i);
    dates.push(d);
  }

  const openRegisterPayment = (res: any) => {
    setActiveReservation(res);
    // Auto-calculate pending balance
    const totalPaid = res.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
    const pending = res.total - totalPaid;
    setPayAmount(pending.toFixed(2));
    setPayMethod('EFECTIVO');
    setFormError(null);
    setShowPaymentModal(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    if (!selectedCustomerId || !selectedRoomId || !checkIn || !checkOut) {
      setFormError('Todos los campos son obligatorios.');
      setFormLoading(false);
      return;
    }

    try {
      await reservationService.create({
        customerId: selectedCustomerId,
        roomId: selectedRoomId,
        checkIn,
        checkOut,
        status: initialStatus,
      });
      setShowFormModal(false);
      loadAll();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la reservación.');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    if (!payAmount) {
      setFormError('El monto de pago es obligatorio.');
      setFormLoading(false);
      return;
    }

    const payNum = parseFloat(payAmount);
    if (isNaN(payNum) || payNum <= 0) {
      setFormError('El monto debe ser un valor positivo.');
      setFormLoading(false);
      return;
    }

    try {
      await paymentService.create({
        reservationId: activeReservation.id,
        amount: payNum,
        method: payMethod,
      });
      setShowPaymentModal(false);
      loadAll();
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar el pago.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCheckIn = async (resId: string) => {
    try {
      await reservationService.checkIn(resId);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error al realizar check-in.');
    }
  };

  const handleCheckOut = async (res: any) => {
    // Audit if fully paid
    const totalPaid = res.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
    if (totalPaid < res.total) {
      const confirmPay = window.confirm(
        `La reserva tiene un saldo pendiente de S/. ${(res.total - totalPaid).toFixed(2)}. ¿Deseas registrar el pago ahora para completar el check-out?`
      );
      if (confirmPay) {
        openRegisterPayment(res);
      }
      return;
    }

    try {
      await reservationService.checkOut(res.id);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error al realizar check-out.');
    }
  };

  const handleCancel = async (resId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return;
    }

    try {
      await reservationService.cancel(resId);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la reserva.');
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
              <option value="">Todas las Reservas</option>
              <option value="PENDIENTE">Pendientes (Check-in hoy)</option>
              <option value="CONFIRMADA">Confirmadas / Activas</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-bg-dark border border-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'timeline' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Cronograma
            </button>
          </div>
        </div>

        <button
          onClick={() => openBookingModal()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 font-semibold text-sm text-white rounded-xl shadow-md glow-primary transition cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} />
          <span>Nueva Reservación</span>
        </button>
      </div>

      {/* Date Navigation for Cronograma */}
      {viewMode === 'timeline' && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-darker/35 px-4 py-3.5 rounded-2xl border border-gray-800/40 mb-2 no-print">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                const d = new Date(timelineStartDate);
                d.setDate(d.getDate() - 7);
                setTimelineStartDate(d);
              }}
              className="px-3 py-1.5 bg-bg-dark border border-gray-850 hover:border-gray-800 text-xs text-gray-300 rounded-xl font-semibold cursor-pointer transition"
            >
              Anterior
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setHours(0,0,0,0);
                setTimelineStartDate(d);
              }}
              className="px-3 py-1.5 bg-bg-dark border border-gray-850 hover:border-gray-800 text-xs text-gray-300 rounded-xl font-semibold cursor-pointer transition"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const d = new Date(timelineStartDate);
                d.setDate(d.getDate() + 7);
                setTimelineStartDate(d);
              }}
              className="px-3 py-1.5 bg-bg-dark border border-gray-850 hover:border-gray-800 text-xs text-gray-300 rounded-xl font-semibold cursor-pointer transition"
            >
              Siguiente
            </button>
          </div>

          <div className="text-xs text-gray-400 font-bold bg-bg-dark px-3.5 py-2 rounded-xl border border-gray-850">
            Mostrando desde:{' '}
            <span className="text-white">
              {timelineStartDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {/* Booking List or Gantt Timeline */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin glow-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
          {error}
        </div>
      ) : viewMode === 'list' ? (
        // LIST VIEW (Original Code)
        reservations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 glass-card rounded-2xl border border-gray-800/50">
            No se encontraron reservaciones registradas.
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => {
              const totalPaid = res.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
              const pending = res.total - totalPaid;
              const isFullyPaid = pending <= 0.05;

              return (
                <div
                  key={res.id}
                  className="glass-card rounded-2xl p-5 border border-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-gray-800 transition"
                >
                  {/* Details Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                    {/* Guest and Room */}
                    <div>
                      <h4 className="text-base font-extrabold text-white">{res.customer.fullname}</h4>
                      <p className="text-xs text-gray-400 mt-1 font-semibold">Habitación {res.room.number} ({res.room.type})</p>
                      <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-1 block">
                        Por: {res.user.name}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center space-x-2.5 text-xs text-gray-300">
                      <Calendar size={16} className="text-primary-500 flex-shrink-0" />
                      <div>
                        <p><span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wide block">Check-in</span> {new Date(res.checkIn).toLocaleDateString('es-ES')}</p>
                        <p className="mt-1"><span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wide block">Check-out</span> {new Date(res.checkOut).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>

                    {/* Billing status */}
                    <div className="text-xs">
                      <p className="text-gray-400 font-medium">Costo Total: <span className="font-bold text-white">S/. {res.total.toFixed(2)}</span></p>
                      <p className="mt-1 text-gray-400 font-medium">
                        Pagado:{' '}
                        <span className={`font-bold ${isFullyPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                          S/. {totalPaid.toFixed(2)}
                        </span>
                      </p>
                      {!isFullyPaid && (
                        <p className="mt-0.5 text-[10px] text-gray-500 font-medium italic">Resta pagar S/. {pending.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Badges & Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-3.5 border-t md:border-t-0 pt-4 md:pt-0 border-gray-800/40 justify-between md:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
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

                    <div className="flex items-center space-x-2">
                      {/* Process Payments */}
                      {!isFullyPaid && res.status !== 'CANCELADA' && (
                        <button
                          onClick={() => openRegisterPayment(res)}
                          className="p-2 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-xl transition font-semibold text-xs flex items-center space-x-1"
                          title="Registrar Pago"
                        >
                          <CreditCard size={14} />
                          <span className="hidden sm:inline">Pagar</span>
                        </button>
                      )}

                      {/* Check-In */}
                      {res.status === 'PENDIENTE' && (
                        <button
                          onClick={() => handleCheckIn(res.id)}
                          className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition flex items-center"
                        >
                          <span>Check-in</span>
                          <ChevronRight size={14} className="ml-0.5" />
                        </button>
                      )}

                      {/* Check-Out */}
                      {res.status === 'CONFIRMADA' && (
                        <button
                          onClick={() => handleCheckOut(res)}
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center"
                        >
                          <span>Check-out</span>
                          <ChevronRight size={14} className="ml-0.5" />
                        </button>
                      )}

                      {/* Cancel Booking */}
                      {(res.status === 'PENDIENTE' || res.status === 'CONFIRMADA') && (
                        <button
                          onClick={() => handleCancel(res.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition font-semibold text-xs"
                          title="Cancelar Reserva"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // TIMELINE GANTT VIEW
        <div className="glass-card rounded-2xl border border-gray-800/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {/* Header dates row */}
            <div className="flex min-w-[1000px] border-b border-gray-800/60 bg-bg-darker/20">
              <div className="w-[140px] flex-shrink-0 sticky left-0 bg-[#12131b] z-20 border-r border-gray-800 p-4 text-xs font-black text-gray-400 flex items-center">
                Habitación
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(15, minmax(80px, 1fr))' }}>
                {dates.map((date, index) => {
                  const dayNum = date.getDate();
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div
                      key={index}
                      className={`p-3 text-center flex flex-col items-center justify-center border-r border-gray-850 min-w-[80px] ${
                        isToday ? 'bg-primary-500/5 text-primary-400 font-bold' : 'text-gray-400'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-extrabold tracking-wider leading-none">{dayName}</span>
                      <span className={`text-sm font-black mt-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-primary-500 text-white glow-primary' : ''
                      }`}>
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Rows Grid */}
            <div className="min-w-[1000px] divide-y divide-gray-850">
              {rooms.map((room) => {
                const roomReservations = reservations.filter(
                  (res) => res.roomId === room.id && res.status !== 'CANCELADA'
                );

                return (
                  <div key={room.id} className="flex h-20 items-stretch relative group">
                    {/* Sticky Room Info */}
                    <div className="w-[140px] flex-shrink-0 sticky left-0 bg-[#12131b] z-10 border-r border-gray-800 p-4 flex flex-col justify-center shadow-lg">
                      <span className="text-sm font-black text-white leading-none">Hab. {room.number}</span>
                      <span className="text-[9px] text-gray-500 uppercase font-semibold mt-1 tracking-wider">{room.type}</span>
                      <span className="text-[10px] text-primary-300 mt-1 font-bold">S/. {room.price.toFixed(0)}</span>
                    </div>

                    {/* Timeline row cells & blocks */}
                    <div className="flex-1 grid relative" style={{ gridTemplateColumns: 'repeat(15, minmax(80px, 1fr))' }}>
                      {/* Background Day Cells */}
                      {dates.map((date, index) => (
                        <div
                          key={index}
                          onClick={() => openBookingModal(room.id, date)}
                          className="border-r border-gray-850/40 hover:bg-gray-800/10 transition cursor-pointer flex items-center justify-center group/cell"
                          title="Haz clic para reservar en esta fecha"
                        >
                          <span className="opacity-0 group-hover/cell:opacity-100 text-[11px] text-primary-400 font-black transition">+</span>
                        </div>
                      ))}

                      {/* Overlaid Reservation Bars */}
                      {roomReservations.map((res) => {
                        const pos = getTimelinePosition(res.checkIn, res.checkOut);
                        if (!pos) return null;

                        const totalPaid = res.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
                        const pending = res.total - totalPaid;
                        const isFullyPaid = pending <= 0.05;

                        let statusColors = 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/15';
                        if (res.status === 'CONFIRMADA') {
                          statusColors = 'bg-primary-500/10 border-primary-500/30 text-primary-300 hover:border-primary-400 hover:bg-primary-500/15';
                        } else if (res.status === 'COMPLETADA') {
                          statusColors = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/15';
                        }

                        return (
                          <div
                            key={res.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openRegisterPayment(res);
                            }}
                            className={`absolute top-3 bottom-3 rounded-xl border flex flex-col justify-center px-3 py-1 cursor-pointer transition select-none overflow-hidden shadow-lg ${statusColors}`}
                            style={{
                              left: `calc(${pos.left}% + 4px)`,
                              width: `calc(${pos.width}% - 8px)`,
                              zIndex: 5,
                            }}
                          >
                            <span className="text-[11px] font-extrabold truncate block leading-none">{res.customer.fullname}</span>
                            <span className="text-[9px] font-medium opacity-80 mt-1.5 block truncate leading-none">
                              {res.status === 'CONFIRMADA' ? 'CONFIRMADA' : res.status} • {isFullyPaid ? 'Completo' : `Resta S/. ${pending.toFixed(0)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-darker/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Nueva Reservación</h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3.5 rounded-xl">
                  {formError}
                </div>
              )}

              {/* Select Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Seleccionar Huésped</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer"
                >
                  <option value="">-- Seleccione un Huésped --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullname} ({c.dni})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Fecha Check-in</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Fecha Check-out</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Seleccionar Habitación{' '}
                  {checkIn && checkOut && (
                    <span className="text-xs text-gray-500 font-semibold italic">
                      ({availableRooms.length} libres encontradas)
                    </span>
                  )}
                </label>
                <select
                  required
                  disabled={!checkIn || !checkOut || availableRooms.length === 0}
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!checkIn || !checkOut ? (
                    <option value="">-- Ingrese fechas de estancia primero --</option>
                  ) : availableRooms.length === 0 ? (
                    <option value="">-- No hay habitaciones disponibles en estas fechas --</option>
                  ) : (
                    <>
                      <option value="">-- Seleccione una Habitación --</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          Hab. {room.number} - {room.type} (S/. {room.price.toFixed(2)}/noche)
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Estado de Reserva</label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value)}
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer"
                >
                  <option value="PENDIENTE">Pendiente (Sin Check-in)</option>
                  <option value="CONFIRMADA">Confirmada (Huésped ingresa ahora)</option>
                </select>
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
                  {formLoading ? 'Guardando...' : 'Crear Reservación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentModal && activeReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-darker/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ArrowDownRight size={18} className="text-emerald-500" />
                <span>Registrar Pago</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3.5 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="text-sm bg-gray-900/30 border border-gray-850 p-4 rounded-xl space-y-1">
                <p className="text-gray-400">Huésped: <span className="font-semibold text-white">{activeReservation.customer.fullname}</span></p>
                <p className="text-gray-400">Total Reservación: <span className="font-bold text-white">S/. {activeReservation.total.toFixed(2)}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Monto de Pago (S/.)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Ej: 50.00"
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="mt-1.5 block w-full bg-bg-dark border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition cursor-pointer"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta de Crédito / Débito</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-750 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-md glow-emerald transition disabled:opacity-50"
                >
                  {formLoading ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
