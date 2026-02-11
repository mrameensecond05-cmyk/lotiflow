
import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Plus,
    Search,
    Filter,
    Clock,
    AlertTriangle,
    MessageSquare,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    ArrowLeft,
    Send,
    Activity
} from 'lucide-react';

const API_URL = 'http://localhost:8082/api';

const Cases = () => {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<any>(null);
    const [showNewCaseModal, setShowNewCaseModal] = useState(false);

    // New Case Form
    const [newCaseTitle, setNewCaseTitle] = useState('');
    const [newCaseDesc, setNewCaseDesc] = useState('');
    const [newCasePriority, setNewCasePriority] = useState('medium');

    // Case Details
    const [caseDetails, setCaseDetails] = useState<any>(null);
    const [newNote, setNewNote] = useState('');
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/cases`);
            const data = await res.json();
            setCases(data);
        } catch (err) {
            console.error("Failed to fetch cases:", err);
        }
        setLoading(false);
    };

    const fetchCaseDetails = async (id: number) => {
        setDetailsLoading(true);
        try {
            const res = await fetch(`${API_URL}/cases/${id}`);
            const data = await res.json();
            setCaseDetails(data);
        } catch (err) {
            console.error("Failed to fetch case details:", err);
        }
        setDetailsLoading(false);
    };

    const handleCaseClick = (c: any) => {
        setSelectedCase(c);
        fetchCaseDetails(c.case_id);
    };

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newCaseTitle,
                    description: newCaseDesc,
                    priority: newCasePriority
                })
            });

            if (res.ok) {
                setShowNewCaseModal(false);
                setNewCaseDesc('');
                setNewCaseTitle('');
                setNewCasePriority('medium');
                fetchCases();
            }
        } catch (err) {
            console.error("Failed to create case:", err);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            const res = await fetch(`${API_URL}/cases/${selectedCase.case_id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note_text: newNote })
            });

            if (res.ok) {
                setNewNote('');
                fetchCaseDetails(selectedCase.case_id); // Refresh details to show new note
            }
        } catch (err) {
            console.error("Failed to add note:", err);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            const res = await fetch(`${API_URL}/cases/${selectedCase.case_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchCases(); // Refresh list
                fetchCaseDetails(selectedCase.case_id); // Refresh details
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'critical': return 'var(--sentinel-red)';
            case 'high': return 'var(--sentinel-orange)';
            case 'medium': return 'var(--sentinel-blue)';
            case 'low': return 'var(--sentinel-green)';
            default: return 'var(--text-muted)';
        }
    };

    if (selectedCase && caseDetails) {
        return (
            <div className="flex flex-col h-full gap-6">
                {/* Header Back Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedCase(null)}
                        className="btn btn-ghost"
                        style={{ padding: '8px', color: 'var(--text-secondary)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace'
                            }}>
                                #{caseDetails.case_id}
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.05)',
                                color: getPriorityColor(caseDetails.priority),
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                {caseDetails.priority}
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: caseDetails.status === 'open' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                color: caseDetails.status === 'open' ? 'var(--sentinel-blue)' : 'var(--text-muted)',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                            }}>
                                {caseDetails.status}
                            </span>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{caseDetails.title}</h2>
                    </div>
                    <div className="ml-auto flex gap-3">
                        {caseDetails.status === 'open' ? (
                            <button
                                className="btn btn-ghost"
                                onClick={() => handleUpdateStatus('closed')}
                                style={{ gap: '8px', color: 'var(--text-muted)' }}
                            >
                                <CheckCircle size={18} /> Close Case
                            </button>
                        ) : (
                            <button
                                className="btn btn-ghost"
                                onClick={() => handleUpdateStatus('open')}
                                style={{ gap: '8px', color: 'var(--sentinel-green)' }}
                            >
                                <Activity size={18} /> Reopen Case
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 h-full">
                    {/* Main Info */}
                    <div className="col-span-2 flex flex-col gap-6">
                        {/* Description Card */}
                        <div className="card p-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Description</h3>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {caseDetails.description}
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-800 flex gap-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>Created {new Date(caseDetails.created_at).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    <span>{caseDetails.alerts?.length || 0} Linked Alerts</span>
                                </div>
                            </div>
                        </div>

                        {/* Alerts List */}
                        <div className="card p-0">
                            <div className="p-4 border-b border-slate-800">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Linked Alerts</h3>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {caseDetails.alerts && caseDetails.alerts.length > 0 ? (
                                    caseDetails.alerts.map((alert: any) => (
                                        <div key={alert.alert_id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full`} style={{ background: getPriorityColor(alert.severity) }}></div>
                                                <div>
                                                    <div className="font-medium text-sm text-slate-200">{alert.rule_name}</div>
                                                    <div className="text-xs text-slate-500">{alert.hostname} • {new Date(alert.timestamp).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-mono text-slate-500">
                                                {alert.status.toUpperCase()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        No alerts linked to this case yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Notes */}
                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="card flex-1 flex flex-col p-0">
                            <div className="p-4 border-b border-slate-800">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Investigation Notes</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {caseDetails.notes && caseDetails.notes.length > 0 ? (
                                    caseDetails.notes.map((note: any) => (
                                        <div key={note.note_id} className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                {note.analyst_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-slate-300">{note.analyst_name}</span>
                                                    <span className="text-[10px] text-slate-500">{new Date(note.created_at).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                                                    {note.note_text}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-600 text-sm">
                                        No notes added yet.
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                                <form onSubmit={handleAddNote} className="flex gap-2">
                                    <input
                                        type="text"
                                        className="input-field text-sm"
                                        placeholder="Add a note..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}
                                    />
                                    <button type="submit" className="btn btn-primary p-2">
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Briefcase className="text-emerald-500" /> Case Management
                </h1>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            className="input-field pl-9 pr-4 py-2 text-sm w-64"
                            placeholder="Search cases..."
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                        />
                    </div>
                    <button className="btn btn-ghost" style={{ gap: '6px', color: 'var(--text-secondary)' }}>
                        <Filter size={16} /> Filter
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{ gap: '6px' }}
                        onClick={() => setShowNewCaseModal(true)}
                    >
                        <Plus size={16} /> New Case
                    </button>
                </div>
            </div>

            {/* Cases Grid/List */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    <Activity className="animate-spin mr-2" /> Loading cases...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {cases.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                            <Briefcase size={48} className="mx-auto text-slate-700 mb-4" />
                            <h3 className="text-lg font-medium text-slate-400">No cases found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Create a case to start tracking incidents and security investigations.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowNewCaseModal(true)}
                            >
                                <Plus size={16} className="mr-2" /> Create First Case
                            </button>
                        </div>
                    ) : (
                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="p-4 pl-6">Case ID</th>
                                        <th className="p-4 w-1/3">Title</th>
                                        <th className="p-4">Priority</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Created</th>
                                        <th className="p-4 text-right pr-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {cases.map((c) => (
                                        <tr
                                            key={c.case_id}
                                            className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                            onClick={() => handleCaseClick(c)}
                                        >
                                            <td className="p-4 pl-6 font-mono text-xs text-slate-500">#{c.case_id}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{c.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 truncate max-w-md">{c.description}</div>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-white/5"
                                                    style={{
                                                        color: getPriorityColor(c.priority),
                                                        background: 'rgba(255,255,255,0.03)'
                                                    }}
                                                >
                                                    {c.priority}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {c.status === 'open' ? (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                                    )}
                                                    <span className={`text-xs font-semibold uppercase ${c.status === 'open' ? 'text-blue-200' : 'text-slate-500'}`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <button className="btn btn-ghost p-2 text-slate-500 hover:text-white">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* New Case Modal */}
            {showNewCaseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="card w-full max-w-lg p-6 shadow-2xl border border-slate-700">
                        <h2 className="text-xl font-bold mb-6">Create New Case</h2>
                        <form onSubmit={handleCreateCase} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                                <input
                                    type="text"
                                    className="input-field w-full"
                                    placeholder="e.g., Suspicious PowerShell Activity on HR-PC"
                                    value={newCaseTitle}
                                    onChange={(e) => setNewCaseTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                                    <select
                                        className="input-field w-full"
                                        value={newCasePriority}
                                        onChange={(e) => setNewCasePriority(e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assignee</label>
                                    <select className="input-field w-full" disabled>
                                        <option>Unassigned</option>
                                        <option>Me (Current User)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    className="input-field w-full h-32 resize-none"
                                    placeholder="Describe the incident details..."
                                    value={newCaseDesc}
                                    onChange={(e) => setNewCaseDesc(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setShowNewCaseModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Case
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cases;
