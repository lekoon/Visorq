import React, { useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, DollarSign, Users, Award, Shield, Target } from 'lucide-react';
import type { Project, Task } from '../types';
import { calculateProjectHealth, type ProjectHealthMetrics } from '../utils/projectHealth';

interface ProjectHealthDashboardProps {
    project: Project;
    tasks: Task[];
    allProjects?: Project[];
}

const ProjectHealthDashboard: React.FC<ProjectHealthDashboardProps> = ({
    project,
    tasks,
    allProjects = []
}) => {
    // 计算健康指标
    const health = useMemo(() => {
        return calculateProjectHealth(project, tasks, allProjects);
    }, [project, tasks, allProjects]);

    // 获取总体健康度颜色和状态
    const getOverallColor = (score: number) => {
        if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' };
        if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' };
        if (score >= 40) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' };
        return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent':
                return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
            case 'good':
                return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
            case 'warning':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
            case 'critical':
                return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
        }
    };

    const overallColor = getOverallColor(health.overall);

    // 维度配置
    const dimensions = [
        {
            key: 'schedule' as const,
            label: '进度',
            icon: Activity,
            data: health.schedule,
            description: `SPI: ${health.schedule.spi.toFixed(2)}`
        },
        {
            key: 'cost' as const,
            label: '成本',
            icon: DollarSign,
            data: health.cost,
            description: `CPI: ${health.cost.cpi.toFixed(2)}`
        },
        {
            key: 'resources' as const,
            label: '资源',
            icon: Users,
            data: health.resources,
            description: `利用率: ${health.resources.utilization.toFixed(0)}%`
        },
        {
            key: 'risks' as const,
            label: '风险',
            icon: Shield,
            data: health.risks,
            description: `${health.risks.total} 个风险`
        },
        {
            key: 'quality' as const,
            label: '质量',
            icon: Award,
            data: health.quality,
            description: '质量指标'
        },
        {
            key: 'team' as const,
            label: '团队',
            icon: Target,
            data: health.team,
            description: `速率: ${health.team.velocity.toFixed(0)}%`
        }
    ];

    return (
        <div className="space-y-6">
            {/* 总体健康度 */}
            <div className={`relative overflow-hidden rounded-xl ${overallColor.light} border-2 ${overallColor.bg.replace('bg-', 'border-')}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-slate-900">项目健康度</h2>
                        <div className={`px-4 py-2 rounded-lg ${overallColor.bg} text-white font-bold text-2xl`}>
                            {health.overall}
                        </div>
                    </div>

                    {/* 进度环 */}
                    <div className="relative w-48 h-48 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* 背景圆 */}
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="12"
                                className="text-slate-200"
                            />
                            {/* 进度圆 */}
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="12"
                                strokeDasharray={`${(health.overall / 100) * 553} 553`}
                                strokeLinecap="round"
                                className={overallColor.text}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <div className={`text-5xl font-bold ${overallColor.text}`}>
                                {health.overall}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                                {health.overall >= 80 ? '优秀' :
                                    health.overall >= 60 ? '良好' :
                                        health.overall >= 40 ? '警告' : '危险'}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-slate-600">
                        综合评估结果显示项目处于
                        <span className={`font-semibold ${overallColor.text} mx-1`}>
                            {health.overall >= 80 ? '健康' :
                                health.overall >= 60 ? '稳定' :
                                    health.overall >= 40 ? '风险' : '危急'}
                        </span>
                        状态
                    </p>
                </div>

                {/* 装饰性背景 */}
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10 transform translate-x-20 -translate-y-20">
                    <Activity size={256} className={overallColor.text} />
                </div>
            </div>

            {/* 六维雷达图（文字版） */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4">健康度详情</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dimensions.map(({ key, label, icon: Icon, data, description }) => {
                        const statusColor = getStatusColor(data.status);

                        return (
                            <div key={key} className={`p-4 rounded-lg border-2 ${statusColor.border} ${statusColor.bg}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Icon size={20} className={statusColor.text} />
                                        <h4 className="font-medium text-slate-900">{label}</h4>
                                    </div>
                                    <span className={`text-2xl font-bold ${statusColor.text}`}>
                                        {data.score}
                                    </span>
                                </div>

                                {/* 进度条 */}
                                <div className="mb-2">
                                    <div className="h-2 bg-white rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${statusColor.border.replace('border', 'bg')} transition-all`}
                                            style={{ width: `${data.score}%` }}
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 mb-2">{description}</p>

                                {/* 问题列表 */}
                                {data.issues.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        {data.issues.map((issue, index) => (
                                            <div key={index} className="flex items-start gap-1 text-xs text-slate-700">
                                                <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                                                <span>{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 关键指标 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SPI/CPI 详情 */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">绩效指标</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">进度绩效指标 (SPI)</span>
                                <span className={`text-lg font-bold ${health.schedule.spi >= 0.95 ? 'text-green-600' :
                                        health.schedule.spi >= 0.85 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {health.schedule.spi.toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                {health.schedule.spi >= 1 ? '进度超前' :
                                    health.schedule.spi >= 0.9 ? '基本按计划' : '进度落后'}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">成本绩效指标 (CPI)</span>
                                <span className={`text-lg font-bold ${health.cost.cpi >= 0.95 ? 'text-green-600' :
                                        health.cost.cpi >= 0.85 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {health.cost.cpi.toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                {health.cost.cpi >= 1 ? '成本节约' :
                                    health.cost.cpi >= 0.9 ? '成本可控' : '成本超支'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 风险摘要 */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">风险摘要</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">总风险数</span>
                            <span className="text-lg font-bold text-slate-900">{health.risks.total}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">高危风险</span>
                            <span className={`text-lg font-bold ${health.risks.critical > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {health.risks.critical}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">资源冲突</span>
                            <span className={`text-lg font-bold ${health.resources.conflicts > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {health.resources.conflicts}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 改进建议 */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Target size={20} />
                    改进建议
                </h3>
                <ul className="space-y-2">
                    {health.overall < 80 && (
                        <li className="text-sm text-blue-900">
                            • 综合健康度需要提升，建议重点关注评分最低的维度
                        </li>
                    )}
                    {health.schedule.score < 70 && (
                        <li className="text-sm text-blue-900">
                            • 进度延误较严重，建议审查任务排期并增加资源投入
                        </li>
                    )}
                    {health.cost.score < 70 && (
                        <li className="text-sm text-blue-900">
                            • 成本控制需要加强，建议审查预算使用并削减非必要开支
                        </li>
                    )}
                    {health.resources.score < 70 && (
                        <li className="text-sm text-blue-900">
                            • 资源配置有问题，建议使用资源优化面板获取详细建议
                        </li>
                    )}
                    {health.risks.critical > 0 && (
                        <li className="text-sm text-blue-900">
                            • 存在高危风险，建议立即制定应对措施
                        </li>
                    )}
                    {health.team.velocity < 50 && (
                        <li className="text-sm text-blue-900">
                            • 团队速率偏低，建议分析障碍并提供必要支持
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ProjectHealthDashboard;
