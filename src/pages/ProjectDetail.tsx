import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Calendar, TrendingUp, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();

    const project = projects.find(p => p.id === projectId);

    // 计算资源投入数据
    const resourceData = useMemo(() => {
        if (!project) return [];

        const dataMap = new Map<string, { name: string; value: number; color: string }>();
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

        project.resourceRequirements.forEach((req, idx) => {
            const resource = resourcePool.find(r => r.id === req.resourceId);
            if (resource) {
                const hours = req.count * req.duration * (req.unit === 'month' ? 160 : req.unit === 'day' ? 8 : 1920);
                dataMap.set(resource.id, {
                    name: resource.name,
                    value: hours,
                    color: colors[idx % colors.length]
                });
            }
        });

        return Array.from(dataMap.values());
    }, [project, resourcePool]);

    // 模拟历史趋势数据
    const trendData = useMemo(() => {
        return [
            { week: 'Week 1', hours: 120 },
            { week: 'Week 2', hours: 150 },
            { week: 'Week 3', hours: 180 },
            { week: 'Week 4', hours: 160 },
        ];
    }, []);

    // 本周分配明细
    const weeklyAllocations = useMemo(() => {
        if (!project) return [];

        return project.resourceRequirements.map(req => {
            const resource = resourcePool.find(r => r.id === req.resourceId);
            return {
                employee: resource?.name || 'Unknown',
                role: resource?.name || 'N/A',
                hours: req.count * (req.unit === 'day' ? 8 : req.unit === 'month' ? 160 : 1920),
                projects: 1
            };
        });
    }, [project, resourcePool]);

    if (!project) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('projectDetail.notFound')}</h2>
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-blue-600 hover:underline"
                    >
                        {t('projectDetail.backToProjects')}
                    </button>
                </div>
            </div>
        );
    }

    const totalHours = resourceData.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="space-y-6">
            {/* Project Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    {t('common.back')}
                </button>

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded text-sm font-bold ${project.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                project.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {project.priority || 'P2'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                                    project.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
                        <p className="text-slate-600 mb-4">{project.description}</p>
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{project.startDate} - {project.endDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} />
                                <span>{t('projectDetail.score')}: {project.score.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/resources?project=${project.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Edit2 size={18} />
                        {t('projectDetail.adjustResources')}
                    </button>
                </div>
            </div>

            {/* Resource Investment Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">{t('projectDetail.resourceInvestment')}</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={resourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {resourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${value}h`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">{t('projectDetail.totalHours')}</p>
                        <p className="text-2xl font-bold text-slate-900">{totalHours}h</p>
                    </div>
                </div>

                {/* Historical Trend */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">{t('projectDetail.historicalTrend')}</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="week" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="hours"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name={t('projectDetail.hours')}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Weekly Allocation Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('projectDetail.weeklyAllocation')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.employee')}
                                </th>
                                <th className="text-left p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.role')}
                                </th>
                                <th className="text-center p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.allocatedHours')}
                                </th>
                                <th className="text-center p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.projectCount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyAllocations.map((allocation, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                                {allocation.employee.charAt(0)}
                                            </div>
                                            <span className="font-medium text-slate-900">{allocation.employee}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-600">{allocation.role}</td>
                                    <td className="p-3 text-center">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {allocation.hours}h
                                        </span>
                                    </td>
                                    <td className="p-3 text-center text-slate-600">{allocation.projects}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
