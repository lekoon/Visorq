import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { User, Lock, Save } from 'lucide-react';

const Profile: React.FC = () => {
    const { user, updateUser } = useStore();
    const [name, setName] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({ name });
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">My Profile</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{user?.username}</h2>
                        <p className="text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
                        <p className="text-sm text-slate-400 mt-1">ID: {user?.id}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            {message}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
                        >
                            <Save size={20} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
