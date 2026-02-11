import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, User as UserIcon, FileText as FileTextIcon, Clock as ClockIcon, Settings as SettingsIcon, Server, Download, Copy, CheckCircle, XCircle, Activity } from 'lucide-react';

const API_URL = 'http://localhost:8082/api';

const Systems = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<any[]>([]);
    const [endpoints, setEndpoints] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddEndpointModal, setShowAddEndpointModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await fetch(`${API_URL}/users`);
                const data = await res.json();
                setUsers(data);
            } else if (activeTab === 'endpoints') {
                // Fetch hosts/agents as endpoints
                const res = await fetch(`${API_URL}/hosts`);
                if (res.ok) {
                    const data = await res.json();
                    setEndpoints(data);
                }
            } else if (activeTab === 'rules') {
                const res = await fetch(`${API_URL}/rules`);
                if (res.ok) {
                    const data = await res.json();
                    setRules(data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        }
        setLoading(false);
    };

    const renderUsers = () => (
        <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '20px' }}>User Profile</th>
                        <th style={{ padding: '20px' }}>Role Permission</th>
                        <th style={{ padding: '20px' }}>Activity Status</th>
                        <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', background: '#232533', borderRadius: '8px', color: 'var(--sentinel-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                                        {user.initials}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '20px' }}>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid',
                                    color: user.role === 'ADMIN' ? 'var(--sentinel-red)' : 'var(--sentinel-blue)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)'
                                }}>
                                    {user.role}
                                </span>
                            </td>
                            <td style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: user.status === 'ACTIVE' ? 'var(--sentinel-green)' : 'var(--text-muted)' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: user.status === 'ACTIVE' ? 'var(--sentinel-green)' : 'var(--text-muted)' }}></div>
                                    {user.status}
                                </div>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', color: 'var(--text-secondary)' }}>
                                    <Edit2 size={16} style={{ cursor: 'pointer' }} />
                                    <Trash2 size={16} style={{ cursor: 'pointer' }} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderEndpoints = () => (
        <>
            <div className="card" style={{ marginBottom: '24px', padding: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={20} color="var(--sentinel-blue)" />
                    How to Connect Windows Endpoints
                </h3>
                <ol style={{ color: 'var(--text-secondary)', paddingLeft: '20px', fontSize: '0.9rem', lineHeight: '1.8' }}>
                    <li>Download the agent installer using the button above</li>
                    <li>Extract the ZIP file on your Windows endpoint</li>
                    <li>Right-click <code>install.ps1</code> and select "Run with PowerShell" (as Administrator)</li>
                    <li>When prompted, enter this server URL: <code>http://{window.location.hostname}:8082</code></li>
                    <li>Enter the enrollment password: <code>MySecureProjectPassword2026!</code></li>
                    <li>The endpoint will appear below once enrolled successfully</li>
                </ol>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '20px' }}>Hostname</th>
                            <th style={{ padding: '20px' }}>IP Address</th>
                            <th style={{ padding: '20px' }}>OS Version</th>
                            <th style={{ padding: '20px' }}>Environment</th>
                            <th style={{ padding: '20px' }}>Status</th>
                            <th style={{ padding: '20px' }}>Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {endpoints.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No endpoints connected yet. Download and install the agent on your Windows machines.
                                </td>
                            </tr>
                        ) : (
                            endpoints.map((endpoint) => (
                                <tr key={endpoint.host_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '20px', fontWeight: 600 }}>{endpoint.hostname}</td>
                                    <td style={{ padding: '20px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{endpoint.ip_address || 'N/A'}</td>
                                    <td style={{ padding: '20px', fontSize: '0.85rem' }}>{endpoint.os_name} {endpoint.os_version}</td>
                                    <td style={{ padding: '20px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                                            color: endpoint.environment === 'prod' ? 'var(--sentinel-red)' : 'var(--sentinel-blue)',
                                            background: 'rgba(255,255,255,0.05)'
                                        }}>
                                            {endpoint.environment?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {endpoint.status === 'active' ? (
                                                <><CheckCircle size={14} color="var(--sentinel-green)" /> <span style={{ color: 'var(--sentinel-green)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE</span></>
                                            ) : (
                                                <><XCircle size={14} color="var(--text-muted)" /> <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>INACTIVE</span></>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {endpoint.last_seen ? new Date(endpoint.last_seen).toLocaleString() : 'Never'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );

    const renderRules = () => (
        <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '20px' }}>Rule Name</th>
                        <th style={{ padding: '20px' }}>Severity</th>
                        <th style={{ padding: '20px' }}>Status</th>
                        <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rules.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No detection rules configured yet.
                            </td>
                        </tr>
                    ) : (
                        rules.map((rule: any) => (
                            <tr key={rule.rule_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '20px', fontWeight: 600 }}>{rule.rule_name}</td>
                                <td style={{ padding: '20px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                                        color: rule.severity_default === 'high' ? 'var(--sentinel-red)' : 'var(--sentinel-orange)',
                                        background: 'rgba(255,255,255,0.05)'
                                    }}>
                                        {rule.severity_default?.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <span style={{ color: 'var(--sentinel-green)', fontSize: '0.85rem' }}>Enabled</span>
                                </td>
                                <td style={{ padding: '20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', color: 'var(--text-secondary)' }}>
                                        <Edit2 size={16} style={{ cursor: 'pointer' }} />
                                        <Trash2 size={16} style={{ cursor: 'pointer' }} />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderAudit = () => (
        <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Audit Log</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                System audit logs will appear here once user activities are tracked.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    ⏱️ <strong>Recent Actions:</strong> No audit events recorded yet
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>System Settings</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Enrollment Password</label>
                    <input
                        type="text"
                        className="input-field"
                        value="MySecureProjectPassword2026!"
                        readOnly
                        style={{ fontFamily: 'monospace', background: '#232533' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Agents must provide this password during enrollment
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Server URL</label>
                    <input
                        type="text"
                        className="input-field"
                        value={`http://${window.location.hostname}:8082`}
                        readOnly
                        style={{ fontFamily: 'monospace', background: '#232533' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Agents connect to this URL to send telemetry
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Alert Retention (Days)</label>
                    <input
                        type="number"
                        className="input-field"
                        defaultValue={30}
                        style={{ maxWidth: '200px' }}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={activeTab === 'users' ? "btn btn-primary" : "btn btn-ghost"}
                        onClick={() => setActiveTab('users')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: activeTab !== 'users' ? 'var(--text-muted)' : undefined }}
                    >
                        <UserIcon size={16} /> USERS
                    </button>
                    <button
                        className={activeTab === 'endpoints' ? "btn btn-primary" : "btn btn-ghost"}
                        onClick={() => setActiveTab('endpoints')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: activeTab !== 'endpoints' ? 'var(--text-muted)' : undefined }}
                    >
                        <Server size={16} /> ENDPOINTS
                    </button>
                    <button
                        className={activeTab === 'rules' ? "btn btn-primary" : "btn btn-ghost"}
                        onClick={() => setActiveTab('rules')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: activeTab !== 'rules' ? 'var(--text-muted)' : undefined }}
                    >
                        <FileTextIcon size={16} /> RULES
                    </button>
                    <button
                        className={activeTab === 'audit' ? "btn btn-primary" : "btn btn-ghost"}
                        onClick={() => setActiveTab('audit')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: activeTab !== 'audit' ? 'var(--text-muted)' : undefined }}
                    >
                        <ClockIcon size={16} /> AUDIT
                    </button>
                    <button
                        className={activeTab === 'settings' ? "btn btn-primary" : "btn btn-ghost"}
                        onClick={() => setActiveTab('settings')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: activeTab !== 'settings' ? 'var(--text-muted)' : undefined }}
                    >
                        <SettingsIcon size={16} /> SETTINGS
                    </button>
                </div>

                {activeTab === 'users' && (
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '6px' }}>
                        <Plus size={16} /> New User
                    </button>
                )}

                {activeTab === 'endpoints' && (
                    <a
                        href={`http://${window.location.hostname}:8082/api/agent/download`}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '6px', textDecoration: 'none' }}
                    >
                        <Download size={16} /> Download Agent
                    </a>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                    <Activity className="animate-spin" style={{ margin: '0 auto', color: 'var(--sentinel-blue)' }} />
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'endpoints' && renderEndpoints()}
                    {activeTab === 'rules' && renderRules()}
                    {activeTab === 'audit' && renderAudit()}
                    {activeTab === 'settings' && renderSettings()}
                </>
            )}
        </div>
    );
};

export default Systems;
