import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Minus, Calendar, DollarSign,
    AlertTriangle, CheckCircle, Target
} from 'lucide-react';
import type { Project, RAGStatus } from '../types';
import { getProjectHealthIndicators, getRAGColorClass } from '../utils/portfolioHealth';

interface ProjectHealthGridProps {
    projects: Project[];
}

const RAGIndicator: React.FC<{ status: RAGStatus; label: string }> = ({ status, label }) => {
    const bgClass = getRAGColorClass(status, 'bg');
    const textClass = getRAGColorClass(status, 'text');

    return (
        <div
            className={`px-2 py-1 rounded text-xs font-medium ${bgClass} ${textClass} text-center`}
            title={label}
        >
            {status === 'green' ? '●' : status === 'amber' ? '▲' : '■'}
        </div>
    );
};

const TrendIndicator: React.FC<{ trend: 'improving' | 'stable' | 'declining' }> = ({ trend }) => {
    if (trend === 'improving') {
        return <TrendingUp size={14} className="text-green-600 dark:text-green-400" />;
    }
    if (trend === 'declining') {
        return <TrendingDown size={14} className="text-red-600 dark:text-red-400" />;
    }
    return <Minus size={14} className="text-slate-400" />;
};

const ProjectHealthGrid: React.FC<ProjectHealthGridProps> = ({ projects }) => {
    const navigate = useNavigate();

    const healthData = useMemo(() => {
        return projects
            .filter(p => p.status === 'active' || p.status === 'planning')
            .map(project => ({
                project,
                health: getProjectHealthIndicators(project)
            }))
            .sort((a, b) => {
                // Sort by overall health (red first, then amber, then green)
                const healthOrder = { red: 0, amber: 1, green: 2 };
                return healthOrder[a.health.overallHealth] - healthOrder[b.health.overallHealth];
            });
    }, [projects]);

    if (healthData.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
                <Target size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">暂无活跃项目</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    项目健康状态矩阵
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    RAG 状态：<span className="text-green-600 dark:text-green-400">● 良好</span> ·
                    <span className="text-orange-600 dark:text-orange-400 ml-2">▲ 警告</span> ·
                    <span className="text-red-600 dark:text-red-400 ml-2">■ 风险</span>
                </p>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                项目名称
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Calendar size={12} />
                                    进度
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={12} />
                                    预算
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Target size={12} />
                                    范围
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <CheckCircle size={12} />
                                    质量
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <AlertTriangle size={12} />
                                    风险
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                综合
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                趋势
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {healthData.map(({ project, health }) => {
                            const overallBgClass = getRAGColorClass(health.overallHealth, 'bg');

                            return (
                                <tr
                                    key={project.id}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                {project.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {project.manager || '未分配'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <RAGIndicator status={health.scheduleHealth} label="进度健康度" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <RAGIndicator status={health.budgetHealth} label="预算健康度" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <RAGIndicator status={health.scopeHealth} label="范围健康度" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <RAGIndicator status={health.qualityHealth} label="质量健康度" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <RAGIndicator status={health.riskHealth} label="风险健康度" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${overallBgClass}`}>
                                            <span className={`text-sm font-bold ${getRAGColorClass(health.overallHealth, 'text')}`}>
                                                {health.overallHealth === 'green' ? '健康' : health.overallHealth === 'amber' ? '警告' : '风险'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">
                                            <TrendIndicator trend={health.trend} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">提示：</span> 点击项目行查看详情 ·
                RAG 指标基于进度、预算、范围、质量和风险的综合评估
            </div>
        </div>
    );
};

export default ProjectHealthGrid;
