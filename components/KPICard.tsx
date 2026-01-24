
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { COLORS } from '../constants';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, trend, trendUp, color = 'emerald' }) => {
  const accentColors: Record<string, string> = {
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    sky: 'text-sky-500'
  };

  return (
    <div className={`${COLORS.panel} p-6 rounded-3xl border ${COLORS.border} transition-all duration-300 hover:shadow-xl dark:hover:shadow-emerald-500/5 hover:-translate-y-1`}>
      <div className="flex justify-between items-center mb-6">
        <span className={`${COLORS.subtext} text-xs font-medium tracking-tight`}>{title}</span>
        <Icon size={18} className={accentColors[color]} strokeWidth={2} />
      </div>
      <div className="flex items-end justify-between">
        <h3 className={`text-3xl font-semibold tracking-tight ${COLORS.text}`}>{value}</h3>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {trendUp ? '+' : '-'}{trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;
