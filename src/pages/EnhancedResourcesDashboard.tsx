/**
 * Enhanced Resources Dashboard
 * Unified resource management with intuitive visualizations
 */

import React, { useState, useMemo } from 'react';
import { useProjects, useResourcePool } from '../store/useStore';
import {
    Users,
    TrendingUp,
    AlertTriangle,
    Zap,
    BarChart3,
    Activity,
} from 'lucide-react';
import OptimizedChart from '../components/OptimizedChart';
import { generateTimeBuckets, calculateResourceLoad } from '../utils/resourcePlanning';
import ResourceDetailModal from '../components/ResourceDetailModal';
import ScheduleOptimizerPanel from '../components/ScheduleOptimizerPanel';
import { useStore } from '../store/useStore';
import type { Task } from '../types';

const EnhancedResourcesDashboard: React.FC = () => {
    const projects = useProjects();
    const resourcePool = useResourcePool();
    const { updateProject, addNotification } = useStore();
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    // Calculate resource metrics
    const buckets = useMemo(() => generateTimeBuckets(projects, 12, selectedPeriod), [projects, selectedPeriod]);
    const resourceLoads = useMemo(
        () => calculateResourceLoad(projects, resourcePool, buckets, selectedPeriod),
        [projects, resourcePool, buckets, selectedPeriod]
    );

    // Overall statistics
    const stats = useMemo(() => {
        const totalResources = resourcePool.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
        const currentMonth = buckets[0]?.label;

        let totalUsed = 0;
        let overallocated = 0;
        let underutilized = 0;

        resourceLoads.forEach((load) => {
            const alloc = load.allocations[currentMonth];
            const used = alloc ? alloc.total : 0;
            totalUsed += used;

            const utilization = load.capacity > 0 ? (used / load.capacity) * 100 : 0;
            if (utilization > 100) overallocated++;
            if (utilization < 50) underutilized++;
        });

        const avgUtilization = totalResources > 0 ? (totalUsed / totalResources) * 100 : 0;

        return {
            totalResources,
            totalUsed,
            avgUtilization,
            overallocated,
            underutilized,
            available: totalResources - totalUsed,
        };
    }, [resourcePool, resourceLoads, buckets]);

    // Prepare chart data
    const utilizationChartData = useMemo(() => {
        return resourceLoads.map((load) => {
            const currentMonth = buckets[0]?.label;
            const alloc = load.allocations[currentMonth];
            const used = alloc ? alloc.total : 0;
            const utilization = load.capacity > 0 ? (used / load.capacity) * 100 : 0;

            return {
                id: load.resourceId,
                name: load.resourceName,
                utilization: Math.round(utilization),
                capacity: load.capacity,
                used,
            };
        });
    }, [resourceLoads, buckets]);

    const timelineData = useMemo(() => {
        return buckets.slice(0, 6).map((bucket) => {
            let totalUsed = 0;
            let totalCapacity = 0;

            resourceLoads.forEach((load) => {
                const alloc = load.allocations[bucket.label];
                totalUsed += alloc ? alloc.total : 0;
                totalCapacity += load.capacity;
            });

            return {
                name: bucket.label,
                utilization: totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0,
                used: totalUsed,
                capacity: totalCapacity,
            };
        });
    }, [resourceLoads, buckets]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">资源总览</h2>
                    <p className="text-slate-600 mt-1">实时监控资源分配和利用情况</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                        <option value="week">本周</option>
                        <option value="month">本月</option>
                        <option value="quarter">本季度</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Resources */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500">总资源</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.totalResources}</div>
                    <div className="text-sm text-slate-600 mt-1">
                        使用中: {stats.totalUsed} ({Math.round(stats.avgUtilization)}%)
                    </div>
                </div>

                {/* Average Utilization */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500">平均利用率</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        {Math.round(stats.avgUtilization)}%
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${stats.avgUtilization > 90
                                    ? 'bg-red-500'
                                    : stats.avgUtilization > 70
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(stats.avgUtilization, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Overallocated */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500">超额分配</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.overallocated}</div>
                    <div className="text-sm text-slate-600 mt-1">
                        {stats.overallocated > 0 ? '需要调整' : '状态良好'}
                    </div>
                </div>

                {/* Available */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Zap className="text-purple-600" size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500">可用资源</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.available}</div>
                    <div className="text-sm text-slate-600 mt-1">
                        {Math.round((stats.available / stats.totalResources) * 100)}% 可用
                    </div>
                </div>
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resource Utilization Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">资源利用率</h3>
                        <BarChart3 className="text-slate-400" size={20} />
                    </div>
                    <OptimizedChart
                        type="bar"
                        data={utilizationChartData}
                        dataKey="utilization"
                        xKey="name"
                        height={300}
                        colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
                    />
                </div>

                {/* Timeline Trend */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">利用率趋势</h3>
                        <Activity className="text-slate-400" size={20} />
                    </div>
                    <OptimizedChart
                        type="line"
                        data={timelineData}
                        dataKey="utilization"
                        xKey="name"
                        height={300}
                        colors={['#8B5CF6']}
                    />
                </div>
            </div>

            {/* Resource Details Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">资源详情</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    资源名称
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    总容量
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    已使用
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    可用
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    利用率
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    状态
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {utilizationChartData.map((resource, index) => {
                                const available = resource.capacity - resource.used;
                                const status =
                                    resource.utilization > 100
                                        ? 'overallocated'
                                        : resource.utilization > 80
                                            ? 'high'
                                            : resource.utilization > 50
                                                ? 'normal'
                                                : 'low';

                                return (
                                    <tr
                                        key={index}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedResourceId(resource.id);
                                            setIsDetailModalOpen(true);
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{resource.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{resource.capacity}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{resource.used}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{available}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${status === 'overallocated'
                                                            ? 'bg-red-500'
                                                            : status === 'high'
                                                                ? 'bg-yellow-500'
                                                                : status === 'normal'
                                                                    ? 'bg-green-500'
                                                                    : 'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">
                                                    {resource.utilization}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'overallocated'
                                                    ? 'bg-red-100 text-red-800'
                                                    : status === 'high'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : status === 'normal'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                            >
                                                {status === 'overallocated'
                                                    ? '超额'
                                                    : status === 'high'
                                                        ? '高负载'
                                                        : status === 'normal'
                                                            ? '正常'
                                                            : '低负载'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 智能调度优化器 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">智能进度调度</h3>
                        <p className="text-sm text-slate-500 mt-1">自动优化资源分配，解决冲突</p>
                    </div>
                    <select
                        value={selectedProject || ''}
                        onChange={(e) => setSelectedProject(e.target.value || null)}
                        className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                        <option value="">选择项目...</option>
                        {projects.filter(p => p.status === 'active').map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {selectedProject ? (
                    <ScheduleOptimizerPanel
                        project={projects.find(p => p.id === selectedProject)!}
                        tasks={projects.find(p => p.id === selectedProject)?.tasks || []}
                        resourcePool={resourcePool}
                        onApplyChanges={(optimizedTasks: Task[]) => {
                            const project = projects.find(p => p.id === selectedProject);
                            if (project) {
                                updateProject(selectedProject, {
                                    ...project,
                                    tasks: optimizedTasks
                                });
                                addNotification({
                                    message: `项目"${project.name}"的任务已根据优化方案重新调度`,
                                    type: 'success',
                                    duration: 5000
                                });
                            }
                        }}
                    />
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <Zap size={48} className="mx-auto mb-3 opacity-30" />
                        <p>请选择一个项目以开始调度优化</p>
                    </div>
                )}
            </div>

            {/* Resource Detail Modal */}
            {selectedResourceId && (
                <ResourceDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    resourceId={selectedResourceId}
                />
            )}
        </div>
    );
};

export default EnhancedResourcesDashboard;
