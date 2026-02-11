
import React, { useState } from 'react';
import { 
  Users, FileCode, History, Plus, Edit, Trash2, 
  ToggleLeft, ToggleRight, CheckCircle2, XCircle, 
  Search, Download, Save, Settings, Moon, Sun, Monitor
} from 'lucide-react';
import { COLORS } from '../constants';
import { UserRole } from '../types';

interface AdminPanelProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const MOCK_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@lotiflow.sec', role: UserRole.ADMIN, status: 'ACTIVE' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@lotiflow.sec', role: UserRole.ANALYST, status: 'ACTIVE' },
  { id: '3', name: 'Bob Johnson', email: 'bob.j@lotiflow.sec', role: UserRole.VIEWER, status: 'INACTIVE' },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ theme, onThemeChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'rules' | 'audit' | 'settings'>('users');
  const [ruleContent, setRuleContent] = useState(`name: Suspicious PowerShell Download
description: Detects powershell.exe connecting to non-standard ports or known malicious IPs.
severity: CRITICAL
logic:
  selection:
    Image|endswith: '\\powershell.exe'
    CommandLine|contains:
      - 'DownloadString'
  condition: selection`);

  return (
    <div className="flex flex-col h-full gap-6 animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div className={`flex ${COLORS.panel} border ${COLORS.border} rounded-xl p-1 shadow-sm`}>
          {[
            { id: 'users', label: 'Users', icon: <Users size={16} /> },
            { id: 'rules', label: 'Rules', icon: <FileCode size={16} /> },
            { id: 'audit', label: 'Audit', icon: <History size={16} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === tab.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        {activeSubTab === 'users' && (
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all">
            <Plus size={18} /> New User
          </button>
        )}
      </div>

      <div className={`flex-1 ${COLORS.panel} border ${COLORS.border} rounded-2xl overflow-hidden flex flex-col shadow-sm`}>
        {activeSubTab === 'users' && (
          <table className="w-full text-left">
            <thead>
              <tr className={`${COLORS.subtext} text-[10px] font-bold uppercase tracking-widest border-b ${COLORS.border} opacity-70`}>
                <th className="px-8 py-5">User Profile</th>
                <th className="px-8 py-5">Role Permission</th>
                <th className="px-8 py-5">Activity status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${COLORS.border}`}>
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-emerald-500 border border-emerald-500/10">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${COLORS.text}`}>{user.name}</p>
                        <p className={`text-xs ${COLORS.subtext}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${user.role === UserRole.ADMIN ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-sky-500 border-sky-500/20 bg-sky-500/5'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${user.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-500'}`}>{user.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button className={`p-2 ${COLORS.subtext} hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all`}><Edit size={16} /></button>
                      <button className={`p-2 ${COLORS.subtext} hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeSubTab === 'settings' && (
          <div className="p-10 space-y-10 max-w-2xl mx-auto w-full">
            <div>
              <h3 className={`text-lg font-bold ${COLORS.text} mb-1`}>Appearance</h3>
              <p className={`text-xs ${COLORS.subtext} mb-6`}>Customize the interface theme for your operating environment.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onThemeChange('light')}
                  className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                >
                  <div className="w-full aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-inner">
                    <Sun size={32} className="text-amber-500" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'light' ? 'text-emerald-600' : COLORS.subtext}`}>Light Mode</span>
                </button>
                
                <button 
                  onClick={() => onThemeChange('dark')}
                  className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                >
                  <div className="w-full aspect-video bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center shadow-inner">
                    <Moon size={32} className="text-sky-400" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-emerald-500' : COLORS.subtext}`}>Dark Mode</span>
                </button>
              </div>
            </div>

            <div className={`pt-8 border-t ${COLORS.border}`}>
              <h3 className={`text-lg font-bold ${COLORS.text} mb-1`}>Engine Settings</h3>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Auto-Isolation</p>
                  <p className="text-xs text-slate-500">Isolate hosts automatically on Critical detections.</p>
                </div>
                <button className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full relative p-1 transition-colors hover:bg-slate-300">
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs omitted for brevity in this block, would contain Rules and Audit logs */}
        {(activeSubTab === 'rules' || activeSubTab === 'audit') && (
           <div className="flex-1 flex items-center justify-center p-20 text-center">
              <div>
                <Monitor className={`mx-auto mb-4 ${COLORS.subtext}`} size={48} />
                <h3 className={`text-lg font-bold ${COLORS.text}`}>Modular Concept</h3>
                <p className={`text-xs ${COLORS.subtext}`}>Rules and Audit management interfaces are minimized for this conceptual view.</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
