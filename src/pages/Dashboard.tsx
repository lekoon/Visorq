import React from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Download, AlertCircle, DollarSign, Users } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader, StatCard, Card, Button, Badge } from '../components/ui';

const Dashboard: React.FC = () => {
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();

    // KPI Calculations
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const avgScore = projects.length > 0
        ? (projects.reduce((acc, p) => acc + (p.score || 0), 0) / projects.length).toFixed(1)
        : '0';

    // Advanced Analytics
    const highPriorityProjects = projects.filter(p => (p.score || 0) > 8).length;
    const atRiskProjects = projects.filter(p => {
        if (!p.endDate || p.status === 'completed') return false;
        const daysUntilEnd = differenceInDays(parseISO(p.endDate), new Date());
        return daysUntilEnd < 30 && daysUntilEnd > 0 && p.status === 'active';
    }).length;

    // Resource Utilization
    const totalResourceCapacity = resourcePool.reduce((sum, r) => sum + r.totalQuantity, 0);
    const allocatedResources = projects
        .filter(p => p.status === 'active')
        .reduce((sum, p) => sum + (p.resourceRequirements || []).reduce((s, r) => s + r.count, 0), 0);
    const resourceUtilization = totalResourceCapacity > 0
        ? ((allocatedResources / totalResourceCapacity) * 100).toFixed(1)
        : '0';

    // Portfolio Health Score (0-100)
    const portfolioHealth = (() => {
        if (projects.length === 0) return '0';
        const avgProjectScore = projects.reduce((sum, p) => sum + (p.score || 0), 0) / projects.length;
        const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
        const resourceEfficiency = parseFloat(resourceUtilization);
        return ((avgProjectScore * 10 + completionRate + resourceEfficiency) / 3).toFixed(0);
    })();

    const topProjects = [...projects].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

    // Chart Data
    const scoreDistribution = projects.map(p => ({
        name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
        score: parseFloat((p.score || 0).toFixed(1)),
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
                const req = (p.resourceRequirements || []).find(r => r.resourceId === resource.id);
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
            (p.score || 0).toFixed(2),
            p.startDate || 'N/A',
            p.endDate || 'N/A',
            (p.resourceRequirements || []).reduce((sum, r) => sum + r.count, 0)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visorq-projects-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <PageContainer>
            {/* Header with Export */}
            <PageHeader
                title={t('dashboard.title')}
                description={t('dashboard.subtitle')}
                actions={
                    <Button onClick={exportToCSV} variant="primary" icon={Download}>
                        {t('common.export')}
                    </Button>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard
                    title={t('dashboard.totalProjects')}
                    value={totalProjects}
                    icon={TrendingUp}
                    iconColor="blue"
                />
                <StatCard
                    title={t('dashboard.active')}
                    value={activeProjects}
                    icon={Clock}
                    iconColor="green"
                />
                <StatCard
                    title={t('dashboard.completed')}
                    value={completedProjects}
                    icon={CheckCircle}
                    iconColor="purple"
                />
                <StatCard
                    title={t('dashboard.avgScore')}
                    value={avgScore}
                    icon={DollarSign}
                    iconColor="orange"
                />
                <StatCard
                    title={t('dashboard.portfolioHealth')}
                    value={`${portfolioHealth}%`}
                    icon={AlertCircle}
                    iconColor={parseFloat(portfolioHealth) > 70 ? 'green' : parseFloat(portfolioHealth) > 50 ? 'orange' : 'red'}
                />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Score Distribution */}
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('dashboard.projectPriorityScores')}</h3>
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
                </Card>

                {/* Status Distribution Pie */}
                <Card>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('dashboard.projectStatus')}</h3>
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
                </Card>
            </div>

            {/* Resource Allocation Table */}
            <Card>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('dashboard.resourceAllocationAnalysis')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.resourceType')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.totalCapacity')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.allocated')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.available')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.utilization')}</th>
                                <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {resourceAllocation.map((resource) => {
                                const util = parseFloat(resource.utilization);
                                return (
                                    <tr key={resource.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{resource.name}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{resource.total}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{resource.allocated}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{resource.available}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2 max-w-[100px]">
                                                    <div
                                                        className={`h-2 rounded-full ${util > 90 ? 'bg-red-500' : util > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(util, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{resource.utilization}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={util > 90 ? 'danger' : util > 70 ? 'warning' : 'success'} rounded="full">
                                                {util > 90 ? t('dashboard.overloaded') : util > 70 ? t('dashboard.high') : t('dashboard.healthy')}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Top Projects List */}
            <Card>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('dashboard.topPriorityProjects')}</h3>
                <div className="space-y-4">
                    {topProjects.map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                    #{i + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{p.description?.substring(0, 60)}...</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('projects.score')}</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{(p.score || 0).toFixed(2)}</p>
                                </div>
                                <Badge
                                    variant={p.status === 'active' ? 'success' : p.status === 'planning' ? 'primary' : 'neutral'}
                                    rounded="default"
                                >
                                    {p.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </PageContainer>
    );
};

export default Dashboard;
