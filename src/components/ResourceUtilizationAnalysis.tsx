import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResourceUtilizationData {
    resourceName: string;
    capacity: number;
    used: number;
    utilization: number;
}

interface AnalysisProps {
    data: ResourceUtilizationData[];
}

const ResourceUtilizationAnalysis: React.FC<AnalysisProps> = ({ data }) => {
    const { t } = useTranslation();

    // Calculate overall metrics
    const totalCapacity = data.reduce((sum, r) => sum + r.capacity, 0);
    const totalUsed = data.reduce((sum, r) => sum + r.used, 0);
    const overallUtilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

    // Categorize resources
    const underutilized = data.filter(r => r.utilization < 50);
    const wellUtilized = data.filter(r => r.utilization >= 50 && r.utilization <= 80);
    const overutilized = data.filter(r => r.utilization > 80 && r.utilization <= 100);
    const overbooked = data.filter(r => r.utilization > 100);

    // Generate recommendations
    const recommendations = [];

    if (underutilized.length > 0) {
        recommendations.push({
            type: 'warning',
            icon: AlertTriangle,
            title: t('resources.analysis.underutilizedTitle'),
            description: t('resources.analysis.underutilizedDesc', {
                count: underutilized.length,
                resources: underutilized.map(r => r.resourceName).join(', ')
            }),
            action: t('resources.analysis.considerReallocation')
        });
    }

    if (overbooked.length > 0) {
        recommendations.push({
            type: 'error',
            icon: AlertTriangle,
            title: t('resources.analysis.overbookedTitle'),
            description: t('resources.analysis.overbookedDesc', {
                count: overbooked.length,
                resources: overbooked.map(r => r.resourceName).join(', ')
            }),
            action: t('resources.analysis.urgentAction')
        });
    }

    if (wellUtilized.length > 0) {
        recommendations.push({
            type: 'success',
            icon: CheckCircle,
            title: t('resources.analysis.wellUtilizedTitle'),
            description: t('resources.analysis.wellUtilizedDesc', {
                count: wellUtilized.length
            }),
            action: t('resources.analysis.maintainBalance')
        });
    }

    // Optimization suggestions
    if (overallUtilization < 60) {
        recommendations.push({
            type: 'info',
            icon: Lightbulb,
            title: t('resources.analysis.optimizationTitle'),
            description: t('resources.analysis.lowUtilization', {
                percentage: overallUtilization.toFixed(1)
            }),
            action: t('resources.analysis.reduceCapacity')
        });
    } else if (overallUtilization > 90) {
        recommendations.push({
            type: 'info',
            icon: Lightbulb,
            title: t('resources.analysis.optimizationTitle'),
            description: t('resources.analysis.highUtilization', {
                percentage: overallUtilization.toFixed(1)
            }),
            action: t('resources.analysis.increaseCapacity')
        });
    }

    const chartData = data.map(r => ({
        name: r.resourceName,
        [t('resources.analysis.used')]: r.used,
        [t('resources.analysis.available')]: Math.max(0, r.capacity - r.used),
        utilization: r.utilization
    }));

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'error': return 'border-red-200 bg-red-50';
            case 'warning': return 'border-yellow-200 bg-yellow-50';
            case 'success': return 'border-green-200 bg-green-50';
            case 'info': return 'border-blue-200 bg-blue-50';
            default: return 'border-slate-200 bg-slate-50';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'error': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            case 'success': return 'text-green-600';
            case 'info': return 'text-blue-600';
            default: return 'text-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-sm font-medium text-slate-500 mb-1">
                        {t('resources.analysis.overallUtilization')}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">
                            {overallUtilization.toFixed(1)}%
                        </span>
                        {overallUtilization > 70 ? (
                            <TrendingUp className="text-green-600" size={20} />
                        ) : (
                            <TrendingDown className="text-yellow-600" size={20} />
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-sm font-medium text-slate-500 mb-1">
                        {t('resources.analysis.totalCapacity')}
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{totalCapacity}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-sm font-medium text-slate-500 mb-1">
                        {t('resources.analysis.totalUsed')}
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{totalUsed}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-sm font-medium text-slate-500 mb-1">
                        {t('resources.analysis.available')}
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                        {Math.max(0, totalCapacity - totalUsed)}
                    </div>
                </div>
            </div>

            {/* Utilization Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {t('resources.analysis.utilizationChart')}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff'
                            }}
                        />
                        <Legend />
                        <Bar dataKey={t('resources.analysis.used')} stackId="a" fill="#3b82f6" />
                        <Bar dataKey={t('resources.analysis.available')} stackId="a" fill="#e2e8f0" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Resource Status Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                    <div className="text-sm font-medium text-slate-600 mb-2">
                        {t('resources.analysis.underutilized')}
                    </div>
                    <div className="text-3xl font-bold text-slate-700">{underutilized.length}</div>
                    <div className="text-xs text-slate-500 mt-1">&lt; 50%</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-2">
                        {t('resources.analysis.optimal')}
                    </div>
                    <div className="text-3xl font-bold text-green-700">{wellUtilized.length}</div>
                    <div className="text-xs text-green-600 mt-1">50-80%</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-700 mb-2">
                        {t('resources.analysis.highLoad')}
                    </div>
                    <div className="text-3xl font-bold text-yellow-700">{overutilized.length}</div>
                    <div className="text-xs text-yellow-600 mt-1">80-100%</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
                    <div className="text-sm font-medium text-red-700 mb-2">
                        {t('resources.analysis.overbooked')}
                    </div>
                    <div className="text-3xl font-bold text-red-700">{overbooked.length}</div>
                    <div className="text-xs text-red-600 mt-1">&gt; 100%</div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="text-yellow-500" size={24} />
                    {t('resources.analysis.recommendations')}
                </h3>
                <div className="space-y-4">
                    {recommendations.map((rec, idx) => {
                        const Icon = rec.icon;
                        return (
                            <div
                                key={idx}
                                className={`p-4 rounded-xl border-2 ${getTypeColor(rec.type)}`}
                            >
                                <div className="flex gap-3">
                                    <Icon className={`${getIconColor(rec.type)} flex-shrink-0`} size={24} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 mb-1">{rec.title}</h4>
                                        <p className="text-sm text-slate-700 mb-2">{rec.description}</p>
                                        <p className="text-sm font-medium text-slate-800">
                                            💡 {rec.action}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {recommendations.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <CheckCircle className="mx-auto mb-2 text-green-500" size={48} />
                            <p>{t('resources.analysis.noIssues')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceUtilizationAnalysis;
