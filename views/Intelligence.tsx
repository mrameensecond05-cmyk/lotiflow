import React, { useState, useEffect } from 'react';
import { Send, Terminal, Shield, Activity } from 'lucide-react';

const API_URL = 'http://localhost:8082/api';

const Intelligence = () => {
    const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'telemetry'
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch alerts
    const fetchAlerts = () => {
        fetch(`${API_URL}/alerts`)
            .then(res => res.json())
            .then(data => {
                setAlerts(data);
                if (data.length > 0 && !selectedAlert) setSelectedAlert(data[0]);
                setLoading(false);
            })
            .catch(err => console.error("Failed to fetch alerts:", err));
    };

    // Fetch live telemetry logs
    const fetchLogs = () => {
        fetch(`${API_URL}/logs/all`)
            .then(res => res.json())
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => console.error("Failed to fetch logs:", err));
    };

    useEffect(() => {
        if (activeTab === 'alerts') {
            fetchAlerts();
            const interval = setInterval(fetchAlerts, 10000);
            return () => clearInterval(interval);
        } else {
            fetchLogs();
            const interval = setInterval(fetchLogs, 5000); // More frequent for telemetry
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const handleAcknowledge = async (id, e) => {
        e.stopPropagation();
        try {
            await fetch(`${API_URL}/alerts/${id}/ack`, { method: 'POST' });
            setAlerts(prev => prev.map(a => a.alert_id === id ? { ...a, status: 'open' } : a));
        } catch (err) {
            console.error("Ack failed", err);
        }
    };

    const renderAlerts = () => (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Main List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                    <th style={{ padding: '16px', fontWeight: 600 }}>TIMESTAMP</th>
                                    <th style={{ padding: '16px', fontWeight: 600 }}>SEVERITY</th>
                                    <th style={{ padding: '16px', fontWeight: 600 }}>DETECTION RULE</th>
                                    <th style={{ padding: '16px', fontWeight: 600 }}>HOST</th>
                                    <th style={{ padding: '16px', fontWeight: 600 }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert) => (
                                    <tr key={alert.alert_id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setSelectedAlert(alert)}>
                                        <td style={{ padding: '16px' }}>{new Date(alert.timestamp).toLocaleTimeString()}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`status-badge ${alert.severity === 'critical' ? 'status-critical' : 'status-high'}`}>
                                                {alert.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>{alert.rule_name}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{alert.host}</td>
                                        <td style={{ padding: '16px', color: 'var(--sentinel-green)' }}>
                                            {alert.status === 'new' ? (
                                                <button
                                                    onClick={(e) => handleAcknowledge(alert.alert_id, e)}
                                                    style={{ background: 'none', border: '1px solid var(--sentinel-green)', color: 'var(--sentinel-green)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                                >
                                                    ACKNOWLEDGE
                                                </button>
                                            ) : alert.status.toUpperCase()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Command Inspector */}
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>COMMAND INSPECTOR</span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#374151', borderRadius: '4px' }}>PID: 6422</span>
                            </div>
                            <div style={{
                                background: '#0D0E15',
                                borderRadius: '8px',
                                padding: '16px',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                color: 'var(--sentinel-green)',
                                lineHeight: '1.5',
                                minHeight: '150px'
                            }}>
                                {selectedAlert?.description || 'Select an alert to view details'}
                            </div>
                        </div>

                        {/* Detection Context */}
                        <div className="card">
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '24px' }}>DETECTION CONTEXT</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Parent Process</span>
                                <span style={{ fontWeight: 600 }}>wmiprvse.exe</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>User Account</span>
                                <span style={{ color: 'var(--sentinel-blue)' }}>CORP\Administrator</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Confidence Score</span>
                                <span style={{ color: 'var(--sentinel-red)', fontWeight: 700 }}>80%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Active Case */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card">
                        <div style={{ fontSize: '0.75rem', color: 'var(--sentinel-green)', marginBottom: '8px' }}>ACTIVE CASE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>LOTL-2024-MAY-001</div>

                        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, borderBottom: '2px solid var(--sentinel-green)', paddingBottom: '12px' }}>NOTES (1)</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ARTIFACTS (0)</span>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '24px' }}>
                            <input className="input-field" placeholder="Add a case note..." style={{ paddingRight: '40px' }} />
                            <Send size={16} color="var(--sentinel-green)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>

                        <div style={{ background: '#232533', borderRadius: '8px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--sentinel-blue)', fontWeight: 600 }}>J. HARKNESS</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10:05:00</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Case initialized after detection of PowerShell download cradle.
                            </p>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn btn-primary" style={{ width: '100%', fontWeight: 700 }}>
                                GENERATE REPORT
                            </button>
                            <button className="btn btn-ghost" style={{ width: '100%', border: '1px solid var(--border-color)', color: 'var(--sentinel-red)' }}>
                                CLOSE CASE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const renderLiveTelemetry = () => (
        <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Activity size={20} color="var(--sentinel-green)" className="animate-pulse" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>LIVE EVENT STREAM</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--sentinel-green)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sentinel-green)' }} className="animate-pulse"></div>
                    REAL-TIME
                </div>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <th style={{ padding: '16px', fontWeight: 600 }}>TIMESTAMP</th>
                            <th style={{ padding: '16px', fontWeight: 600 }}>HOST</th>
                            <th style={{ padding: '16px', fontWeight: 600 }}>PROCESS</th>
                            <th style={{ padding: '16px', fontWeight: 600 }}>COMMAND LINE</th>
                            <th style={{ padding: '16px', fontWeight: 600 }}>USER</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Terminal size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                    <div>No telemetry data available. Waiting for endpoint connections...</div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 500 }}>{log.hostname}</td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--sentinel-blue)' }}>
                                        {log.process_name}
                                    </td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {log.command_line || 'N/A'}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.user_name}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Action Bar with Tabs */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button
                    className={activeTab === 'alerts' ? "btn btn-primary" : "btn btn-ghost"}
                    onClick={() => setActiveTab('alerts')}
                    style={{
                        borderRadius: '20px',
                        padding: '0.5rem 1.5rem',
                        fontWeight: 600,
                        color: activeTab !== 'alerts' ? 'var(--text-secondary)' : undefined
                    }}
                >
                    ACTIVE ALERTS ({alerts.length})
                </button>
                <button
                    className={activeTab === 'telemetry' ? "btn btn-primary" : "btn btn-ghost"}
                    onClick={() => setActiveTab('telemetry')}
                    style={{
                        borderRadius: '20px',
                        padding: '0.5rem 1.5rem',
                        fontWeight: 600,
                        color: activeTab !== 'telemetry' ? 'var(--text-secondary)' : undefined
                    }}
                >
                    LIVE TELEMETRY
                </button>
            </div>

            {/* Content */}
            {activeTab === 'alerts' ? renderAlerts() : renderLiveTelemetry()}
        </div>
    );
};

export default Intelligence;
