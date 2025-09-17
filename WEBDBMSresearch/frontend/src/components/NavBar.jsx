


import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

export default function NavBar({ user, onLogout }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, PRESETS } = useTheme();
  
  // Theme cycling function
  const getNextTheme = (currentTheme) => {
    const themeNames = Object.keys(PRESETS);
    const currentIndex = themeNames.indexOf(currentTheme.name);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    return PRESETS[themeNames[nextIndex]];
  };
  
  let tabs = [];
  if (user?.role === 'technician' && user.lab) {
    // Only show their assigned lab
    const label = user.lab.charAt(0).toUpperCase() + user.lab.slice(1);
    tabs = [{ to: `/labs/${user.lab}`, label }];
  } else {
    tabs = [
      { to: "/labs/physics", label: "Physics" },
      { to: "/labs/chemistry", label: "Chemistry" },
      { to: "/labs/biology", label: "Biology" },
    ];
  }
  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-slate-900/60 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-4 py-3">
          <motion.div whileHover={{ scale: 1.05 }} className="font-bold text-xl tracking-wide cursor-pointer text-yellow-400" onClick={()=>navigate('/')}>WEBDBMS<span className="text-yellow-400">•</span></motion.div>
          <nav className="flex gap-2">
            {tabs.map(t => (
              <Link key={t.to} to={t.to} className={`px-3 py-1.5 rounded-xl hover:bg-slate-800 transition ${loc.pathname.startsWith(t.to) ? 'bg-slate-800 text-yellow-400 border-2 border-yellow-500' : ''}`}>
                {t.label}
              </Link>
            ))}
            <Link to="/reports" className={`px-3 py-1.5 rounded-xl hover:bg-slate-800 transition ${loc.pathname.startsWith('/reports') ? 'bg-slate-800 text-yellow-400 border-2 border-yellow-500' : ''}`}>Reports</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button 
              onClick={() => setTheme(getNextTheme(theme))}
              className="p-2 rounded-xl hover:bg-slate-800 text-yellow-400 transition-colors"
              title="Switch Theme"
            >
              {theme.name === 'classic' ? '🌙' : theme.name === 'royal' ? '👑' : '✨'}
            </button>
            <Link 
              to="/settings" 
              className={`p-2 rounded-xl hover:bg-slate-800 transition-colors ${
                loc.pathname.startsWith('/settings') ? 'text-yellow-400 bg-slate-800' : 'text-yellow-300'
              }`}
              title="Settings"
            >
              ⚙️
            </Link>
            <button 
              className="p-2 rounded-xl hover:bg-slate-800 text-yellow-300 hover:text-red-400 transition-colors" 
              onClick={() => { onLogout(); navigate('/login'); }}
              title="Logout"
            >
              🚪
            </button>
          </div>
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
