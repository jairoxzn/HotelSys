import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Save, Palette, Building2, CheckCircle2, RotateCcw, Eye } from 'lucide-react';

// Premium curated color presets
const COLOR_PRESETS = [
  { name: 'Índigo', value: '#6366f1', label: 'Por Defecto' },
  { name: 'Violeta', value: '#8b5cf6', label: 'Violeta Profundo' },
  { name: 'Esmeralda', value: '#10b981', label: 'Esmeralda' },
  { name: 'Sky', value: '#0ea5e9', label: 'Cielo Azul' },
  { name: 'Rosa', value: '#ec4899', label: 'Rosa Vivo' },
  { name: 'Ámbar', value: '#f59e0b', label: 'Ámbar Dorado' },
  { name: 'Naranja', value: '#f97316', label: 'Naranja Coral' },
  { name: 'Rojo', value: '#ef4444', label: 'Rojo Clásico' },
  { name: 'Cian', value: '#06b6d4', label: 'Cian Neon' },
  { name: 'Lima', value: '#84cc16', label: 'Lima Verde' },
];

export const SettingsPage: React.FC = () => {
  const { hotelName, primaryColor, updateConfig, previewColor, resetPreview } = useConfig();

  const [localName, setLocalName] = useState(hotelName);
  const [localColor, setLocalColor] = useState(primaryColor);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when config changes externally
  useEffect(() => {
    setLocalName(hotelName);
    setLocalColor(primaryColor);
  }, [hotelName, primaryColor]);

  const handleColorSelect = (color: string) => {
    setLocalColor(color);
    if (previewMode) {
      previewColor(color);
    }
  };

  const handleHexInput = (value: string) => {
    setLocalColor(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value) && previewMode) {
      previewColor(value);
    }
  };

  const handleTogglePreview = () => {
    if (previewMode) {
      // Turning off preview — reset to saved color
      resetPreview();
      setLocalColor(primaryColor);
      setPreviewMode(false);
    } else {
      // Turning on preview — apply current localColor
      previewColor(localColor);
      setPreviewMode(true);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateConfig({ hotelName: localName, primaryColor: localColor });
      setPreviewMode(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetPreview();
    setLocalName(hotelName);
    setLocalColor(primaryColor);
    setPreviewMode(false);
  };

  const hasChanges = localName !== hotelName || localColor !== primaryColor;

  // Derive contrasting text color for preview badge
  const previewLetterCode = localName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Personalización del Sistema</h2>
          <p className="text-sm text-gray-400 mt-1">
            Configura el nombre del hotel y los colores de toda la plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 border border-gray-700 hover:text-white hover:border-gray-600 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              Descartar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shadow-lg ${
              savedSuccess
                ? 'bg-emerald-500 text-white'
                : hasChanges
                ? 'bg-primary-500 text-white hover:bg-primary-600 glow-primary'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 size={16} />
                ¡Guardado!
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hotel Name Card */}
          <div className="glass-card p-6 rounded-2xl border border-gray-800/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Building2 size={18} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nombre del Hotel</h3>
                <p className="text-xs text-gray-500 mt-0.5">Se mostrará en el logo, títulos y documentos.</p>
              </div>
            </div>
            <input
              type="text"
              id="hotel-name-input"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              maxLength={40}
              placeholder="Nombre de tu hotel..."
              className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-semibold placeholder-gray-600 focus:outline-none focus:border-primary-500 transition"
            />
            <p className="text-xs text-gray-600 mt-2">{localName.length}/40 caracteres</p>
          </div>

          {/* Color Theme Card */}
          <div className="glass-card p-6 rounded-2xl border border-gray-800/50">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-500/10 rounded-xl">
                  <Palette size={18} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Color Principal del Sistema</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Afecta botones, resaltados, barras de navegación y gráficos.</p>
                </div>
              </div>
              <button
                onClick={handleTogglePreview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  previewMode
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <Eye size={13} />
                {previewMode ? 'Vista Previa ON' : 'Vista Previa'}
              </button>
            </div>

            {/* Preset Color Grid */}
            <div className="grid grid-cols-5 gap-3 mb-5">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = localColor.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    onClick={() => handleColorSelect(preset.value)}
                    title={preset.label}
                    className={`group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-white/40 bg-white/5 scale-105'
                        : 'border-gray-800/80 hover:border-gray-600 hover:bg-gray-800/30'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg shadow-md transition-transform group-hover:scale-110 ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''}`}
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="text-[10px] font-semibold text-gray-400 text-center leading-tight">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom hex picker */}
            <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3">
              <label htmlFor="color-picker" className="cursor-pointer flex-shrink-0">
                <span
                  className="block w-9 h-9 rounded-lg shadow-md border-2 border-white/20 cursor-pointer hover:scale-105 transition"
                  style={{ backgroundColor: localColor }}
                />
                <input
                  id="color-picker"
                  type="color"
                  value={localColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="sr-only"
                />
              </label>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Color Personalizado (Hex)</label>
                <input
                  type="text"
                  value={localColor}
                  onChange={(e) => handleHexInput(e.target.value)}
                  placeholder="#6366f1"
                  maxLength={7}
                  className="w-full bg-transparent text-white text-sm font-mono font-semibold focus:outline-none placeholder-gray-700"
                />
              </div>
              {/^#[0-9A-Fa-f]{6}$/.test(localColor) && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Válido
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right — Live Preview Panel */}
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-gray-800/50 sticky top-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Vista Previa en Vivo</h3>

            {/* Mini sidebar preview */}
            <div className="rounded-xl overflow-hidden border border-gray-700/50 bg-gray-900">
              {/* Mini header */}
              <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2"
                style={{ background: 'rgba(8, 9, 12, 0.95)' }}>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-black shadow"
                  style={{ background: `linear-gradient(135deg, ${localColor}, #8b5cf6)` }}
                >
                  {previewLetterCode}
                </div>
                <span className="text-xs font-bold text-white truncate">{localName || 'Mi Hotel'}</span>
              </div>

              {/* Mini nav items */}
              <div className="p-2 space-y-1">
                {['Dashboard', 'Habitaciones', 'Reservas'].map((name, i) => (
                  <div
                    key={name}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition`}
                    style={
                      i === 0
                        ? {
                            background: `${localColor}18`,
                            color: localColor,
                            borderLeft: `3px solid ${localColor}`,
                          }
                        : { color: '#6b7280' }
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: i === 0 ? localColor : '#374151' }}
                    />
                    {name}
                  </div>
                ))}
              </div>

              {/* Mini button */}
              <div className="px-3 pb-3">
                <button
                  className="w-full py-2 rounded-lg text-xs font-bold text-white transition shadow-md"
                  style={{
                    background: localColor,
                    boxShadow: `0 0 12px ${localColor}55`,
                  }}
                >
                  Nueva Reserva
                </button>
              </div>
            </div>

            {/* Color chip info */}
            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-900/60 rounded-xl border border-gray-800">
              <span
                className="w-8 h-8 rounded-lg flex-shrink-0 shadow"
                style={{ background: localColor }}
              />
              <div>
                <p className="text-xs font-bold text-white">{COLOR_PRESETS.find(p => p.value === localColor)?.label || 'Personalizado'}</p>
                <p className="text-[10px] font-mono text-gray-500">{localColor.toUpperCase()}</p>
              </div>
            </div>

            {previewMode && (
              <div className="mt-3 text-center">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Vista previa activa en toda la UI
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
