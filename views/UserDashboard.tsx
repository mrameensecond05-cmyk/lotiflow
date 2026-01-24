import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Shield, AlertOctagon, Activity, Cpu, HardDrive, Wifi, FileWarning, Lock, Unlock, Search
} from 'lucide-react';

const mockGraphData = [
    { name: '10:00', activity: 20 }, { name: '10:05', activity: 35 },
    { name: '10:10', activity: 25 }, { name: '10:15', activity: 60 },
    { name: '10:20', activity: 45 }, { name: '10:25', activity: 90 },
    { name: '10:30', activity: 50 }, { name: '10:35', activity: 30 },
];

const localEvents = [
    { time: '10:25:01', event: 'Connection Blocked: 192.168.1.105', type: 'WARN' },
    { time: '10:24:45', event: 'File Quarantined: malware.exe', type: 'CRITICAL' },
    { time: '10:00:00', event: 'System Scan Started', type: 'INFO' },
];

const UserDashboard = () => {
    // Mock states
    const [systemStatus, setSystemStatus] = useState<'safe' | 'risk'>('risk');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [networkLocked, setNetworkLocked] = useState(false);

    // Simulate scan effect
    useEffect(() => {
        if (isScanning) {
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        setIsScanning(false);
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [isScanning]);

    const handleScan = () => {
        setIsScanning(true);
        setScanProgress(0);
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', padding: '2rem', color: 'var(--text-primary)' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Shield size={32} color={systemStatus === 'safe' ? 'var(--sentinel-green)' : 'var(--sentinel-red)'} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Endpoint Monitor</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Local Agent Interface • Host: WORKSTATION-01</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Isolation Toggle */}
                    <button
                        className="btn"
                        onClick={() => setNetworkLocked(!networkLocked)}
                        style={{
                            background: networkLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                            color: networkLocked ? 'var(--sentinel-red)' : 'var(--sentinel-blue)',
                            border: networkLocked ? '1px solid var(--sentinel-red)' : '1px solid transparent'
                        }}
                    >
                        {networkLocked ? <><Lock size={16} /> NETWORK ISOLATED</> : <><Unlock size={16} /> NETWORK OPEN</>}
                    </button>

                    <div className={`status-badge ${systemStatus === 'safe' ? 'status-active' : 'status-critical'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                        {systemStatus === 'safe' ? 'PROTECTED' : 'THREAT DETECTED'}
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Left Column: Metrics & Tools */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Metrics Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                                <Cpu color="var(--sentinel-blue)" size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPU USAGE</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>12%</div>
                            </div>
                        </div>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                                <HardDrive color="var(--sentinel-green)" size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MEMORY</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>4.2 GB</div>
                            </div>
                        </div>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                                <Wifi color="var(--sentinel-orange)" size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NETWORK OUT</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{networkLocked ? '0 KB/s' : '1.2 MB/s'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Self Diagnosis Tool */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Search size={18} color="var(--sentinel-blue)" />
                                <span style={{ fontWeight: 600 }}>Self-Diagnosis Tool</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last scan: 2 hours ago</span>
                        </div>

                        {isScanning ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem' }}>
                                    <span>Scanning file system...</span>
                                    <span>{scanProgress}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#2C3040', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${scanProgress}%`, height: '100%', background: 'var(--sentinel-blue)', transition: 'width 0.1s' }}></div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <button onClick={handleScan} className="btn btn-primary" style={{ background: 'var(--sentinel-blue)', color: 'white' }}>
                                    RUN QUICK SCAN
                                </button>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Checks for known LOLBin misuse signatures and persistence mechanisms.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Live Graph */}
                    <div className="card" style={{ height: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <span style={{ fontWeight: 600 }}>Local Process Activity</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--sentinel-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={12} /> REAL-TIME
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockGraphData}>
                                <defs>
                                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--sentinel-green)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--sentinel-green)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'white' }} />
                                <Area type="monotone" dataKey="activity" stroke="var(--sentinel-green)" fillOpacity={1} fill="url(#colorActivity)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* Right Column: Status & Logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Active Threat Panel */}
                    <div className="card" style={{ borderColor: 'var(--sentinel-red)', borderWidth: '1px', borderStyle: 'solid' }}>
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '16px' }}>
                                <AlertOctagon size={40} color="var(--sentinel-red)" className="animate-pulse" />
                            </div>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Threat Detected</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                                Abnormal behavior in <b>powershell.exe</b>.
                            </p>
                            <button className="btn btn-primary" style={{ background: 'var(--sentinel-red)', color: 'white', width: '100%' }}>
                                VIEW INCIDENT DETAILS
                            </button>
                        </div>
                    </div>

                    {/* Local Recent Events */}
                    <div className="card" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <FileWarning size={16} color="var(--text-primary)" />
                            <span style={{ fontWeight: 600 }}>Recent Local Events</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {localEvents.map((ev, i) => (
                                <div key={i} style={{
                                    padding: '12px',
                                    background: '#232533',
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${ev.type === 'CRITICAL' ? 'var(--sentinel-red)' : ev.type === 'WARN' ? 'var(--sentinel-orange)' : 'var(--sentinel-blue)'}`
                                }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ev.event}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{ev.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default UserDashboard;
