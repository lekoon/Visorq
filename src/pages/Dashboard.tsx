import React from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { projects } = useStore();

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const avgScore = projects.length > 0
        ? (projects.reduce((acc, p) => acc + p.score, 0) / projects.length).toFixed(1)
        : 0;

    const topProjects = [...projects].sort((a, b) => b.score - a.score).slice(0, 5);

    const data = projects.map(p => ({
        name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
        score: parseFloat(p.score.toFixed(1)),
        full: p
    }));

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Projects</p>
                        <h3 className="text-2xl font-bold text-slate-900">{totalProjects}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-green-100 text-green-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Active</p>
                        <h3 className="text-2xl font-bold text-slate-900">{activeProjects}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Completed</p>
                        <h3 className="text-2xl font-bold text-slate-900">{completedProjects}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-orange-100 text-orange-600 rounded-xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Avg Score</p>
                        <h3 className="text-2xl font-bold text-slate-900">{avgScore}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Distribution */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Project Priority Scores</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score > 8 ? '#3b82f6' : entry.score > 5 ? '#8b5cf6' : '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Projects List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Top Priority</h3>
                    <div className="space-y-4">
                        {topProjects.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{p.name}</p>
                                        <p className="text-xs text-slate-500">Score: {p.score.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' :
                                        p.status === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {p.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
