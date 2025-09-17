
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

// Helper function to adjust color brightness
function adjustColor(hex, percent) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, Math.max(0, r + (r * percent / 100)));
  g = Math.min(255, Math.max(0, g + (g * percent / 100)));
  b = Math.min(255, Math.max(0, b + (b * percent / 100)));

  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

// Theme cycling function
function getNextTheme(currentTheme) {
  const themeNames = Object.keys(PRESETS);
  const currentIndex = themeNames.indexOf(currentTheme.name);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  return PRESETS[themeNames[nextIndex]];
}

const PRESETS = {
  classic: { 
    name: 'classic', 
    primary: '#EAB308',    // Gold
    accent: '#1E3A8A',     // Dark blue
    bg: '#0F172A',         // Slate-900
    glass: 'rgba(30, 58, 138, 0.4)' // Dark blue with transparency
  },
  royal: { 
    name: 'royal', 
    primary: '#FCD34D',    // Warmer gold
    accent: '#1E40AF',     // Brighter blue
    bg: '#1E293B',         // Slate-800
    glass: 'rgba(30, 64, 175, 0.4)' // Royal blue with transparency
  },
  midnight: { 
    name: 'midnight', 
    primary: '#F59E0B',    // Amber gold
    accent: '#0F172A',     // Darker blue
    bg: '#020617',         // Slate-950
    glass: 'rgba(15, 23, 42, 0.4)' // Midnight blue with transparency
  }
};

export function ThemeProvider({ children, initial }) {
  const [theme, setTheme] = useState(PRESETS[initial?.name] || PRESETS['classic']);
  useEffect(()=>{
    // Set the main theme colors
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--glass', theme.glass);
    
    // Set derived colors for better theme integration
    document.documentElement.style.setProperty('--primary-light', adjustColor(theme.primary, 20));
    document.documentElement.style.setProperty('--primary-dark', adjustColor(theme.primary, -20));
    document.documentElement.style.setProperty('--accent-light', adjustColor(theme.accent, 20));
    document.documentElement.style.setProperty('--accent-dark', adjustColor(theme.accent, -20));
    
    // Set background
    document.body.style.background = theme.bg;
  },[theme]);
  return <ThemeCtx.Provider value={{ theme, setTheme, PRESETS }}>{children}</ThemeCtx.Provider>
}
