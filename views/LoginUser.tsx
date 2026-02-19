import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, ArrowRight, AlertCircle } from 'lucide-react';

const LoginUser = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = '/api';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // FULL BYPASS: No backend call
        setTimeout(() => {
            if (isLogin) {
                // Set Bypass Session
                localStorage.setItem('token', 'session-active-bypass');
                localStorage.setItem('userRole', 'user');
                localStorage.setItem('userName', 'Bypass User');
                localStorage.setItem('userEmail', formData.email);
                localStorage.setItem('userId', 'user-123');
                navigate('/user');
            } else {
                setIsLogin(true);
                alert("Account created! (Bypass mode - no database used)");
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', maxWidth: '420px', width: '100%', borderColor: 'var(--lotiflow-green)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(0, 208, 132, 0.1)', marginBottom: '1rem' }} className="animate-float">
                        <User size={40} color="var(--lotiflow-green)" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{isLogin ? 'User Login' : 'Create Account'}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your Monitored Hosts</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ width: '100%' }}>
                    {!isLogin && (
                        <input className="input-field" placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
                    )}
                    <input className="input-field" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    <input className="input-field" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />

                    {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-900/20 p-2 rounded"><AlertCircle size={14} /> {error}</div>}

                    <button type="submit" disabled={loading} className="btn btn-primary w-full flex justify-center gap-2">
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')} <ArrowRight size={18} />
                    </button>
                </form>

                <div className="text-center mt-6 text-sm">
                    <span className="text-gray-400 cursor-pointer hover:text-white" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Need an account? Register" : "Have an account? Login"}
                    </span>
                </div>

                <p className="text-center mt-4 text-sm text-gray-500 cursor-pointer hover:text-white" onClick={() => navigate('/')}>
                    &larr; Back to Selection
                </p>
            </div>
        </div>
    );
};

export default LoginUser;
