import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { calculatePortfolioCost, analyzeBudget, generateCostOptimizationSuggestions } from '../utils/costAnalysis';
import { DollarSign, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CostAnalysisProps {
    totalBudget?: number;
}

const CostAnalysis: React.FC<CostAnalysisProps> = ({ totalBudget }) => {
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();

    const portfolioCost = useMemo(() => {
        return calculatePortfolioCost(projects, resourcePool);
    }, [projects, resourcePool]);

    const budgetAnalysis = useMemo(() => {
        return analyzeBudget(projects, resourcePool, totalBudget);
    }, [projects, resourcePool, totalBudget]);

    const optimizationSuggestions = useMemo(() => {
        return generateCostOptimizationSuggestions(projects, resourcePool);
    }, [projects, resourcePool]);

    // 准备图表数据
    const projectCostData = portfolioCost.projectCosts
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10)
        .map(pc => ({
            name: pc.projectName.length > 15 ? pc.projectName.substring(0, 15) + '...' : pc.projectName,
            cost: parseFloat(pc.totalCost.toFixed(0))
        }));

    const resourceCostData = portfolioCost.resourceUtilizationCost
        .sort((a, b) => b.totalCost - a.totalCost)
        .map(rc => ({
            name: rc.resourceName,
            cost: parseFloat(rc.totalCost.toFixed(0)),
            allocated: rc.totalAllocated
        }));

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'under': return 'from-blue-500 to-cyan-500';
            case 'on-track': return 'from-green-500 to-emerald-500';
            case 'over': return 'from-red-500 to-orange-500';
            default: return 'from-slate-500 to-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'under': return <TrendingDown className="text-blue-600" size={28} />;
            case 'on-track': return <DollarSign className="text-green-600" size={28} />;
            case 'over': return <TrendingUp className="text-red-600" size={28} />;
            default: return <DollarSign className="text-slate-600" size={28} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Budget Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('cost.totalBudget')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                ${budgetAnalysis.totalBudget.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('cost.totalCost')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                ${budgetAnalysis.totalCost.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('cost.remaining')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                ${budgetAnalysis.remaining.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br ${getStatusColor(budgetAnalysis.status)} p-6 rounded-2xl shadow-lg`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            {getStatusIcon(budgetAnalysis.status)}
                        </div>
                        <div>
                            <p className="text-sm text-white/90 font-medium">{t('cost.utilization')}</p>
                            <h3 className="text-2xl font-bold text-white">
                                {budgetAnalysis.utilizationRate.toFixed(1)}%
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Costs */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{t('cost.topProjectCosts')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectCostData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                                <YAxis tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                                    {projectCostData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Resource Costs */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{t('cost.resourceCosts')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={resourceCostData} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fill: '#64748b' }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12 }} width={120} />
                                <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="cost" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Over Budget Projects */}
            {budgetAnalysis.projectsOverBudget.length > 0 && (
                <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="text-red-600" size={24} />
                        <h3 className="text-lg font-bold text-red-900">{t('cost.overBudgetProjects')}</h3>
                    </div>
                    <div className="space-y-3">
                        {budgetAnalysis.projectsOverBudget.map(proj => (
                            <div key={proj.projectId} className="bg-white p-4 rounded-xl border border-red-300">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{proj.projectName}</h4>
                                        <p className="text-sm text-slate-600">
                                            {t('cost.budget')}: ${proj.budget.toLocaleString()} |
                                            {t('cost.actual')}: ${proj.actualCost.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-red-600">
                                            +${proj.variance.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-red-700">
                                            {((proj.variance / proj.budget) * 100).toFixed(1)}% {t('cost.over')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="text-yellow-500" size={24} />
                    <h3 className="text-lg font-bold text-slate-900">{t('cost.recommendations')}</h3>
                </div>
                <div className="space-y-3">
                    {[...budgetAnalysis.recommendations, ...optimizationSuggestions].map((rec, idx) => (
                        <div key={idx} className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="text-2xl">💡</div>
                            <p className="text-sm text-slate-700 flex-1">{rec}</p>
                        </div>
                    ))}
                    {budgetAnalysis.recommendations.length === 0 && optimizationSuggestions.length === 0 && (
                        <p className="text-slate-500 text-center py-4">{t('cost.noRecommendations')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CostAnalysis;
