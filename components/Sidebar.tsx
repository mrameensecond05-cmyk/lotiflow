
import React from 'react';
import { Shield } from 'lucide-react';
import { NAVIGATION_ITEMS, COLORS } from '../constants';

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={`w-24 lg:w-64 flex-shrink-0 border-r ${COLORS.border} ${COLORS.panel} flex flex-col transition-all duration-500 z-20`}>
      <div className="p-8 flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
          <Shield className="text-white" size={24} strokeWidth={2.5} />
        </div>
        <span className={`hidden lg:block font-bold text-xl tracking-tighter ${COLORS.text}`}>SENTINEL</span>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-slate-100 dark:bg-slate-800/50 text-emerald-600 dark:text-emerald-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/20'
            }`}
          >
            <span className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="hidden lg:block font-semibold text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={`p-8 border-t ${COLORS.border} hidden lg:block`}>
        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Engine Online</span>
           </div>
           <p className="text-[10px] text-slate-400 font-medium">Monitoring 2.4k nodes across 3 regions.</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
