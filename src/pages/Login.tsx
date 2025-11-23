import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useStore();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (username === 'admin' && password === '123456') {
            login(username, 'admin');
            navigate('/');
        } else if (username === 'user' && password === '123456') {
            login(username, 'user');
            navigate('/');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                        <Lock size={32} />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">CTPM Login</h1>
                <p className="text-center text-slate-500 mb-8 text-sm">Enter your credentials to access the dashboard</p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Default Admin: admin / 123456</p>
                    <p>Default User: user / 123456</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
