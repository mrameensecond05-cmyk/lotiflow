import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Server, ArrowRight, AlertCircle, UserPlus, LogIn } from 'lucide-react';

const LoginAdmin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const API_URL = '/api';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // FULL BYPASS: No backend call
        setTimeout(() => {
            try {
                if (isRegistering) {
                    // Auto login as admin for demo
                    localStorage.setItem('token', 'session-active-bypass');
                    localStorage.setItem('userRole', 'admin');
                    localStorage.setItem('userName', formData.full_name || 'Bypass Admin');
                    localStorage.setItem('userEmail', formData.email);
                    localStorage.setItem('userId', 'admin-123');
                    navigate('/overview');
                } else {
                    // Login as admin
                    localStorage.setItem('token', 'session-active-bypass');
                    localStorage.setItem('userRole', 'admin');
                    localStorage.setItem('userName', 'Bypass Admin');
                    localStorage.setItem('userEmail', formData.email);
                    localStorage.setItem('userId', 'admin-123');
                    navigate('/overview');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 500);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#05050A' }}>
            {/* Main Card */}
            <div className="auth-card" style={{
                padding: '2.5rem',
                borderRadius: '24px',
                maxWidth: '400px',
                width: '100%',
                backgroundColor: '#0F1016',
                border: '1px solid #1F212E',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>

                {/* Logo Section */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        borderRadius: '16px',
                        background: '#3B82F6',
                        marginBottom: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                    }}>
                        <Shield size={32} color="white" fill="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>LotiFlow</h1>
                    <p style={{
                        color: '#3B82F6',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase'
                    }}>Active Telemetry Engine</p>
                </div>

                {/* Header */}
                <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>Access Node</h2>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>Authorize connection to local telemetry agent.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3" style={{ width: '100%' }}>
                    {isRegistering && (
                        <input
                            className="input-dark"
                            placeholder="Full Name"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    )}
                    <input
                        className="input-dark"
                        placeholder="Username"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <input
                        className="input-dark"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                    />

                    {error && <div className="text-red-500 text-xs flex items-center gap-2 mt-2"><AlertCircle size={12} /> {error}</div>}

                    <button type="submit" disabled={loading} className="btn-brand mt-2">
                        {loading ? 'Connecting...' : (isRegistering ? 'Register Node' : 'Establish Session')}
                    </button>
                </form>

                {/* Default Access Box */}
                {!isRegistering && (
                    <div style={{
                        marginTop: '1.5rem',
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#161822',
                        borderRadius: '12px',
                        border: '1px solid #1F212E'
                    }}>
                        <p style={{ fontSize: '0.65rem', color: '#3B82F6', fontWeight: 700, marginBottom: '0.25rem' }}>DEFAULT NODE ACCESS</p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>User: <span className="text-gray-400">admin@lotiflow.local</span> / Pass: <span className="text-gray-400">admin</span></p>
                    </div>
                )}

                {/* Footer Links */}
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-xs text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer transition-colors"
                    >
                        {isRegistering ? 'Back to Login' : 'Register Local Workstation'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginAdmin;
