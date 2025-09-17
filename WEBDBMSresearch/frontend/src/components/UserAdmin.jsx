

import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { motion } from 'framer-motion';

function UserModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { username:'', password:'', role:'user', lab:'' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) setForm(initial || { username:'', password:'', role:'user', lab:'' }); setError(''); }, [open, initial]);
  if (!open) return null;
  const handleSave = () => {
    setError('');
    if (form.role === 'technician' && !form.lab.trim()) {
      setError('Lab is required for technicians');
      return;
    }
    // Remove lab for non-technicians
    const payload = form.role === 'technician' ? form : { ...form, lab: undefined };
    onSave(payload);
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-yellow-400">{initial ? 'Edit User' : 'Create User'}</h2>
        <div className="space-y-3">
          <input className="input w-full border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 bg-slate-900 text-yellow-200 placeholder-yellow-300 rounded-2xl transition" placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} />
          <div className="relative">
            <input className="input w-full border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 bg-slate-900 text-yellow-200 placeholder-yellow-300 rounded-2xl transition pr-12" type={showPw ? 'text' : 'password'} placeholder={initial ? 'New Password (leave blank to keep)' : 'Password'} value={form.password || ''} onChange={e=>setForm({...form, password:e.target.value})} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 text-sm" tabIndex={-1} onClick={()=>setShowPw(v=>!v)}>{showPw ? 'Hide' : 'Show'}</button>
          </div>
          <div className="flex gap-2">
            <select className="input w-1/2 border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 bg-slate-900 text-yellow-200 rounded-2xl transition" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
              <option value="user">user</option>
              <option value="technician">technician</option>
              <option value="admin">admin</option>
            </select>
            {form.role === 'technician' && (
              <select
                className="input w-1/2 border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 bg-slate-900 text-yellow-200 rounded-2xl transition"
                value={form.lab}
                onChange={e => setForm({ ...form, lab: e.target.value })}
              >
                <option value="">Select Lab</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="biology">Biology</option>
              </select>
            )}
          </div>
          {error && <div className="text-red-400 text-sm mt-1">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="button-ghost" onClick={onClose}>Cancel</button>
          <button className="w-full text-lg py-2 mt-2 border-2 border-yellow-500 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-2xl shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" onClick={handleSave}>{initial ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}

export default function UserAdmin() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function load() {
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (e) { setError(String(e)); }
  }
  useEffect(()=>{ load(); }, []);

  async function handleCreate(form) {
    setError(''); setOk('');
    try {
      await api.createUser(form);
      setOk('User created');
      setModalOpen(false);
      load();
    } catch (e) { setError(String(e)); }
  }

  async function handleEdit(form) {
    setError(''); setOk('');
    try {
      // Only send password if changed
      const payload = { ...editUser, ...form };
      if (!form.password) delete payload.password;
      // Update user info
  if (payload.password === "") delete payload.password;
  await api.updateUser(editUser.id, payload);
      setOk('User updated');
      setEditUser(null);
      setModalOpen(false);
      load();
    } catch (e) { setError(String(e)); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user?')) return;
    setError(''); setOk('');
    try {
  await api.deleteUser(id);
      setOk('User deleted');
      load();
    } catch (e) { setError(String(e)); }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-3 text-yellow-400">{editUser ? 'Edit User' : 'Create User'}</h2>
        <button className="w-full text-lg py-2 mb-3 border-2 border-yellow-500 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-2xl shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" onClick={()=>{ setEditUser(null); setModalOpen(true); }}>Add User</button>
        <UserModal open={modalOpen} onClose={()=>{ setModalOpen(false); setEditUser(null); }} onSave={editUser ? handleEdit : handleCreate} initial={editUser} />
        {ok && <div className="text-emerald-400 text-sm mb-2">{ok}</div>}
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-3 text-yellow-400">Users</h2>
        <table className="table">
          <thead><tr><th>Username</th><th>Role</th><th>Lab</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <motion.tr key={u.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} whileHover={{ scale: 1.01 }}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.lab || '-'}</td>
                <td className="flex gap-2">
                  <button className="px-3 py-1 rounded-xl border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-slate-900 transition font-semibold" onClick={()=>{ setEditUser(u); setModalOpen(true); }}>Edit</button>
                  <button className="px-3 py-1 rounded-xl border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition font-semibold" onClick={()=>handleDelete(u.id)}>Delete</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
