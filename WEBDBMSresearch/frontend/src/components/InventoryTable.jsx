import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { motion } from 'framer-motion';
import BorrowModal from './BorrowModal';



export default function InventoryTable({ lab, user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowItem, setBorrowItem] = useState(null);
  const [borrowError, setBorrowError] = useState("");
  // Add to cart state
  const [cart, setCart] = useState([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  async function load() {
    try {
      setLoading(true);
      const data = await api.listItems(lab);
      const list = Object.entries(data).map(([id, v]) => ({ id, ...v }));
      setRows(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{ load(); }, [lab]);

  async function reloadBorrowRequests() {
    try {
      const reqs = await api.listBorrowRequests();
      setBorrowRequests(reqs);
    } catch {}
  }
  useEffect(() => { reloadBorrowRequests(); }, []);

  function getItemBorrowStatus(itemId) {
    // Find grouped requests containing this item
    const relevant = borrowRequests.filter(br => (br.status === 'pending' || br.status === 'approved') && Array.isArray(br.items) && br.items.some(it => it.id === itemId));
    if (!relevant.length) return 'Available';
    return relevant.map(br => `${br.status} (${br.username})`).join(', ');
  }

  async function handleApprove(reqId) {
    await api.approveBorrowRequest(reqId);
    await reloadBorrowRequests();
    await load();
  }
  async function handleCancel(reqId) {
    await api.cancelBorrowRequest(reqId);
    await reloadBorrowRequests();
    await load();
  }
  async function handleReturn(reqId) {
    await api.returnBorrowedItem(reqId);
    await reloadBorrowRequests();
    await load();
  }


  // Add to cart modal
  function handleAddToCart(item) {
    setCart(prev => {
      const exists = prev.find(ci => ci.id === item.id);
      if (exists) {
        return prev.map(ci => ci.id === item.id ? { ...ci, quantity: Math.min(ci.quantity + 1, item.quantity) } : ci);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }
  function handleRemoveFromCart(itemId) {
    setCart(prev => prev.filter(ci => ci.id !== itemId));
  }
  function handleCartQuantityChange(itemId, delta, maxQty) {
    setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, quantity: Math.max(1, Math.min(ci.quantity + delta, maxQty)) } : ci));
  }
  async function handleSubmitCart() {
    try {
      await api.submitBorrowRequest({ items: cart.map(ci => ({ id: ci.id, name: ci.name, quantity: ci.quantity })) });
      setCart([]);
      setCartModalOpen(false);
      await reloadBorrowRequests();
      await load();
    } catch (e) {
      setBorrowError(String(e));
    }
  }

  return (
  <div className="card bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 border-2 border-yellow-500/40 shadow-2xl rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold capitalize text-yellow-400 drop-shadow-lg tracking-wide">{lab} Inventory</h2>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-yellow-100 border-2 border-yellow-500/30 focus:border-yellow-500 focus:outline-none w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500/50 hover:text-yellow-500"
              >
                ×
              </button>
            )}
          </div>
          <button className="button-ghost border-2 border-yellow-400 text-yellow-300 hover:bg-blue-900/30 px-4 py-2 rounded-xl shadow-md" onClick={load}>Refresh</button>
          {(user?.role === 'user') && (
            <button className="rounded-full bg-gradient-to-br from-pink-500 to-yellow-400 shadow-lg hover:scale-110 transition-transform p-2 text-2xl border-2 border-yellow-300 hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 relative" onClick={()=>setCartModalOpen(true)}>
              <span role="img" aria-label="cart">🛒</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-blue-900 text-xs font-bold rounded-full px-2 py-1 shadow">{cart.length}</span>
              )}
            </button>
          )}
          {(user?.role === 'admin' || user?.role === 'technician') && (
            <button 
              className="button-primary" 
              onClick={() => {
                setBorrowItem({ lab: lab });
                setBorrowModalOpen(true);
              }}
            >
              Add item
            </button>
          )}
        </div>
      </div>
      {loading ? <div>Loading...</div> : (
        <div className="overflow-auto rounded-3xl border-2 border-yellow-500/30 bg-slate-900 shadow-2xl max-w-screen-xl mx-auto">
          <table className="min-w-[900px] w-full border-collapse text-base">
            <thead className="bg-slate-800 sticky top-0 z-10">
              <tr>
                <th>Name</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Borrow Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">No items</td></tr>
              ) : rows.filter(r => {
                  if (!searchTerm) return true;
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    String(r.name || '').toLowerCase().includes(searchLower) ||
                    String(r.location || r.storage_conditions || '').toLowerCase().includes(searchLower) ||
                    String(r.condition || '').toLowerCase().includes(searchLower) ||
                    String(r.manufacturer || '').toLowerCase().includes(searchLower) ||
                    String(r.model_number || '').toLowerCase().includes(searchLower) ||
                    String(r.serial_number || '').toLowerCase().includes(searchLower) ||
                    String(r.notes || '').toLowerCase().includes(searchLower)
                  );
                }).map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} whileHover={{ scale: 1.01 }}
                  className={i%2===0 ? 'bg-slate-900' : 'bg-slate-800'}>
                  <td className="px-4 py-3 border-b border-yellow-700/30 text-yellow-100 whitespace-nowrap text-lg font-medium">{r.name || '-'}</td>
                  <td className="px-4 py-3 border-b border-yellow-700/30 text-yellow-100 whitespace-nowrap text-lg">{r.quantity || '-'}</td>
                  <td className="px-4 py-3 border-b border-yellow-700/30 text-yellow-100 whitespace-nowrap">{r.location || r.storage_conditions || '-'}</td>
                  <td className="px-4 py-3 border-b border-yellow-700/30 text-yellow-100 whitespace-nowrap">{r.condition || '-'}</td>
                  <td className="px-4 py-3 border-b border-yellow-700/30">
                    <select className="input bg-slate-800 text-yellow-200 rounded-xl" disabled>
                      <option>{getItemBorrowStatus(r.id)}</option>
                    </select>
                    {/* Only show action buttons to admin/technician */}
                    {(user?.role === 'admin' || user?.role === 'technician') && (
                      <>
                        {/* Approve pending requests */}
                        {borrowRequests.filter(br => Array.isArray(br.items) && br.items.some(it => it.id === r.id) && br.status === 'pending').length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {borrowRequests.filter(br => Array.isArray(br.items) && br.items.some(it => it.id === r.id) && br.status === 'pending').map(br => (
                              <button key={br.id} className="button-primary text-xs" onClick={()=>handleApprove(br.id)}>Approve</button>
                            ))}
                          </div>
                        )}
                        {/* Mark approved requests as returned */}
                        {borrowRequests.filter(br => Array.isArray(br.items) && br.items.some(it => it.id === r.id) && br.status === 'approved').length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {borrowRequests.filter(br => Array.isArray(br.items) && br.items.some(it => it.id === r.id) && br.status === 'approved').map(br => (
                              <button key={br.id} className="button-ghost text-xs" onClick={()=>handleReturn(br.id)}>Mark Returned</button>
                            ))}
                          </div>
                        )}
                        {/* Cancel any request */}
                        {borrowRequests.filter(br => Array.isArray(br.items) && br.items.some(it => it.id === r.id) && ['pending', 'approved'].includes(br.status)).length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {borrowRequests.filter(br => Array.isArray(br.items) && br.items.some(it => it.id === r.id) && ['pending', 'approved'].includes(br.status)).map(br => (
                              <button key={br.id} className="button-ghost text-xs bg-red-500/10 hover:bg-red-500/20" onClick={()=>handleCancel(br.id)}>Cancel Request</button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-slate-700 text-right bg-inherit">
                    {(user?.role === 'admin' || user?.role === 'technician') ? (
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="button-ghost" 
                          onClick={() => {
                            setBorrowItem({ ...r, id: r.id, lab: lab });
                            setBorrowModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="button-ghost hover:bg-red-500/20" 
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${r.name}?`)) {
                              try {
                                await api.deleteItem(lab, r.id);
                                await load();
                              } catch (e) {
                                setError(String(e));
                              }
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : user?.role === 'user' ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          className="rounded-full bg-gradient-to-br from-blue-900 to-yellow-400 shadow-lg hover:scale-110 transition-transform p-2 text-2xl border-2 border-yellow-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          title="Add to Cart"
                          onClick={()=>handleAddToCart(r)}
                        >
                          <span role="img" aria-label="potion">🧪</span>
                        </button>
                      </div>
                    ) : null}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {cartModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border-2 border-yellow-400/40">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400 drop-shadow">Borrow Cart</h2>
            {cart.length === 0 ? (
              <div className="text-yellow-200 mb-4 text-lg">Your cart is empty.</div>
            ) : (
              <div className="mb-4">
                {cart.map(ci => (
                  <div key={ci.id} className="flex items-center justify-between mb-4 py-2 px-3 rounded-xl bg-blue-950/60 shadow">
                    <span className="text-yellow-100 text-lg font-semibold">{ci.name}</span>
                    <div className="flex items-center gap-2">
                      <button className="rounded-full bg-gradient-to-br from-yellow-500 to-blue-900 text-blue-900 px-3 py-1 text-lg shadow hover:scale-110 transition-transform" onClick={()=>handleCartQuantityChange(ci.id, -1, ci.quantity)}>-</button>
                      <span className="text-yellow-200 text-lg font-bold">{ci.quantity}</span>
                      <button className="rounded-full bg-gradient-to-br from-blue-900 to-yellow-500 text-yellow-300 px-3 py-1 text-lg shadow hover:scale-110 transition-transform" onClick={()=>handleCartQuantityChange(ci.id, 1, rows.find(r=>r.id===ci.id)?.quantity || 1)}>+</button>
                      <button className="button-ghost text-yellow-400 font-bold" onClick={()=>handleRemoveFromCart(ci.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-4 mt-6">
              <button className="button-ghost border-2 border-yellow-400 text-yellow-300 px-4 py-2 rounded-xl shadow-md" onClick={()=>setCartModalOpen(false)}>Close</button>
              <button className="button-primary bg-gradient-to-br from-yellow-500 to-blue-900 text-yellow-100 px-6 py-2 rounded-xl shadow-lg font-bold text-lg" disabled={cart.length===0} onClick={handleSubmitCart}>Submit Borrow Request</button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}
      {borrowError && <div className="text-red-400 mt-2 text-sm">{borrowError}</div>}
      {borrowModalOpen && (
        <BorrowModal 
          open={borrowModalOpen} 
          onClose={() => { 
            setBorrowModalOpen(false); 
            setBorrowItem(null); 
          }} 
          item={borrowItem}
          load={load}
        />
      )}
    </div>
  );
}

