import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Shield, AlertOctagon, Activity, Cpu, HardDrive, Wifi, FileWarning, Lock, Unlock, Search, Plus, Terminal, Copy
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API_URL = '/api';
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
    // States
    const [systemStatus, setSystemStatus] = useState<'safe' | 'risk'>('risk');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [networkLocked, setNetworkLocked] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [endpoints, setEndpoints] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [myStatus, setMyStatus] = useState<'online' | 'offline'>('offline');
    const [serverVerified, setServerVerified] = useState(false);
    const [serverPing, setServerPing] = useState<number | null>(null);

    useEffect(() => {
        // Fetch logs
        const fetchLogs = async () => {
            try {
                const res = await fetch(`${API_URL}/logs/all`);
                const data = await res.json();
                setLogs(data.slice(0, 50));
            } catch (err) {
                console.error("Failed to fetch logs", err);
            }
        };

        const fetchStatus = async () => {
            try {
                // Fetch hosts with computed connectivity_status
                const res = await fetch(`${API_URL}/hosts`);
                const data = await res.json();
                setEndpoints(data);

                // Fetch agents for detailed agent connectivity
                const agentRes = await fetch(`${API_URL}/agents`);
                const agentData = await agentRes.json();
                setAgents(agentData);

                // Determine overall status: online if ANY host or agent is online
                const anyHostOnline = data.some((h: any) => h.connectivity_status === 'online');
                const anyAgentOnline = agentData.some((a: any) => a.connectivity_status === 'online');
                const isOnline = anyHostOnline || anyAgentOnline;
                setMyStatus(isOnline ? 'online' : 'offline');
                setSystemStatus(isOnline ? 'safe' : 'risk');
            } catch (err) {
                console.error("Failed to fetch status", err);
            }
        };

        // Verify server connection
        const verifyConnection = async () => {
            try {
                const start = performance.now();
                const res = await fetch(`${API_URL}/connection/verify`);
                const elapsed = Math.round(performance.now() - start);
                if (res.ok) {
                    setServerVerified(true);
                    setServerPing(elapsed);
                } else {
                    setServerVerified(false);
                    setServerPing(null);
                }
            } catch {
                setServerVerified(false);
                setServerPing(null);
            }
        };

        fetchLogs();
        fetchStatus();
        verifyConnection();
        const interval = setInterval(() => {
            fetchLogs();
            fetchStatus();
            verifyConnection();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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
        <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', padding: '2rem', color: 'var(--text-primary)' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Shield size={32} color={myStatus === 'online' ? 'var(--sentinel-green)' : 'var(--sentinel-red)'} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Endpoint Monitor</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Local Agent Interface • Host: {endpoints[0]?.hostname || 'WORKSTATION-01'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Isolation Toggle */}
                    <button
                        className="btn"
                        onClick={() => setShowInstallModal(true)}
                        style={{
                            background: 'var(--sentinel-blue)',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            gap: '8px',
                            fontWeight: 600
                        }}
                    >
                        <Plus size={16} /> ADD COMPUTER
                    </button>

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

                    <div className={`status-badge ${myStatus === 'online' ? 'status-active' : 'status-critical'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: myStatus === 'online' ? 'var(--sentinel-green)' : 'var(--sentinel-red)', boxShadow: myStatus === 'online' ? '0 0 8px var(--sentinel-green)' : 'none' }}></div>
                        {myStatus === 'online' ? 'CONNECTED' : 'DISCONNECTED'}
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Left Column: Metrics & Tools */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Connection Verification Banner */}
                    <div className="card" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderLeft: `3px solid ${serverVerified ? 'var(--sentinel-green)' : 'var(--sentinel-red)'}`,
                        padding: '12px 20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: serverVerified ? 'var(--sentinel-green)' : 'var(--sentinel-red)',
                                boxShadow: serverVerified ? '0 0 10px var(--sentinel-green)' : '0 0 10px var(--sentinel-red)',
                                animation: 'pulse 2s infinite'
                            }}></div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    {serverVerified ? '✅ Server Connection Verified' : '❌ Server Connection Failed'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {serverVerified
                                        ? `Latency: ${serverPing}ms • ${agents.filter(a => a.connectivity_status === 'online').length} agent(s) online`
                                        : 'Cannot reach LOTIflow server — check backend is running'
                                    }
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {agents.length > 0 && agents.map((agent: any, i: number) => (
                                <div key={i} style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                                    background: agent.connectivity_status === 'online' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: agent.connectivity_status === 'online' ? 'var(--sentinel-green)' : 'var(--sentinel-red)',
                                    border: `1px solid ${agent.connectivity_status === 'online' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                                }}>
                                    {agent.hostname}: {agent.connectivity_status.toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>

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

                    {/* Live System Logs */}
                    <div className="card" style={{ flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Terminal size={16} color="var(--text-primary)" />
                            <span style={{ fontWeight: 600 }}>Live System Logs (Agent Stream)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {logs.map((log, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '12px 8px',
                                    borderBottom: 'var(--border)',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: 'var(--text-muted)', minWidth: '70px' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span style={{ color: 'var(--sentinel-blue)', minWidth: '100px', fontWeight: 500 }}>{log.process_name}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{log.command_line || 'N/A'}</span>
                                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{log.user_name}</span>
                                </div>
                            ))}
                            {logs.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No logs incoming...</div>}
                        </div>
                    </div>

                </div>

            </div>

            {/* Add Device Modal */}
            {showInstallModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '600px', position: 'relative' }}>
                        <h2 style={{ marginBottom: '16px' }}>Add New Computer</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            To monitor a new Windows device, run this command in **PowerShell (Administrator)**:
                        </p>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                                <a
                                    href={`http://${window.location.hostname}:8082/api/agent/download`}
                                    className="btn"
                                    style={{
                                        background: 'var(--sentinel-blue)',
                                        color: 'white',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <HardDrive size={16} /> DOWNLOAD AGENT BUNDLE
                                </a>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(.zip, ~10KB)</span>
                            </div>

                            <ol style={{ color: 'var(--text-secondary)', paddingLeft: '20px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                <li>Download and <b>Extract</b> the zip file on the target Windows machine.</li>
                                <li>Right-click <code>install.ps1</code> and select <b>Run with PowerShell</b>.</li>
                                <li>When prompted for the Server URL, enter:</li>
                            </ol>

                            <div style={{
                                background: '#1e2029',
                                padding: '12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                color: 'var(--sentinel-green)',
                                border: '1px solid var(--border-color)',
                                marginTop: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>http://{window.location.hostname}:8082</span>
                                <button className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    onClick={() => navigator.clipboard.writeText(`http://${window.location.hostname}:8082`)}
                                >
                                    <Copy size={14} /> COPY
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn btn-ghost" onClick={() => setShowInstallModal(false)}>CLOSE</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserDashboard;
