import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import type { Project } from '../types';
import { Card, Badge } from './ui';

interface ProjectHealthMonitorProps {
    projects: Project[];
}

interface HealthMetrics {
    projectId: string;
    projectName: string;
    healthScore: number;
    status: 'healthy' | 'warning' | 'critical';
    issues: {
        type: 'schedule' | 'budget' | 'scope' | 'quality';
        severity: 'low' | 'medium' | 'high';
        message: string;
    }[];
}

export const ProjectHealthMonitor: React.FC<ProjectHealthMonitorProps> = ({ projects }) => {
    const healthMetrics = useMemo(() => {
        return projects
            .filter((p) => p.status === 'active')
            .map((project): HealthMetrics => {
                const issues: HealthMetrics['issues'] = [];
                let healthScore = 100;

                // 检查进度延期
                const endDate = new Date(project.endDate);
                const today = new Date();
                const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysRemaining < 0) {
                    issues.push({
                        type: 'schedule',
                        severity: 'high',
                        message: `已延期 ${Math.abs(daysRemaining)} 天`,
                    });
                    healthScore -= 30;
                } else if (daysRemaining < 7) {
                    issues.push({
                        type: 'schedule',
                        severity: 'medium',
                        message: `即将到期（${daysRemaining} 天）`,
                    });
                    healthScore -= 15;
                }

                // 检查预算超支
                const budgetUsage = project.actualCost && project.budget
                    ? (project.actualCost / project.budget) * 100
                    : 0;

                if (budgetUsage > 100) {
                    issues.push({
                        type: 'budget',
                        severity: 'high',
                        message: `预算超支 ${(budgetUsage - 100).toFixed(1)}%`,
                    });
                    healthScore -= 25;
                } else if (budgetUsage > 90) {
                    issues.push({
                        type: 'budget',
                        severity: 'medium',
                        message: `预算使用率 ${budgetUsage.toFixed(1)}%`,
                    });
                    healthScore -= 10;
                }

                // 检查任务完成率
                const tasks = project.tasks || [];
                const completedTasks = tasks.filter((t) => t.status === 'completed').length;
                const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

                if (completionRate < 30 && daysRemaining < 30) {
                    issues.push({
                        type: 'quality',
                        severity: 'high',
                        message: `任务完成率仅 ${completionRate.toFixed(0)}%`,
                    });
                    healthScore -= 20;
                }

                // 检查范围变更（暂时使用任务数量作为代理指标）
                const scopeChanges = tasks.length > 20 ? Math.floor(tasks.length / 4) : 0;
                if (scopeChanges > 5) {
                    issues.push({
                        type: 'scope',
                        severity: 'medium',
                        message: `任务数量较多（${tasks.length} 个）`,
                    });
                    healthScore -= 10;
                }

                // 确定健康状态
                let status: 'healthy' | 'warning' | 'critical' = 'healthy';
                if (healthScore < 50) {
                    status = 'critical';
                } else if (healthScore < 75) {
                    status = 'warning';
                }

                return {
                    projectId: project.id,
                    projectName: project.name,
                    healthScore: Math.max(0, healthScore),
                    status,
                    issues,
                };
            })
            .sort((a, b) => a.healthScore - b.healthScore);
    }, [projects]);

    const criticalProjects = healthMetrics.filter((m) => m.status === 'critical');
    const warningProjects = healthMetrics.filter((m) => m.status === 'warning');
    const healthyProjects = healthMetrics.filter((m) => m.status === 'healthy');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
            case 'critical':
                return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
            default:
                return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            case 'critical':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            default:
                return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
        }
    };

    const getIssueIcon = (type: string) => {
        switch (type) {
            case 'schedule':
                return <Clock className="w-4 h-4" />;
            case 'budget':
                return <TrendingDown className="w-4 h-4" />;
            case 'scope':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <AlertTriangle className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-4">
            {/* 健康度统计 */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            健康项目
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {healthyProjects.length}
                    </p>
                </Card>

                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            需关注
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {warningProjects.length}
                    </p>
                </Card>

                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">
                            严重问题
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {criticalProjects.length}
                    </p>
                </Card>
            </div>

            {/* 项目健康度列表 */}
            <div className="space-y-3">
                {healthMetrics.slice(0, 10).map((metric) => (
                    <Card key={metric.projectId} className={`p-4 ${getStatusColor(metric.status)}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                                {getStatusIcon(metric.status)}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                        {metric.projectName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${metric.status === 'healthy'
                                                    ? 'bg-green-600'
                                                    : metric.status === 'warning'
                                                        ? 'bg-yellow-600'
                                                        : 'bg-red-600'
                                                    }`}
                                                style={{ width: `${metric.healthScore}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {metric.healthScore.toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Badge
                                variant={
                                    metric.status === 'healthy'
                                        ? 'success'
                                        : metric.status === 'warning'
                                            ? 'warning'
                                            : 'danger'
                                }
                            >
                                {metric.status === 'healthy' ? '健康' : metric.status === 'warning' ? '警告' : '严重'}
                            </Badge>
                        </div>

                        {/* 问题列表 */}
                        {metric.issues.length > 0 && (
                            <div className="space-y-1">
                                {metric.issues.map((issue, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                    >
                                        {getIssueIcon(issue.type)}
                                        <span>{issue.message}</span>
                                        <Badge
                                            variant={
                                                issue.severity === 'high'
                                                    ? 'danger'
                                                    : issue.severity === 'medium'
                                                        ? 'warning'
                                                        : 'neutral'
                                            }
                                            size="sm"
                                        >
                                            {issue.severity}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}

                {healthMetrics.length === 0 && (
                    <Card className="p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">暂无活跃项目</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ProjectHealthMonitor;
