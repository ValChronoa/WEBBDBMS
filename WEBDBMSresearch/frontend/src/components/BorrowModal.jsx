import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function BorrowModal({ open, onClose, item, load }) {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    manufacturer: '',
    model_number: '',
    serial_number: '',
    location: '',
    calibration_due: '',
    last_calibration: '',
    condition: 'Good',
    usage_log: '',
    notes: ''
  });

  const isEditing = Boolean(item?.id);

  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          name: item.name || '',
          quantity: item.quantity || 0,
          manufacturer: item.manufacturer || '',
          model_number: item.model_number || '',
          serial_number: item.serial_number || '',
          location: item.location || '',
          calibration_due: item.calibration_due || '',
          last_calibration: item.last_calibration || '',
          condition: item.condition || 'Good',
          usage_log: item.usage_log || '',
          notes: item.notes || ''
        });
      } else {
        setFormData({
          name: '',
          quantity: 0,
          manufacturer: '',
          model_number: '',
          serial_number: '',
          location: '',
          calibration_due: '',
          last_calibration: '',
          condition: 'Good',
          usage_log: '',
          notes: ''
        });
      }
    }
  }, [item, open]);

  if (!open) return null;

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.location) {
        alert('Name and Location are required');
        return;
      }

      if (isEditing) {
        await api.updateItem(item.lab, item.id, formData);
      } else {
        await api.createItem(item.lab, formData);
      }
      
      if (load) await load();
      onClose();
    } catch (e) {
      console.error('Error saving item:', e);
      alert(String(e));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-2xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-yellow-300">{isEditing ? 'Edit' : 'Add'} Item</h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-yellow-300 mb-1">Name *</label>
              <input 
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Quantity *</label>
              <input 
                type="number"
                min="0"
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.quantity}
                onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Manufacturer</label>
              <input 
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.manufacturer}
                onChange={e => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Model Number</label>
              <input 
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.model_number}
                onChange={e => setFormData(prev => ({ ...prev, model_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Serial Number</label>
              <input 
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.serial_number}
                onChange={e => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Location *</label>
              <input 
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Last Calibration</label>
              <input 
                type="date"
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.last_calibration}
                onChange={e => setFormData(prev => ({ ...prev, last_calibration: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Calibration Due</label>
              <input 
                type="date"
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.calibration_due}
                onChange={e => setFormData(prev => ({ ...prev, calibration_due: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Condition *</label>
              <select 
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.condition}
                onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                required
              >
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
                <option>Under Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-yellow-300 mb-1">Usage Log</label>
              <input 
                className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30"
                value={formData.usage_log}
                onChange={e => setFormData(prev => ({ ...prev, usage_log: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-yellow-300 mb-1">Notes</label>
            <textarea 
              className="w-full p-2 rounded-lg bg-slate-800 text-yellow-100 border border-yellow-500/30 h-20"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="button-ghost text-yellow-300" onClick={onClose}>Cancel</button>
          <button 
            className="button-primary bg-gradient-to-r from-yellow-500 to-blue-900"
            onClick={handleSave}
          >
            {isEditing ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}