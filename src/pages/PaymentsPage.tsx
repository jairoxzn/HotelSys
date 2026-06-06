import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/api';
import { FileDown, Printer, X } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voucher modal state
  const [activePayment, setActivePayment] = useState<any>(null);
  const [showVoucher, setShowVoucher] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await paymentService.getAll();
        setPayments(data);
      } catch (err: any) {
        setError(err.message || 'Error al obtener pagos.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin glow-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
        {error}
      </div>
    );
  }

  // Calculate methods for the pie chart
  const methodsCounts = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  payments.forEach((p) => {
    const m = p.method as keyof typeof methodsCounts;
    if (methodsCounts[m] !== undefined) {
      methodsCounts[m] += p.amount;
    }
  });

  const pieData = [
    { name: 'Efectivo', value: methodsCounts.EFECTIVO, color: '#10b981' },
    { name: 'Tarjeta', value: methodsCounts.TARJETA, color: '#6366f1' },
    { name: 'Transferencia', value: methodsCounts.TRANSFERENCIA, color: '#8b5cf6' },
  ].filter((item) => item.value > 0);

  const openVoucherModal = (p: any) => {
    setActivePayment(p);
    setShowVoucher(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Pie Chart */}
        <div className="glass-card p-5 rounded-2xl border border-gray-800/50 flex flex-col justify-between">
          <h3 className="text-base font-bold text-white mb-2">Ingresos por Método</h3>
          <div className="h-44 flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
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
              <span className="text-gray-500 text-sm">Sin transacciones</span>
            )}
          </div>
          <div className="flex justify-center space-x-4 text-[10px] font-bold">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-300">{item.name} (S/. {item.value.toFixed(0)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-gray-800/50 overflow-hidden shadow-xl overflow-x-auto flex flex-col justify-between">
          <table className="min-w-full divide-y divide-gray-800/50">
            <thead className="bg-bg-darker/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Huésped</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Hab.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Método</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850 bg-transparent text-sm">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/10 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">{p.reservation.customer.fullname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-medium">Hab. {p.reservation.room.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-white">S/. {p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs font-semibold">
                    <span className="bg-gray-900/60 px-2 py-0.5 rounded border border-gray-850 uppercase tracking-wider">
                      {p.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                    {new Date(p.paymentDate).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openVoucherModal(p)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-500/15 rounded-lg transition"
                      title="Ver Comprobante"
                    >
                      <FileDown size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Voucher Modal */}
      {showVoucher && activePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-darker/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-gray-800 no-print">
            <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Comprobante de Pago</h3>
              <button
                onClick={() => setShowVoucher(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Voucher Shell */}
            <div className="p-6 space-y-6">
              <div id="print-area" className="print-card bg-bg-dark/40 border border-gray-800 p-6 rounded-2xl space-y-6 text-sm text-gray-300">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-800/50 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white leading-none">HotelFlow</h3>
                    <p className="text-xs text-gray-500 mt-1">Sistema de Gestión Hotelera</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                      PAGADO
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1.5 font-mono">ID: {activePayment.id.slice(0, 10).toUpperCase()}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 font-semibold uppercase block">Huésped</span>
                    <span className="text-white font-bold text-sm block mt-0.5">{activePayment.reservation.customer.fullname}</span>
                    <span className="text-gray-400 block mt-0.5">DNI: {activePayment.reservation.customer.dni}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 font-semibold uppercase block">Fecha Pago</span>
                    <span className="text-white font-bold block mt-0.5">
                      {new Date(activePayment.paymentDate).toLocaleDateString('es-ES')}
                    </span>
                    <span className="text-gray-400 block mt-0.5">Método: {activePayment.method}</span>
                  </div>
                </div>

                {/* Reservation Summary */}
                <div className="bg-bg-darker/40 border border-gray-850 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Habitación {activePayment.reservation.room.number} ({activePayment.reservation.room.type})</span>
                    <span className="text-white font-semibold">S/. {activePayment.reservation.room.price.toFixed(2)} / noche</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-850/50 pt-2 font-bold">
                    <span className="text-white">Total Abonado</span>
                    <span className="text-emerald-400 text-sm">S/. {activePayment.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-500 italic">
                  Gracias por hospedarse con nosotros. HotelFlow S.A.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVoucher(false)}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-750 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm shadow-md glow-primary flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer size={16} />
                  <span>Imprimir PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
