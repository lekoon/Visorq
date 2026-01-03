import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { usePMOStore } from '../store/usePMOStore';
import {
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Users,
    GitBranch,
    FileText,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import ProjectHealthMonitor from '../components/ProjectHealthMonitor';

const PMODashboard: React.FC = () => {
    const navigate = useNavigate();
    const { projects } = useStore();
    const { changeRequests, environmentResources, requirements, simulations } = usePMOStore();

    // 统计数据
    const stats = useMemo(() => {
        const activeProjects = projects.filter((p) => p.status === 'active');
        const totalProjects = projects.length;
        const completedProjects = projects.filter((p) => p.status === 'completed').length;

        const pendingChangeRequests = changeRequests.filter((cr) => cr.status === 'pending').length;
        const totalChangeRequests = changeRequests.length;

        const totalRequirements = requirements.length;
        const completedRequirements = requirements.filter((r) => r.status === 'completed').length;

        const availableEnvironments = environmentResources.filter(
            (env) => env.status === 'available'
        ).length;

        return {
            activeProjects: activeProjects.length,
            totalProjects,
            completedProjects,
            completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
            pendingChangeRequests,
            totalChangeRequests,
            totalRequirements,
            completedRequirements,
            requirementCompletionRate:
                totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0,
            availableEnvironments,
            totalEnvironments: environmentResources.length,
            totalSimulations: simulations.length,
        };
    }, [projects, changeRequests, requirements, environmentResources, simulations]);

    // 最近的变更请求
    const recentChangeRequests = useMemo(() => {
        return [...changeRequests]
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
            .slice(0, 5);
    }, [changeRequests]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* 页面标题 */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        PMO 战略管控中心
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        项目组合管理、范围防御、资源冲突管控一站式平台
                    </p>
                </div>

                {/* 关键指标卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div onClick={() => navigate('/projects')} className="cursor-pointer">
                        <Card className="p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <GitBranch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">活跃项目</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {stats.activeProjects}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        总计 {stats.totalProjects} 个项目
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-600 dark:text-slate-400">待审批变更</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {stats.pendingChangeRequests}
                                </p>
                                <p className="text-xs text-slate-500">
                                    总计 {stats.totalChangeRequests} 个变更
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-600 dark:text-slate-400">需求完成率</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {stats.requirementCompletionRate.toFixed(0)}%
                                </p>
                                <p className="text-xs text-slate-500">
                                    {stats.completedRequirements} / {stats.totalRequirements}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <div onClick={() => navigate('/environments')} className="cursor-pointer">
                        <Card className="p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">可用环境</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {stats.availableEnvironments}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        总计 {stats.totalEnvironments} 个环境
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：最近变更请求 */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    最近变更请求
                                </h3>
                                <Button variant="ghost" size="sm">
                                    查看全部
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {recentChangeRequests.length > 0 ? (
                                    recentChangeRequests.map((cr) => (
                                        <div
                                            key={cr.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                                        {cr.title}
                                                    </h4>
                                                    <Badge
                                                        variant={
                                                            cr.status === 'approved'
                                                                ? 'success'
                                                                : cr.status === 'rejected'
                                                                    ? 'danger'
                                                                    : 'warning'
                                                        }
                                                        size="sm"
                                                    >
                                                        {cr.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    {cr.projectName} • {new Date(cr.requestDate).toLocaleDateString()}
                                                </p>
                                                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                                    <span>+{cr.estimatedEffortHours}h</span>
                                                    <span>+¥{cr.estimatedCostIncrease}</span>
                                                    <span>+{cr.scheduleImpactDays}天</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        暂无变更请求
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* 项目健康度监控 */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                项目健康度监控
                            </h3>
                            <ProjectHealthMonitor projects={projects} />
                        </Card>
                    </div>

                    {/* 右侧：快速操作 */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                快速操作
                            </h3>
                            <div className="space-y-2">
                                <Button
                                    onClick={() => navigate('/simulation')}
                                    variant="primary"
                                    className="w-full justify-start"
                                >
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    What-If 沙盘推演
                                </Button>
                                <Button
                                    onClick={() => navigate('/environments')}
                                    variant="secondary"
                                    className="w-full justify-start"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    环境资源管理
                                </Button>
                                <Button
                                    onClick={() => navigate('/portfolio')}
                                    variant="secondary"
                                    className="w-full justify-start"
                                >
                                    <GitBranch className="w-4 h-4 mr-2" />
                                    项目组合视图
                                </Button>
                                <Button
                                    onClick={() => navigate('/dependencies')}
                                    variant="secondary"
                                    className="w-full justify-start"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    依赖关系分析
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                系统状态
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        项目完成率
                                    </span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {stats.completionRate.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all"
                                        style={{ width: `${stats.completionRate}%` }}
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <span className="text-slate-600 dark:text-slate-400">
                                            系统运行正常
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PMODashboard;
