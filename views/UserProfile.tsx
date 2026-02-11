import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { User, Server, Plus, Save, Terminal } from 'lucide-react';

const UserProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ name: '', email: '' });
    const [machines, setMachines] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMachine, setNewMachine] = useState({
        hostname: '',
        ip_address: '',
        machine_user: '',
        machine_password: ''
    });

    const API_URL = 'http://localhost:8082/api';

    useEffect(() => {
        // Load user data
        const name = localStorage.getItem('userName') || 'User';
        const email = localStorage.getItem('userEmail') || 'user@securepulse.local'; // We should store email in LS on login
        setUser({ name, email });
        fetchMachines();
    }, []);

    const fetchMachines = async () => {
        // In real app, we decode token to get ID, or store ID in LS.
        // For demo, assuming we stored userID. If not, we need to update Login to store it.
        // Let's check logic.
        // Update: Login didn't store ID in LS, only token. 
        // We'll need to parse token or update login. For now, let's mock fetch or rely on an endpoint that uses the token (me).

        // Since backend endpoint requires ID: /api/users/:id/hosts
        // I will assume for this step we might need to fix Login to store userId.
        // Or we can decode the JWT token (if simple base64).
        // Let's implement a safe fallback or mocking for now until Login is updated in next step.
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch(`${API_URL}/users/${userId}/hosts`);
            const data = await res.json();
            if (Array.isArray(data)) setMachines(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddMachine = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert("User session invalid. Please log in again.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/hosts/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newMachine, userId })
            });

            if (res.ok) {
                setShowAddForm(false);
                setNewMachine({ hostname: '', ip_address: '', machine_user: '', machine_password: '' });
                fetchMachines();
                alert("Machine Onboarded Successfully!");
            } else {
                alert("Failed to add machine.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Layout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <User className="text-sentinel-green" /> User Profile
                </h1>

                {/* Profile Card */}
                <div className="card max-w-2xl mb-8">
                    <h2 className="text-xl font-semibold mb-4">Account Details</h2>
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-2xl font-bold">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                            <h3 className="text-lg">{user.name}</h3>
                            <p className="text-gray-400">{user.email}</p>
                            <span className="status-badge status-active mt-2 inline-block">Role: User</span>
                        </div>
                    </div>
                </div>

                {/* Machines Section */}
                <div className="flex justify-between items-center mb-4 max-w-4xl">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Server className="text-sentinel-blue" /> Managed Machines
                    </h2>
                    <button
                        className="btn btn-primary flex items-center gap-2"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        <Plus size={18} /> Add Machine
                    </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="glass-panel p-6 rounded-xl max-w-4xl mb-8 animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4 text-sentinel-green">Onboard New Machine</h3>
                        <form onSubmit={handleAddMachine} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Hostname</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. WORKSTATION-05"
                                    required
                                    value={newMachine.hostname}
                                    onChange={e => setNewMachine({ ...newMachine, hostname: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">IP Address</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. 192.168.1.105"
                                    required
                                    value={newMachine.ip_address}
                                    onChange={e => setNewMachine({ ...newMachine, ip_address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Machine Username</label>
                                <input
                                    className="input-field"
                                    placeholder="Local Admin User"
                                    required
                                    value={newMachine.machine_user}
                                    onChange={e => setNewMachine({ ...newMachine, machine_user: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Machine Password</label>
                                <input
                                    className="input-field"
                                    type="password"
                                    placeholder="*************"
                                    required
                                    value={newMachine.machine_password}
                                    onChange={e => setNewMachine({ ...newMachine, machine_password: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-2">
                                <button type="submit" className="btn btn-primary flex gap-2">
                                    <Save size={18} /> Save Device
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Machines Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
                    {machines.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-500 glass-card rounded-lg">
                            <p>No machines onboarded yet. Click "Add Machine" to start monitoring.</p>
                        </div>
                    ) : (
                        machines.map((m: any) => (
                            <div key={m.host_id} className="card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-50">
                                    <Terminal size={64} className="text-gray-800" />
                                </div>
                                <h3 className="font-bold text-lg">{m.hostname}</h3>
                                <p className="text-sm font-mono text-sentinel-blue mb-2">{m.ip_address}</p>
                                <div className="flex gap-2 text-xs">
                                    <span className={`status-badge ${m.status === 'active' ? 'status-active' : 'status-high'}`}>
                                        {m.status}
                                    </span>
                                    <span className="status-badge bg-gray-800 text-gray-300">
                                        {m.environment}
                                    </span>
                                </div>
                                <p className="mt-4 text-xs text-gray-500">Creds: {m.machine_user} / ***</p>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </Layout>
    );
};

export default UserProfile;
