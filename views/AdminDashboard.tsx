import React from 'react';
import {
    LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { Shield, AlertTriangle, Zap, Activity, Globe, Lock, Users } from 'lucide-react';

const mockLineData = [
    { name: '00', val: 10 }, { name: '04', val: 30 }, { name: '08', val: 50 },
    { name: '12', val: 70 }, { name: '16', val: 90 }, { name: '20', val: 100 }
];

const policyData = [
    { name: 'Compliant', value: 85, color: 'var(--sentinel-green)' },
    { name: 'Outdated', value: 10, color: 'var(--sentinel-orange)' },
    { name: 'Vulnerable', value: 5, color: 'var(--sentinel-red)' },
];

const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Top Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>Global Events</span>
                        <Activity size={16} color="var(--sentinel-blue)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '12px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>24.1k</span>
                        <span className="status-badge status-active">+Live Ingestion</span>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>Active Alerts</span>
                        <Shield size={16} color="var(--sentinel-red)" />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>6</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Across 3 Regions</span>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>Policy Health</span>
                        <Lock size={16} color="var(--sentinel-green)" />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>98.5%</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enforced</span>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>Monitored Nodes</span>
                        <Users size={16} color="var(--sentinel-orange)" />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>842</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Left Col: Charts & Map */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Alert Velocity */}
                    <div className="card" style={{ height: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Global Alert Velocity</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--sentinel-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sentinel-green)' }}></div>
                                REAL-TIME
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockLineData}>
                                <Line type="monotone" dataKey="val" stroke="var(--sentinel-green)" strokeWidth={3} dot={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'white' }} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Global Threat Map */}
                    <div className="card">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Globe size={18} color="var(--sentinel-blue)" /> Global Threat Map
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time location of high-risk signals</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span className="status-badge" style={{ background: '#2C3040', color: '#9CA3AF' }}>US-EAST (4)</span>
                                <span className="status-badge" style={{ background: '#2C3040', color: '#9CA3AF' }}>EU-WEST (2)</span>
                                <span className="status-badge" style={{ background: '#2C3040', color: '#9CA3AF' }}>APAC (0)</span>
                            </div>
                        </div>

                        {/* Abstract Map Grid */}
                        <div className="risk-grid">
                            {Array.from({ length: 60 }).map((_, i) => {
                                // Creating clusters to simulate geography
                                const isUS = (i >= 15 && i <= 18) || (i >= 30 && i <= 33);
                                const isEU = (i >= 21 && i <= 24);

                                let className = 'risk-cell low';

                                // Simulate Active Threats in clusters
                                if (i === 16) className = 'risk-cell high'; // US Critical
                                if (i === 32) className = 'risk-cell med'; // US Warning
                                if (i === 22) className = 'risk-cell high'; // EU Critical

                                // If it's not a region, make it very dim (ocean/empty)
                                const opacity = (isUS || isEU) ? 1 : 0.3;

                                return <div key={i} className={className} style={{ opacity }}></div>;
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Col: Detailed Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Policy Enforcement */}
                    <div className="card">
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Policy Enforcement</div>
                        <div style={{ height: '200px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={policyData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {policyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>85%</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMPLIANT</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {policyData.map((d) => (
                                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                                        {d.name}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>{d.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Threat Vectors */}
                    <div className="card">
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Top Threat Vectors</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                    <span>POWERSHELL</span>
                                    <span>92%</span>
                                </div>
                                <div style={{ height: '4px', background: '#2C3040', borderRadius: '2px' }}>
                                    <div style={{ width: '92%', height: '100%', background: 'var(--sentinel-green)', borderRadius: '2px' }}></div>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                    <span>SUSPICIOUS PARENT</span>
                                    <span>45%</span>
                                </div>
                                <div style={{ height: '4px', background: '#2C3040', borderRadius: '2px' }}>
                                    <div style={{ width: '45%', height: '100%', background: 'var(--sentinel-orange)', borderRadius: '2px' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default Overview;
