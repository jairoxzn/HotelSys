import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/api.js';
import { useConfig } from '../context/ConfigContext.js';
import { FileDown, Printer, X } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

function numberToWords(num: number): string {
  const ones = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 100) return 'CIEN';
  
  let integerPart = Math.floor(num);
  let cents = Math.round((num - integerPart) * 100);
  let centsStr = `${cents.toString().padStart(2, '0')}/100 SOLES`;

  if (integerPart === 0) return `CERO Y ${centsStr}`;

  let result = '';
  
  // Thousands
  if (integerPart >= 1000) {
    const th = Math.floor(integerPart / 1000);
    result += (th === 1 ? '' : ones[th] + ' ') + 'MIL ';
    integerPart %= 1000;
  }
  
  // Hundreds
  if (integerPart >= 100) {
    const h = Math.floor(integerPart / 100);
    if (h === 1 && integerPart % 100 === 0) {
      result += 'CIEN ';
    } else {
      result += hundreds[h] + ' ';
    }
    integerPart %= 100;
  }
  
  // Tens & Ones
  if (integerPart >= 20) {
    const t = Math.floor(integerPart / 10);
    const o = integerPart % 10;
    if (o === 0) {
      result += tens[t] + ' ';
    } else {
      result += tens[t] + ' Y ' + ones[o] + ' ';
    }
  } else if (integerPart >= 10) {
    result += teens[integerPart - 10] + ' ';
  } else if (integerPart > 0) {
    result += ones[integerPart] + ' ';
  }

  return `SON: ${result.trim()} Y ${centsStr}`;
}

export const PaymentsPage: React.FC = () => {
  const { hotelName } = useConfig();
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
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
      {showVoucher && activePayment && (() => {
        const checkIn = new Date(activePayment.reservation.checkIn);
        const checkOut = new Date(activePayment.reservation.checkOut);
        const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        const totalAmount = activePayment.amount;
        const subtotal = totalAmount / 1.18;
        const igv = totalAmount - subtotal;
        const words = numberToWords(totalAmount);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-darker/85 backdrop-blur-sm">
            <div className="glass-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-800/80 max-h-[95vh] flex flex-col animate-fadeIn">
              <div className="px-6 py-4 border-b border-gray-800/60 flex items-center justify-between flex-shrink-0 no-print">
                <h3 className="text-base font-bold text-white">Comprobante de Pago Electrónico</h3>
                <button
                  onClick={() => setShowVoucher(false)}
                  className="text-gray-450 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Printable Voucher Shell */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div id="print-area" className="print-card bg-bg-dark/40 border border-gray-800/80 p-8 rounded-2xl space-y-6 text-sm text-gray-300">
                  {/* Header Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-800/50">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md"
                          style={{ background: `linear-gradient(135deg, var(--theme-primary), #8b5cf6)` }}
                        >
                          {hotelName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white leading-tight tracking-tight">{hotelName}</h3>
                          <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Hospedaje & Confort</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-550 space-y-0.5 mt-2">
                        <p className="font-semibold text-gray-400">HOTELERA {hotelName.toUpperCase()} S.A.C.</p>
                        <p>Av. El Sol 450 - Cusco, Perú</p>
                        <p>Telf: (084) 223456 | contacto@{hotelName.toLowerCase().replace(/\s+/g, '')}.com</p>
                      </div>
                    </div>

                    <div className="flex justify-end items-start">
                      <div className="border border-primary-500/30 bg-primary-500/5 rounded-2xl p-4 text-center min-w-[220px] w-full md:w-auto shadow-sm">
                        <p className="text-xs font-bold text-gray-400">R.U.C. 20608594321</p>
                        <p className="text-xs font-black text-white uppercase mt-1.5 tracking-widest leading-none">BOLETA DE VENTA ELECTRÓNICA</p>
                        <p className="text-sm font-black text-primary-400 font-mono mt-2.5 tracking-wider">
                          B001 - {activePayment.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer and Invoice Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs py-2">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500 font-bold uppercase tracking-wider block">Señor(es):</span>
                        <span className="text-white font-bold text-sm block mt-0.5">{activePayment.reservation.customer.fullname}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase tracking-wider block">Documento (DNI/RUC):</span>
                        <span className="text-gray-300 font-semibold block mt-0.5">{activePayment.reservation.customer.dni}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase tracking-wider block">Dirección:</span>
                        <span className="text-gray-400 block mt-0.5">Av. Larco 1240 - Miraflores, Lima</span>
                      </div>
                    </div>

                    <div className="space-y-2 md:text-right">
                      <div>
                        <span className="text-gray-500 font-bold uppercase tracking-wider block md:inline-block">Fecha de Emisión:</span>
                        <span className="text-white font-bold block md:inline-block md:ml-1 mt-0.5 md:mt-0">
                          {new Date(activePayment.paymentDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase tracking-wider block md:inline-block">Moneda:</span>
                        <span className="text-white font-bold block md:inline-block md:ml-1 mt-0.5 md:mt-0">SOLES (S/.)</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase tracking-wider block md:inline-block">Método de Pago:</span>
                        <span className="text-white font-bold block md:inline-block md:ml-1 mt-0.5 md:mt-0 uppercase">{activePayment.method}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase tracking-wider block md:inline-block">Referencia Reserva:</span>
                        <span className="text-primary-400 font-mono font-bold block md:inline-block md:ml-1 mt-0.5 md:mt-0">
                          #{activePayment.reservationId.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-gray-800/80 rounded-xl overflow-hidden mt-4">
                    <table className="min-w-full divide-y divide-gray-800 text-xs">
                      <thead className="bg-bg-darker/60">
                        <tr>
                          <th className="px-4 py-3 text-center font-bold text-gray-400 uppercase tracking-wider w-16">Cant.</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-400 uppercase tracking-wider">Descripción / Concepto</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-400 uppercase tracking-wider w-28">P. Unitario</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-400 uppercase tracking-wider w-28">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850 bg-transparent text-gray-300">
                        <tr>
                          <td className="px-4 py-3.5 text-center font-semibold text-white">1</td>
                          <td className="px-4 py-3.5 leading-relaxed">
                            <span className="font-semibold text-white block">Servicio de Hospedaje en Habitación {activePayment.reservation.room.number}</span>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              Categoría: {activePayment.reservation.room.type} | Estadía: {checkIn.toLocaleDateString('es-ES')} al {checkOut.toLocaleDateString('es-ES')} ({nights} {nights === 1 ? 'noche' : 'noches'})
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold text-gray-400">S/. {totalAmount.toFixed(2)}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-white">S/. {totalAmount.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Total breakdown area */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-gray-800/40">
                    <div className="md:col-span-7 space-y-4">
                      {/* Amount in words */}
                      <div className="bg-bg-darker/40 border border-gray-850/80 px-4 py-3 rounded-xl">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Monto en letras</span>
                        <span className="text-xs font-bold text-white mt-0.5 block italic">{words}</span>
                      </div>
                      
                      {/* Notes / Tax declaration */}
                      <p className="text-[9px] text-gray-500 leading-normal">
                        Esta es una representación impresa de la boleta de venta electrónica generada en el sistema. 
                        Consulte su validez mediante el código QR adjunto. Autorizado por SUNAT.
                      </p>
                    </div>

                    <div className="md:col-span-5 space-y-2.5 text-xs">
                      <div className="flex justify-between px-2">
                        <span className="text-gray-550 font-semibold">OP. GRAVADA:</span>
                        <span className="text-gray-300 font-semibold">S/. {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-gray-550 font-semibold">I.G.V. (18%):</span>
                        <span className="text-gray-300 font-semibold">S/. {igv.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between bg-primary-500/10 border border-primary-500/20 px-4 py-2.5 rounded-xl font-bold">
                        <span className="text-white">TOTAL IMPORTE:</span>
                        <span className="text-primary-400 text-sm">S/. {totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer details (QR Code & Signature block) */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-800/50">
                    <div className="flex items-center space-x-4">
                      <svg className="w-20 h-20 text-white bg-white p-1.5 rounded-xl shadow-md flex-shrink-0" viewBox="0 0 29 29" fill="currentColor">
                        <path d="M0 0h7v7H0zm1 1v5h5V1zm22-1h7v7h-7zm1 1v5h5V1zM0 22h7v7H0zm1 1v5h5v-5zm22 0h7v7h-7zm1 1v5h5v-5zM9 0h2v2H9zm4 0h3v1h-3zm0 2h1v3h-1zm2 1h2v2h-2zm-3 2h1v2h-1zm6-5h1v3h-1zm3 1h1v2h-1zm-3 3h2v1h-2zm4-3h1v1h-1zm-1 3h2v2h-2zm-9 17h1v2H9zm2 1h1v1h-1zm3-2h3v1h-3zm0 2h1v2h-1zm2 1h1v2h-1zm-3-5h1v1h-1zm6 3h2v1h-2zm3 1h1v2h-1zm-3 2h2v1h-2zm4-3h1v1h-1zm-1 3h2v2h-2zm-9-9h2v2H9zm4 0h3v1h-3zm0 2h1v3h-1zm2 1h2v2h-2zm-3 2h1v2h-1zm6-5h1v3h-1zm3 1h1v2h-1zm-3 3h2v1h-2zm4-3h1v1h-1zm-1 3h2v2h-2z" />
                      </svg>
                      <div className="text-[10px] text-gray-550 space-y-1">
                        <p className="font-bold text-gray-400 uppercase tracking-wider">CÓDIGO HASH DE SEGURIDAD</p>
                        <p className="font-mono text-gray-400 break-all">{activePayment.id.slice(0, 12)}8Fh3zKm7xL9a2V{activePayment.id.slice(12, 16)}==</p>
                        <p>Fecha de Autorización: {new Date(activePayment.paymentDate).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>

                    <div className="text-center sm:text-right text-[10px] text-gray-550 italic space-y-1">
                      <p className="text-primary-400 font-bold not-italic">¡Gracias por tu preferencia!</p>
                      <p>Desarrollado y Soportado por {hotelName}.</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2 no-print">
                  <button
                    type="button"
                    onClick={() => setShowVoucher(false)}
                    className="px-4 py-2.5 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-sm shadow-lg hover:shadow-primary-500/20 glow-primary flex items-center space-x-2 transition cursor-pointer active:scale-95"
                  >
                    <Printer size={16} />
                    <span>Imprimir Comprobante</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
