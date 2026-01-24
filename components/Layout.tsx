import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Shield, Server, Search, Bell, User, Zap, Circle
} from 'lucide-react';

const Layout = () => {
    const location = useLocation();

    const getPageTitle = (path: string) => {
        if (path.includes('intelligence')) return 'Intelligence';
        if (path.includes('systems')) return 'Systems';
        return 'Dashboard'; // Default to Overview
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
            {/* Sidebar */}
            <aside style={{ width: '260px', backgroundColor: 'var(--bg-sidebar)', padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--sentinel-green)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={20} color="#000" fill="#000" />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>SENTINEL</span>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1 }}>
                    <NavLink to="/overview" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} /> Overview
                    </NavLink>
                    <NavLink to="/intelligence" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <Shield size={20} /> Intelligence
                    </NavLink>
                    <NavLink to="/systems" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <Server size={20} /> Systems
                    </NavLink>
                </nav>

                {/* Bottom Status */}
                <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--sentinel-green)', fontWeight: 600 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sentinel-green)' }}></div>
                        ENGINE ONLINE
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Monitoring 2.4k nodes<br />across 3 regions.
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <header style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{getPageTitle(location.pathname)}</h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Search */}
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" className="input-field" placeholder="Search assets, logs..." style={{ paddingLeft: '36px' }} />
                        </div>

                        {/* Actions */}
                        <button className="btn" style={{ background: 'rgba(0, 208, 132, 0.1)', color: 'var(--sentinel-green)', fontSize: '0.75rem', gap: '6px' }}>
                            <Zap size={14} /> LOW LATENCY MODE
                        </button>

                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
                            <Bell size={20} style={{ cursor: 'pointer' }} />
                            <User size={20} style={{ cursor: 'pointer' }} />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
