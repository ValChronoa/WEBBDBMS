
import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { preferences } from '../api/client';

export default function CustomizationPanel({ user, layout, setLayout, onClose }) {
  const { theme, setTheme, PRESETS } = useTheme();
  const [buttons, setButtons] = useState({ add_item:'Add Item', scan:'Scan', reports:'Reports' });

  useEffect(()=>{
    if (user?.preferences?.buttons) setButtons(user.preferences.buttons);
  },[user]);

  const handleDrag = (e, idx) => {
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const handleDrop = (e, idx) => {
    const from = parseInt(e.dataTransfer.getData('text/plain'),10);
    if (Number.isNaN(from)) return;
    const arr = layout.slice();
    const [m] = arr.splice(from,1);
    arr.splice(idx,0,m);
    setLayout(arr);
  };

  const save = async () => {
    const payload = { theme, layout, buttons };
    await preferences.put(user.id, payload);
    onClose?.();
    alert('Saved your layout and theme!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-2xl p-6 shadow-2xl" style={{background:'var(--glass, rgba(255,255,255,0.08))', backdropFilter:'blur(10px)'}}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Customize dashboard</h2>
          <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20" onClick={onClose}>Close</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5">
            <h3 className="font-medium text-white mb-2">Theme</h3>
            <div className="flex gap-2">
              {Object.values(PRESETS).map(p => (
                <button key={p.name} onClick={()=>setTheme(p)} className="px-3 py-2 rounded-lg border hover:scale-105 transition"
                        style={{borderColor: p.primary, background:p.bg, color:'white'}}>
                  {p.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <h3 className="font-medium text-white mb-2">Buttons</h3>
            {['add_item','scan','reports'].map(k => (
              <label key={k} className="block text-sm text-white/80 mb-2">
                {k.replace('_',' ').toUpperCase()}
                <input className="w-full mt-1 px-3 py-2 rounded bg-white/10 text-white outline-none"
                       value={buttons[k]} onChange={e=>setButtons({...buttons, [k]: e.target.value})}/>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-white/5">
          <h3 className="font-medium text-white mb-2">Reorder Modules</h3>
          <div className="grid grid-cols-2 gap-3">
            {layout.map((m, idx)=> (
              <div key={m}
                   draggable
                   onDragStart={(e)=>handleDrag(e, idx)}
                   onDragOver={(e)=>e.preventDefault()}
                   onDrop={(e)=>handleDrop(e, idx)}
                   className="p-3 rounded-lg bg-black/30 border border-white/10 cursor-move hover:bg-black/20 text-white">
                {m}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={save} className="px-4 py-2 rounded-lg bg-[color:var(--primary)] hover:opacity-90">Save</button>
        </div>
      </div>
    </div>
  );
}
