
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoleculeBackground from './MoleculeBackground';
import CustomizationPanel from './CustomizationPanel';
import { api, preferences } from '../api/client';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';





const MODULES = {
  quick_actions: ({me, navigate}) => {
    // Context-aware quick actions
    const actions = [];
    // Add lab navigation buttons based on role
    if (me?.role === 'admin') {
      // Admin sees all labs
      actions.push({ label: 'Physics Lab', onClick: () => navigate('/labs/physics') });
      actions.push({ label: 'Biology Lab', onClick: () => navigate('/labs/biology') });
      actions.push({ label: 'Chemistry Lab', onClick: () => navigate('/labs/chemistry') });
      actions.push({ label: 'Manage Users', onClick: () => navigate('/settings') });
      actions.push({ label: 'View All Borrow Requests', onClick: () => navigate('/') });
    }
    else if (me?.role === 'technician' && me.lab) {
      // Technician only sees their assigned lab
      const labName = me.lab.charAt(0).toUpperCase() + me.lab.slice(1);
      actions.push({ label: `${labName} Lab Inventory`, onClick: () => navigate(`/labs/${me.lab}`) });
      actions.push({ label: 'View Borrow Requests', onClick: () => navigate('/') });
      actions.push({ label: 'Manage Equipment', onClick: () => navigate(`/labs/${me.lab}`) });
    }
    else if (me?.role === 'user') {
      // Regular users see all labs but with different actions
      actions.push({ label: 'Physics Lab', onClick: () => navigate('/labs/physics') });
      actions.push({ label: 'Biology Lab', onClick: () => navigate('/labs/biology') });
      actions.push({ label: 'Chemistry Lab', onClick: () => navigate('/labs/chemistry') });
    }
    if (me?.role === 'user') {
      actions.push({ label: 'View My Borrowed Items', onClick: () => navigate('/') });
      actions.push({ label: 'Submit Report', onClick: () => navigate('/reports') });
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a, i) => (
          <button key={i} className="rounded-2xl px-4 py-6 bg-yellow-500/80 hover:bg-yellow-400 text-slate-900 font-semibold shadow-xl" onClick={a.onClick}>
            <div className="text-lg">{a.label}</div>
          </button>
        ))}
      </div>
    );
  },
  borrowed: ({me}) => {
    const [requests, setRequests] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    React.useEffect(() => {
      api.listBorrowRequests().then(setRequests).catch(e => setError(String(e))).finally(()=>setLoading(false));
    }, []);
    if (loading) return <div className="text-white/80">Loading borrowed items...</div>;
    if (error) return <div className="text-red-400">{error}</div>;

    // Filter requests based on user role
    const filteredRequests = requests.filter(r => {
      if (me.role === 'admin' || me.role === 'technician') {
        // Admins and technicians see pending and approved requests
        return r.status === 'pending' || r.status === 'approved';
      } else {
        // Regular users only see their own requests
        return r.user_id === me.id;
      }
    });

    if (!filteredRequests.length) return <div className="text-yellow-200">No borrowed items.</div>;
    // Show grouped requests with items and quantities
    return (
      <div>
        <table className="min-w-full border-collapse bg-blue-900 rounded-xl overflow-hidden border-2 border-yellow-500/30">
          <thead className="bg-blue-950">
            <tr>
              <th className="px-4 py-3 text-yellow-300">Items</th>
              <th className="px-4 py-3 text-yellow-300">User</th>
              <th className="px-4 py-3 text-yellow-300">Status</th>
              <th className="px-4 py-3 text-yellow-300">Requested</th>
              <th className="px-4 py-3 text-yellow-300">QR Code</th>
              <th className="px-4 py-3 text-yellow-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(r => (
              <tr key={r.id} className="border-b border-blue-800">
                <td className="px-4 py-3">
                  {Array.isArray(r.items) ? (
                    <ul className="list-disc ml-4 text-yellow-200">
                      {r.items.map(it => (
                        <li key={it.id}>
                          {it.name} <span className="text-yellow-400 font-bold">x{it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  ) : r.item_name}
                </td>
                <td className="px-4 py-3 text-yellow-200">{r.username}</td>
                <td className="px-4 py-3 text-yellow-300 font-semibold">{r.status}</td>
                <td className="px-4 py-3 text-yellow-200">{r.requested_at ? new Date(r.requested_at).toLocaleString() : ""}</td>
                <td className="px-4 py-3">{r.qr_code && r.status === "approved" ? <img src={r.qr_code} alt="QR" style={{width:48}} /> : "-"}</td>
                <td className="px-4 py-3">
                  {me && (me.role === "admin" || me.role === "technician") && r.status === "pending" ? (
                    <button className="button-primary mr-2" onClick={async()=>{ await api.approveBorrowRequest(r.id); window.location.reload(); }}>Approve</button>
                  ) : null}
                  {r.status === "pending" || r.status === "approved" ? (
                    <button className="button-ghost" onClick={async()=>{ await api.cancelBorrowRequest(r.id); window.location.reload(); }}>Cancel</button>
                  ) : null}
                  {r.status === "approved" && r.user_id === me.id ? (
                    <button className="button-ghost" onClick={async()=>{ await api.returnBorrowedItem(r.id); window.location.reload(); }}>Return</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [layout, setLayout] = useState(['quick_actions','borrowed']);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(()=>{
    api.me().then(async (u)=>{
      setMe(u);
      try {
        const prefs = await preferences.get(u.id);
        if (prefs.layout) setLayout(prefs.layout);
        if (prefs.buttons) setButtons(prefs.buttons);
      } catch {}
    });
  },[]);

  return (
    <div className="min-h-screen">
      <MoleculeBackground />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{color:'white'}}>👋 Welcome{me?`, ${me.role}`:''}</h1>
            <p className="text-white/70">Let’s make lab management smooth and safe.</p>
          </div>
          <button onClick={()=>setShowCustomizer(true)} className="px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10">
            ⚙ Customize
          </button>
        </div>

        <div className="grid gap-6">
          {layout.map((m, idx)=> (
            <motion.div key={m} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: idx*0.05}} 
               className={`rounded-2xl p-5 border border-white/10 bg-white/10 backdrop-blur shadow-2xl ${m === 'borrowed' ? 'overflow-x-auto' : ''}`}>
              <div className="mb-3 text-white/80 font-semibold">{m.replace('_',' ').toUpperCase()}</div>
              {MODULES[m] ? MODULES[m]({me, navigate}) : <div className="text-white/60">Module not found.</div>}
            </motion.div>
          ))}
        </div>
      </div>
      {showCustomizer && me && (
        <CustomizationPanel user={{...me, preferences:{layout, buttons}}}
                            layout={layout} setLayout={setLayout}
                            onClose={()=>setShowCustomizer(false)} />
      )}
    </div>
  );
}
