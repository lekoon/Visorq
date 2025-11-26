import React from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Download, AlertCircle, DollarSign, Users } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();

    // KPI Calculations
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const avgScore = projects.length > 0
        ? (projects.reduce((acc, p) => acc + p.score, 0) / projects.length).toFixed(1)
        : '0';

    // Advanced Analytics
    const highPriorityProjects = projects.filter(p => p.score > 8).length;
    const atRiskProjects = projects.filter(p => {
        if (!p.endDate || p.status === 'completed') return false;
        const daysUntilEnd = differenceInDays(parseISO(p.endDate), new Date());
        return daysUntilEnd < 30 && daysUntilEnd > 0 && p.status === 'active';
    }).length;

    // Resource Utilization
    const totalResourceCapacity = resourcePool.reduce((sum, r) => sum + r.totalQuantity, 0);
    const allocatedResources = projects
        .filter(p => p.status === 'active')
        .reduce((sum, p) => sum + p.resourceRequirements.reduce((s, r) => s + r.count, 0), 0);
    const resourceUtilization = totalResourceCapacity > 0
        ? ((allocatedResources / totalResourceCapacity) * 100).toFixed(1)
        : '0';

    // Portfolio Health Score (0-100)
    const portfolioHealth = (() => {
        if (projects.length === 0) return '0';
        const avgProjectScore = projects.reduce((sum, p) => sum + p.score, 0) / projects.length;
        const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
        const resourceEfficiency = parseFloat(resourceUtilization);
        return ((avgProjectScore * 10 + completionRate + resourceEfficiency) / 3).toFixed(0);
    })();

    const topProjects = [...projects].sort((a, b) => b.score - a.score).slice(0, 5);

    // Chart Data
    const scoreDistribution = projects.map(p => ({
        name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
        score: parseFloat(p.score.toFixed(1)),
        full: p
    }));

    // Status Distribution for Pie Chart
    const statusData = [
        { name: t('projects.active'), value: activeProjects, color: '#10b981' },
        { name: t('projects.planning'), value: projects.filter(p => p.status === 'planning').length, color: '#3b82f6' },
        { name: t('projects.onHold'), value: projects.filter(p => p.status === 'on-hold').length, color: '#f59e0b' },
        { name: t('projects.completed'), value: completedProjects, color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    // Resource Allocation by Type
    const resourceAllocation = resourcePool.map(resource => {
        const allocated = projects
            .filter(p => p.status === 'active')
            .reduce((sum, p) => {
                const req = p.resourceRequirements.find(r => r.resourceId === resource.id);
                return sum + (req ? req.count : 0);
            }, 0);
        return {
            name: resource.name,
            total: resource.totalQuantity,
            allocated,
            available: resource.totalQuantity - allocated,
            utilization: ((allocated / resource.totalQuantity) * 100).toFixed(0)
        };
    });

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Rank', 'Project Name', 'Status', 'Score', 'Start Date', 'End Date', 'Resources'];
        const rows = projects.map(p => [
            p.rank,
            p.name,
            p.status,
            p.score.toFixed(2),
            p.startDate || 'N/A',
            p.endDate || 'N/A',
            p.resourceRequirements.reduce((sum, r) => sum + r.count, 0)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ctpm-projects-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8">
            {/* Header with Export */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Download size={18} />
                    {t('common.export')}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('dashboard.totalProjects')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalProjects}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-100 text-green-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('dashboard.active')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{activeProjects}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('dashboard.completed')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{completedProjects}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-100 text-orange-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('dashboard.avgScore')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{avgScore}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-xl ${parseFloat(portfolioHealth) > 70 ? 'bg-green-100 text-green-600' : parseFloat(portfolioHealth) > 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('dashboard.portfolioHealth')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{portfolioHealth}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="text-red-600" size={24} />
                        <h3 className="font-bold text-red-900">{t('dashboard.atRisk')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{atRiskProjects}</p>
                    <p className="text-sm text-red-700 mt-1">{t('dashboard.projectsDueSoon')}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-yellow-600" size={24} />
                        <h3 className="font-bold text-yellow-900">{t('dashboard.highPriority')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{highPriorityProjects}</p>
                    <p className="text-sm text-yellow-700 mt-1">{t('dashboard.scoreGt8')}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-blue-600" size={24} />
                        <h3 className="font-bold text-blue-900">{t('dashboard.resourceUtilization')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{resourceUtilization}%</p>
                    <p className="text-sm text-blue-700 mt-1">{allocatedResources} / {totalResourceCapacity} {t('dashboard.allocated')}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Distribution */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{t('dashboard.projectPriorityScores')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                                    {scoreDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score > 8 ? '#10b981' : entry.score > 5 ? '#3b82f6' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution Pie */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{t('dashboard.projectStatus')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Resource Allocation Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">{t('dashboard.resourceAllocationAnalysis')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-left font-semibold text-slate-600">{t('dashboard.resourceType')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600">{t('dashboard.totalCapacity')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600">{t('dashboard.allocated')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600">{t('dashboard.available')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600">{t('dashboard.utilization')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600">{t('dashboard.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resourceAllocation.map((resource) => {
                                const util = parseFloat(resource.utilization);
                                return (
                                    <tr key={resource.name} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-900">{resource.name}</td>
                                        <td className="p-4 text-slate-600">{resource.total}</td>
                                        <td className="p-4 text-slate-600">{resource.allocated}</td>
                                        <td className="p-4 text-slate-600">{resource.available}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
                                                    <div
                                                        className={`h-2 rounded-full ${util > 90 ? 'bg-red-500' : util > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(util, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">{resource.utilization}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${util > 90 ? 'bg-red-100 text-red-700' : util > 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                {util > 90 ? t('dashboard.overloaded') : util > 70 ? t('dashboard.high') : t('dashboard.healthy')}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Projects List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">{t('dashboard.topPriorityProjects')}</h3>
                <div className="space-y-4">
                    {topProjects.map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                    #{i + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{p.name}</p>
                                    <p className="text-sm text-slate-500">{p.description?.substring(0, 60)}...</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">{t('projects.score')}</p>
                                    <p className="text-xl font-bold text-blue-600">{p.score.toFixed(2)}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${p.status === 'active' ? 'bg-green-100 text-green-700' :
                                    p.status === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {p.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
