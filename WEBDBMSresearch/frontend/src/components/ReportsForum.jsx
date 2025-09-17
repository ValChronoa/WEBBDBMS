import React, { useEffect, useState } from "react";
import { api } from "../api/client";

export default function ReportsForum({ user }) {  // Add user prop
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [responseForm, setResponseForm] = useState({ reportId: null, message: "" });

  function fetchReports() {
    setLoading(true);
    api.listReports()
      .then(setReports)
      .catch(e => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchReports();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    // Frontend validation: required fields, min length
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (form.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (form.description.trim().length < 5) {
      setError("Description must be at least 5 characters.");
      return;
    }
    setSubmitting(true);
    api.createReport({
      title: form.title.trim(),
      description: form.description.trim(),
      // Add other required fields with default values
      status: "open"
    })
      .then(() => {
        setSuccess("Report submitted successfully!");
        setForm({ title: "", description: "" });
        setShowForm(false);
        fetchReports();
      })
      .catch((err) => {
        console.error("Report submission error:", err);
        let msg = "Failed to submit report.";
        if (err && err.message) {
          try {
            const parsed = JSON.parse(err.message);
            if (parsed && parsed.detail) {
              if (Array.isArray(parsed.detail)) {
                msg = parsed.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
              } else if (typeof parsed.detail === 'object') {
                msg = JSON.stringify(parsed.detail);
              } else {
                msg = parsed.detail;
              }
            }
          } catch (e) {
            msg = err.message;
          }
        }
        setError(msg);
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4 text-yellow-400">Reports Forum</h2>
      <div className="mb-6 flex justify-between items-center">
        <button className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400" onClick={() => setShowForm(f => !f)}>
          {showForm ? "Cancel" : "Submit New Report"}
        </button>
        {success && <span className="text-emerald-400 ml-4">{success}</span>}
        {error && (
          <span className="text-red-400 ml-4">
            {Array.isArray(error)
              ? error.map((e, i) => <div key={i}>{typeof e === 'object' ? JSON.stringify(e) : e}</div>)
              : typeof error === 'object'
                ? JSON.stringify(error)
                : error}
          </span>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="mb-4">
            <label className="block text-yellow-300 mb-1 font-semibold">Title</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input w-full border-2 border-yellow-500 bg-slate-800 text-yellow-200 rounded-2xl" />
          </div>
          <div className="mb-4">
            <label className="block text-yellow-300 mb-1 font-semibold">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required className="input w-full h-28 border-2 border-yellow-500 bg-slate-800 text-yellow-200 rounded-2xl" />
          </div>
          <button type="submit" className="px-6 py-2 rounded-xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      )}
      <div className="bg-slate-800 rounded-2xl p-6 text-white/90 shadow-xl">
        {loading ? (
          <div>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-yellow-200">No reports yet.</div>
        ) : (
          <ul className="divide-y divide-slate-700">
            {reports.map(r => (
              <li key={r.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="font-bold text-yellow-400">{r.title}</div>
                    <div className="text-white/80 text-sm mb-1">{r.description}</div>
                    <div className="text-xs text-yellow-200">By {r.username} • {r.created_at ? new Date(r.created_at).toLocaleString() : ""}</div>
                    
                    {/* Responses section */}
                    {r.responses && r.responses.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm font-semibold text-yellow-300">Responses:</div>
                        {r.responses.map(resp => (
                          <div key={resp.id} className="bg-slate-900/50 rounded-xl p-3 text-sm">
                            <div className="text-white/90">{resp.message}</div>
                            <div className="text-xs text-yellow-200 mt-1">
                              By {resp.username} ({resp.role}) • {new Date(resp.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Response form for admins and technicians */}
                    {(user?.role === 'admin' || user?.role === 'technician') && responseForm.reportId !== r.id && (
                      <button
                        onClick={() => setResponseForm({ reportId: r.id, message: "" })}
                        className="mt-2 px-3 py-1 text-sm bg-blue-900 hover:bg-blue-800 text-yellow-300 rounded-xl"
                      >
                        Add Response
                      </button>
                    )}
                    
                    {responseForm.reportId === r.id && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            await api.respondToReport(r.id, responseForm.message);
                            setResponseForm({ reportId: null, message: "" });
                            fetchReports();
                          } catch (err) {
                            setError("Failed to submit response: " + String(err));
                          }
                        }}
                        className="mt-3"
                      >
                        <textarea
                          value={responseForm.message}
                          onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                          className="w-full bg-slate-900 border border-yellow-500 rounded-xl p-2 text-yellow-200 text-sm"
                          placeholder="Type your response..."
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            disabled={!responseForm.message.trim()}
                            className="px-3 py-1 bg-yellow-500 text-slate-900 rounded-xl text-sm font-semibold"
                          >
                            Submit Response
                          </button>
                          <button
                            type="button"
                            onClick={() => setResponseForm({ reportId: null, message: "" })}
                            className="px-3 py-1 bg-slate-700 text-yellow-200 rounded-xl text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col gap-2 items-end shrink-0">
                    <div className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 border border-yellow-500 text-yellow-400">
                      {r.status || "open"}
                    </div>
                    
                    {/* Status controls for admins and technicians */}
                    {(user?.role === 'admin' || user?.role === 'technician') && (
                      <div className="flex gap-1">
                        {['open', 'in-progress', 'closed'].map(status => (
                          <button
                            key={status}
                            onClick={async () => {
                              try {
                                await api.updateReportStatus(r.id, status);
                                fetchReports();
                              } catch (err) {
                                setError("Failed to update status: " + String(err));
                              }
                            }}
                            disabled={r.status === status}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              r.status === status
                                ? 'bg-blue-900/50 text-yellow-400/50 cursor-not-allowed'
                                : 'bg-blue-900 hover:bg-blue-800 text-yellow-300'
                            }`}
                          >
                            Set {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
