

import React, { useState } from 'react';
import { api, setTokens } from '../api/client';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(username, password);
      setTokens({ access: res.access_token, refresh: res.refresh_token });
      onLogin(res.user);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-slate-900 to-slate-950">
      <form onSubmit={submit} className="w-full max-w-md bg-slate-900/80 rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-3xl text-white mb-2 shadow-lg">⚗️</div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">LabDBMS</h1>
          <div className="text-cyan-300 text-sm">Sign in to your account</div>
        </div>
        <div className="space-y-4">
          <input
            className="input w-full text-lg py-3 border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-slate-900 text-yellow-200 placeholder-yellow-300 rounded-2xl transition"
            placeholder="Username"
            autoFocus
            value={username}
            onChange={e=>setUsername(e.target.value)}
          />
          <div className="relative">
            <input
              className="input w-full text-lg py-3 border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-slate-900 text-yellow-200 placeholder-yellow-300 rounded-2xl transition pr-12"
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 text-sm"
              tabIndex={-1}
              onClick={()=>setShowPw(v=>!v)}
            >{showPw ? 'Hide' : 'Show'}</button>
          </div>
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          <button
            className="w-full text-lg py-3 mt-2 border-2 border-yellow-500 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-2xl shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
  <div className="mt-6 text-center text-yellow-400 text-xs opacity-90">Default admin: <span className="font-bold">admin / admin12345</span></div>
      </form>
    </div>
  );
}
