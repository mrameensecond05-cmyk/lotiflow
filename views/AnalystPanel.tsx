
import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, Search, Clock, Cpu, ChevronRight, MessageSquare, 
  ExternalLink, Hash, Info, UserPlus, FileText, Send, FolderKanban, Plus, Activity, CheckCircle, Upload, Paperclip, Terminal
} from 'lucide-react';
import { COLORS } from '../constants';
import { Severity, Alert, ProcessEvent, CaseNote, Artifact } from '../types';
import { backend } from '../services/backend';

const AnalystPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(backend.getAlerts());
  const [events, setEvents] = useState<ProcessEvent[]>(backend.getEvents());
  const [notes, setNotes] = useState<CaseNote[]>(backend.getNotes());
  const [artifacts, setArtifacts] = useState<Artifact[]>(backend.getArtifacts());
  
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeView, setActiveView] = useState<'alerts' | 'telemetry'>('alerts');
  const [activeCaseTab, setActiveCaseTab] = useState<'notes' | 'artifacts'>('notes');
  
  const [noteInput, setNoteInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = backend.subscribe(() => {
      setAlerts(backend.getAlerts());
      setEvents(backend.getEvents());
      setNotes(backend.getNotes());
      setArtifacts(backend.getArtifacts());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedAlert && alerts.length > 0) setSelectedAlert(alerts[0]);
  }, [alerts]);

  const getSeverityColor = (sev: Severity) => {
    switch(sev) {
      case Severity.CRITICAL: return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case Severity.HIGH: return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case Severity.MEDIUM: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
    }
  };

  const handleAcknowledge = (id: string) => {
    backend.acknowledgeAlert(id);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    backend.addNote(noteInput);
    setNoteInput('');
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const types = ['LOG', 'DUMP', 'BINARY', 'SCRIPT'];
      const names = ['memory_dump_01.bin', 'sysinternals_log.csv', 'payload_stager.ps1', 'network_trace.pcap'];
      const randomIdx = Math.floor(Math.random() * types.length);
      backend.addArtifact(names[randomIdx], types[randomIdx]);
      setIsUploading(false);
    }, 1500);
  };

  const relatedEvent = selectedAlert ? events.find(e => e.id === selectedAlert.eventId) : null;

  return (
    <div className="flex flex-col h-full gap-6 animate-in slide-in-from-bottom-4 duration-700">
      {/* View Switcher */}
      <div className="flex gap-4">
        <button 
          onClick={() => setActiveView('alerts')}
          className={`flex items-center gap-2 px-6 py-2 rounded-2xl text-xs font-bold transition-all ${activeView === 'alerts' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <FolderKanban size={14} /> ACTIVE ALERTS ({alerts.filter(a => a.status === 'NEW').length})
        </button>
        <button 
          onClick={() => setActiveView('telemetry')}
          className={`flex items-center gap-2 px-6 py-2 rounded-2xl text-xs font-bold transition-all ${activeView === 'telemetry' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Activity size={14} /> LIVE TELEMETRY
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main List */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className={`${COLORS.panel} border ${COLORS.border} rounded-[2rem] overflow-hidden flex flex-col h-full shadow-sm`}>
            {activeView === 'alerts' ? (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white dark:bg-[#111827] z-10">
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                      <th className="px-8 py-6 border-b ${COLORS.border}">Timestamp</th>
                      <th className="px-8 py-6 border-b ${COLORS.border}">Severity</th>
                      <th className="px-8 py-6 border-b ${COLORS.border}">Detection Rule</th>
                      <th className="px-8 py-6 border-b ${COLORS.border}">Host</th>
                      <th className="px-8 py-6 border-b ${COLORS.border} text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y ${COLORS.border}">
                    {alerts.map((alert) => (
                      <tr 
                        key={alert.id} 
                        onClick={() => setSelectedAlert(alert)}
                        className={`cursor-pointer transition-all ${selectedAlert?.id === alert.id ? 'bg-emerald-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                      >
                        <td className="px-8 py-5 text-xs font-medium text-slate-400">{alert.timestamp}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-semibold tracking-tight">{alert.ruleTriggered}</td>
                        <td className="px-8 py-5 text-xs font-medium text-slate-500">{alert.hostname}</td>
                        <td className="px-8 py-5 text-right">
                          {alert.status === 'NEW' ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                              className="text-emerald-500 hover:text-emerald-400 font-bold text-[10px] uppercase tracking-widest"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                              <CheckCircle size={12} className="text-emerald-500" /> Investigating
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 p-8 space-y-4 font-mono">
                 {events.map((event) => (
                   <div key={event.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] leading-relaxed animate-in fade-in slide-in-from-left-2">
                     <div className="flex justify-between text-slate-400 mb-2">
                        <span className="font-bold">[SYS-ID: {event.id}]</span>
                        <span>{event.timestamp}</span>
                     </div>
                     <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1 text-emerald-500 font-bold">Process:</div>
                        <div className="col-span-3 text-slate-300">{event.image}</div>
                        <div className="col-span-1 text-sky-500 font-bold">Command:</div>
                        <div className="col-span-3 text-slate-500 break-all">{event.commandLine}</div>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          {/* Investigation Panel */}
          {selectedAlert && activeView === 'alerts' && (
            <div className="h-[350px] grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
               {/* Command Inspector */}
               <div className={`${COLORS.panel} p-8 rounded-[2rem] border ${COLORS.border} shadow-sm overflow-hidden flex flex-col`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Command Inspector</h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full font-mono">PID: {selectedAlert.processId}</span>
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl font-mono text-xs text-emerald-500 border border-slate-100 dark:border-slate-800 break-all overflow-y-auto shadow-inner">
                    {selectedAlert.commandLine}
                  </div>
               </div>
               
               {/* Detection Context */}
               <div className={`${COLORS.panel} p-8 rounded-[2rem] border ${COLORS.border} shadow-sm overflow-hidden flex flex-col`}>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Detection Context</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">Parent Process</span>
                      <span className="text-xs font-bold font-mono">wmiprvse.exe</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">User Account</span>
                      <span className="text-xs font-bold text-sky-500">CORP\Administrator</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">Confidence Score</span>
                      <span className="text-xs font-black text-rose-500">{selectedAlert.confidence}%</span>
                    </div>
                  </div>
               </div>

               {/* Raw Telemetry Section (New) */}
               <div className={`${COLORS.panel} p-8 rounded-[2rem] border ${COLORS.border} shadow-sm overflow-hidden flex flex-col`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Raw Telemetry</h4>
                    <Terminal size={14} className="text-slate-400" />
                  </div>
                  <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 p-4 rounded-2xl overflow-y-auto border border-slate-100 dark:border-slate-800/50 shadow-inner">
                    {relatedEvent ? (
                      <div className="space-y-3 font-mono text-[10px] leading-relaxed">
                        {Object.entries(relatedEvent).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-2 last:border-0">
                            <span className="text-emerald-500 font-bold uppercase opacity-80">{key}</span>
                            <span className="text-slate-600 dark:text-slate-400 break-all select-all">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-slate-400 italic">Telemetry metadata not found.</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Case Manager */}
        <div className={`w-80 flex-shrink-0 ${COLORS.panel} border ${COLORS.border} rounded-[2rem] flex flex-col overflow-hidden shadow-sm`}>
           <div className="p-8 border-b ${COLORS.border}">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Active Case</p>
              <h3 className="font-bold text-sm tracking-tight">LOTL-2024-MAY-001</h3>
              
              <div className="flex mt-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveCaseTab('notes')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeCaseTab === 'notes' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                  Notes ({notes.length})
                </button>
                <button 
                  onClick={() => setActiveCaseTab('artifacts')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeCaseTab === 'artifacts' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                  Artifacts ({artifacts.length})
                </button>
              </div>
           </div>
           
           <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {activeCaseTab === 'notes' ? (
                <>
                  <form onSubmit={handleAddNote} className="mb-6">
                    <div className="relative">
                      <textarea 
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Add a case note..." 
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500/30 min-h-[80px] resize-none pr-10"
                      />
                      <button 
                        type="submit"
                        className="absolute bottom-3 right-3 p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{note.author}</span>
                          <span className="text-[10px] text-slate-400">{note.timestamp}</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={simulateUpload}
                    disabled={isUploading}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 group"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Activity size={24} className="animate-pulse text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ingest Artifact</span>
                      </>
                    )}
                  </button>
                  <div className="space-y-3 pt-4">
                    {artifacts.map((art) => (
                      <div key={art.id} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl group hover:shadow-md transition-all animate-in slide-in-from-top-2">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
                           <Paperclip size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{art.name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{art.type} • {art.timestamp}</p>
                        </div>
                      </div>
                    ))}
                    {artifacts.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-xs text-slate-400 italic">No artifacts linked to this case.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
           </div>

           <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-t ${COLORS.border} space-y-3">
              <button className="w-full bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-2xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all">
                Generate Report
              </button>
              <button className="w-full border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest py-3 rounded-2xl hover:bg-rose-50 transition-all">
                Close Case
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystPanel;
