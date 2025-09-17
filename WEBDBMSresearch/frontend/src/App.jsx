

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import ReportsForum from "./components/ReportsForum.jsx";
import InventoryTable from "./components/InventoryTable";
import Login from "./components/Login";
import NavBar from "./components/NavBar";
import UserAdmin from "./components/UserAdmin";
import { useTheme, ThemeProvider } from "./components/ThemeContext";
import { api, setTokens } from "./api/client";
import BorrowReceipt from "./components/BorrowReceipt";
import { useEffect as useEffectReact, useState as useStateReact } from "react";

function ErrorBoundary({ error, onClear }) {
  if (!error) return null;
  return (
    <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg z-50">
      <div>{error}</div>
      <button className="ml-4 underline" onClick={onClear}>Dismiss</button>
    </div>
  );
}

import { preferences } from "./api/client";
function Settings({ user, setError }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [theme, setTheme] = useState(user?.preferences?.theme?.name || "chem");
  const [themeOk, setThemeOk] = useState("");

  async function changePw(e) {
    e.preventDefault();
    setPwOk(""); setPwErr("");
    if (pw.length < 8 || pw !== pw2) {
      setPwErr("Passwords must match and be at least 8 characters.");
      return;
    }
    try {
      await api.changePassword(user.id, pw);
      setPwOk("Password changed!");
      setPw(""); setPw2("");
    } catch (e) { setPwErr("Failed to change password."); }
  }

  async function saveTheme() {
    setThemeOk("");
    try {
      await preferences.put(user.id, { theme: { name: theme } });
      setThemeOk("Theme preference saved!");
    } catch (e) { setError("Failed to save theme."); }
  }

  return (
    <div className="card max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">User Settings</h2>
      <form onSubmit={changePw} className="mb-6">
        <div className="font-semibold mb-2">Change Password</div>
        <input className="input w-full mb-2 border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 bg-slate-900 text-yellow-200 placeholder-yellow-300 rounded-2xl transition" type="password" placeholder="New password" value={pw} onChange={e=>setPw(e.target.value)} />
        <input className="input w-full mb-2 border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 bg-slate-900 text-yellow-200 placeholder-yellow-300 rounded-2xl transition" type="password" placeholder="Repeat new password" value={pw2} onChange={e=>setPw2(e.target.value)} />
        <button className="w-full text-lg py-2 border-2 border-yellow-500 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-2xl shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" type="submit">Change Password</button>
        {pwOk && <div className="text-emerald-400 text-sm mt-2">{pwOk}</div>}
        {pwErr && <div className="text-red-400 text-sm mt-2">{pwErr}</div>}
      </form>
      <div className="font-semibold mb-2">Theme Preference</div>
      <div className="flex gap-2 mb-2">
        {['chem','bio','light'].map(t => (
          <button key={t} onClick={()=>setTheme(t)} className={`px-4 py-2 rounded-xl border-2 ${theme===t?'border-yellow-500 bg-yellow-500 text-slate-900 font-bold':'border-slate-700 bg-slate-900 text-yellow-200'} transition`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <button className="w-full text-lg py-2 border-2 border-yellow-500 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-2xl shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" onClick={saveTheme}>Save Theme</button>
      {themeOk && <div className="text-emerald-400 text-sm mt-2">{themeOk}</div>}
    </div>
  );
}

function AppRoutes({ user, setUser, error, setError }) {
  const navigate = useNavigate();
  useEffect(() => {
    api.me().then(u => setUser(u)).catch(() => setUser(null));
    // eslint-disable-next-line
  }, []);

  function handleLogout() {
    setTokens({ access: null, refresh: null });
    setUser(null);
    navigate("/login");
  }

  if (!user) {
    return <Login onLogin={u => { setUser(u); navigate("/"); }} />;
  }

  // Remove forced redirect for technician dashboard
  return (
    <>
      <NavBar user={user} onLogout={handleLogout} />
      <ErrorBoundary error={error} onClear={()=>setError("")} />
      <main className="max-w-6xl mx-auto p-6">
        <Routes>
          {(user.role === 'user' || user.role === 'admin' || user.role === 'technician') && (
            <Route path="/" element={user.role === 'admin' ? <AdminDashboard /> : <Dashboard />} />
          )}
          <Route path="/labs/:lab" element={<InventoryTableWrapper user={user} />} />
          <Route path="/settings" element={<Settings user={user} setError={setError} />} />
          {/* Reports forum route for all roles */}
          <Route path="/reports" element={<ReportsForum user={user} />} />
          {/* Borrow receipt route for grouped borrow requests */}
          <Route path="/receipt/:requestId" element={<BorrowReceiptRoute user={user} />} />
        </Routes>
      </main>
    </>
  );
// Removed duplicate imports for useParams, useEffectReact, useStateReact
function BorrowReceiptRoute({ user }) {
  const { requestId } = useParams();
  const [request, setRequest] = useStateReact(null);
  useEffectReact(() => {
    if (!requestId) return;
    api.getBorrowRequest(requestId)
      .then(r => setRequest(r))
      .catch(() => setRequest(null));
  }, [requestId]);
  if (!request) return <div className="text-yellow-400 font-bold text-xl mt-8">Loading receipt...</div>;
  return <BorrowReceipt request={request} />;
}
}

// Removed duplicate import of useParams
function InventoryTableWrapper({ user }) {
  const { lab } = useParams();
  // If technician, only allow access to their assigned lab
  if (user.role === 'technician' && user.lab && lab !== user.lab) {
    // Option 1: Redirect to their lab
    window.location.replace(`/labs/${user.lab}`);
    return null;
    // Option 2: Show error (uncomment to use)
    // return <div className="text-red-500 font-bold text-xl">Access denied: You can only access your assigned lab inventory.</div>;
  }
  return <InventoryTable lab={lab} user={user} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  return (
    <ThemeProvider>
      <AppRoutes user={user} setUser={setUser} error={error} setError={setError} />
    </ThemeProvider>
  );
}
