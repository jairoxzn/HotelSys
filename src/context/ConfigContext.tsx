import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { configService } from '../services/api';

interface SystemConfig {
  id: string;
  hotelName: string;
  primaryColor: string;
  updatedAt: string;
}

interface ConfigContextType {
  hotelName: string;
  primaryColor: string;
  configLoaded: boolean;
  updateConfig: (data: { hotelName?: string; primaryColor?: string }) => Promise<void>;
  previewColor: (color: string) => void;
  resetPreview: () => void;
}

const CONFIG_STORAGE_KEY = 'hotelflow_config';

const DEFAULT_CONFIG = {
  hotelName: 'HotelFlow',
  primaryColor: '#6366f1',
};

// ────────────────────────────────────────────────────────────────
// Color Math Helper — generates a full palette from a single hex
// ────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function applyThemeColor(primaryColor: string) {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return;

  const hover = darken(primaryColor, 0.12);
  const dark = darken(primaryColor, 0.22);
  const glow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
  const soft = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const softer = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`;
  const border = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
  const text80 = lighten(primaryColor, 0.15);

  const root = document.documentElement;
  root.style.setProperty('--theme-primary', primaryColor);
  root.style.setProperty('--theme-primary-hover', hover);
  root.style.setProperty('--theme-primary-dark', dark);
  root.style.setProperty('--theme-primary-glow', glow);
  root.style.setProperty('--theme-primary-soft', soft);
  root.style.setProperty('--theme-primary-softer', softer);
  root.style.setProperty('--theme-primary-border', border);
  root.style.setProperty('--theme-primary-text80', text80);
}

// ────────────────────────────────────────────────────────────────
// Context Setup
// ────────────────────────────────────────────────────────────────
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Apply cached config immediately to avoid FOUC (Flash of Unstyled Color)
  const cached = (() => {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  })();

  const [hotelName, setHotelName] = useState<string>(cached.hotelName || DEFAULT_CONFIG.hotelName);
  const [primaryColor, setPrimaryColor] = useState<string>(cached.primaryColor || DEFAULT_CONFIG.primaryColor);
  const [savedColor, setSavedColor] = useState<string>(cached.primaryColor || DEFAULT_CONFIG.primaryColor);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Apply theme immediately from cached value
  useEffect(() => {
    applyThemeColor(primaryColor);
  }, []);

  // Fetch config from backend on first load
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config: SystemConfig = await configService.get();
        setHotelName(config.hotelName);
        setPrimaryColor(config.primaryColor);
        setSavedColor(config.primaryColor);
        applyThemeColor(config.primaryColor);
        localStorage.setItem(
          CONFIG_STORAGE_KEY,
          JSON.stringify({ hotelName: config.hotelName, primaryColor: config.primaryColor })
        );
      } catch (err) {
        console.warn('Could not fetch system config, using cached/default values.');
      } finally {
        setConfigLoaded(true);
      }
    };

    loadConfig();
  }, []);

  const updateConfig = useCallback(async (data: { hotelName?: string; primaryColor?: string }) => {
    const updated = await configService.update(data);
    if (updated.hotelName) setHotelName(updated.hotelName);
    if (updated.primaryColor) {
      setPrimaryColor(updated.primaryColor);
      setSavedColor(updated.primaryColor);
      applyThemeColor(updated.primaryColor);
    }
    localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({ hotelName: updated.hotelName, primaryColor: updated.primaryColor })
    );
  }, []);

  // Live preview — apply color temporarily without saving
  const previewColor = useCallback((color: string) => {
    setPrimaryColor(color);
    applyThemeColor(color);
  }, []);

  // Reset preview — revert to the last saved color
  const resetPreview = useCallback(() => {
    setPrimaryColor(savedColor);
    applyThemeColor(savedColor);
  }, [savedColor]);

  return (
    <ConfigContext.Provider value={{ hotelName, primaryColor, configLoaded, updateConfig, previewColor, resetPreview }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig debe usarse dentro de un ConfigProvider');
  }
  return context;
};
