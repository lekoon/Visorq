import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Network, AlertTriangle, TrendingDown, Info,
    ChevronRight, Calendar, Clock
} from 'lucide-react';
import { useProjects } from '../store/useStore';
import {
    detectCrossProjectDependencies,
    calculateCriticalPath,
    simulateDelayImpact,
    getDependencyStatistics
} from '../utils/crossProjectDependencies';
import type { CrossProjectDependency } from '../types';

const CrossProjectDependencyMap: React.FC = () => {
    const projects = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [simulatedDelay, setSimulatedDelay] = useState<number>(7);

    const dependencies = useMemo(() => {
        return detectCrossProjectDependencies(projects);
    }, [projects]);

    const criticalPath = useMemo(() => {
        return calculateCriticalPath(projects, dependencies);
    }, [projects, dependencies]);

    // Mark critical path dependencies
    const enhancedDependencies = useMemo(() => {
        return dependencies.map(dep => ({
            ...dep,
            criticalPath: criticalPath.includes(dep.sourceProjectId) && criticalPath.includes(dep.targetProjectId)
        }));
    }, [dependencies, criticalPath]);

    const stats = useMemo(() => {
        return getDependencyStatistics(projects, enhancedDependencies);
    }, [projects, enhancedDependencies]);

    const impactAnalysis = useMemo(() => {
        if (!selectedProjectId) return [];
        return simulateDelayImpact(selectedProjectId, simulatedDelay, projects, enhancedDependencies);
    }, [selectedProjectId, simulatedDelay, projects, enhancedDependencies]);

    // Build network graph data
    const networkNodes = useMemo(() => {
        const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
        return activeProjects.map(p => ({
            id: p.id,
            name: p.name,
            isCritical: criticalPath.includes(p.id),
            incomingDeps: enhancedDependencies.filter(d => d.targetProjectId === p.id).length,
            outgoingDeps: enhancedDependencies.filter(d => d.sourceProjectId === p.id).length
        }));
    }, [projects, criticalPath, enhancedDependencies]);

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <Network size={64} className="text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    暂无项目数据
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                    创建项目后即可查看跨项目依赖关系
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Network className="text-purple-600 dark:text-purple-400" size={32} />
                        跨项目依赖分析
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Cross-Project Dependency Analysis - 战略风险管理
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Network size={20} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                            总依赖数
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {stats.totalDependencies}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                            关键路径依赖
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {stats.criticalDependencies}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={20} className="text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                            最受依赖项目
                        </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {stats.mostDependentProject?.name || '无'}
                    </div>
                    {stats.mostDependentProject && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {stats.mostDependentProject.count} 个依赖
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={20} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                            最阻塞项目
                        </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {stats.mostBlockingProject?.name || '无'}
                    </div>
                    {stats.mostBlockingProject && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            阻塞 {stats.mostBlockingProject.count} 个项目
                        </div>
                    )}
                </div>
            </div>

            {/* Critical Path Visualization */}
            {criticalPath.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                        全局关键路径
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        {criticalPath.map((projectId, index) => {
                            const project = projects.find(p => p.id === projectId);
                            if (!project) return null;

                            return (
                                <React.Fragment key={projectId}>
                                    <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border-2 border-red-500 shadow-sm">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                            {project.name}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {project.manager || '未分配'}
                                        </div>
                                    </div>
                                    {index < criticalPath.length - 1 && (
                                        <ChevronRight className="text-red-600 dark:text-red-400" size={20} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div className="mt-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                <strong>关键路径</strong>是项目组合中最长的依赖链。任何关键路径上的项目延迟都会直接影响整个组合的完成时间。
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Dependency Network Visualization */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                    依赖网络图
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {networkNodes.map(node => (
                        <motion.div
                            key={node.id}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${node.isCritical
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                                } ${selectedProjectId === node.id
                                    ? 'ring-2 ring-blue-500'
                                    : ''
                                }`}
                            onClick={() => setSelectedProjectId(node.id)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                    {node.name}
                                </h4>
                                {node.isCritical && (
                                    <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                    <TrendingDown size={12} />
                                    <span>{node.incomingDeps} 入</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ChevronRight size={12} />
                                    <span>{node.outgoingDeps} 出</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Delay Impact Simulation */}
            <AnimatePresence>
                {selectedProjectId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
                    >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                            延迟影响模拟
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                模拟延迟天数
                            </label>
                            <input
                                type="number"
                                value={simulatedDelay}
                                onChange={(e) => setSimulatedDelay(parseInt(e.target.value) || 0)}
                                min="1"
                                max="90"
                                className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">天</span>
                        </div>

                        {impactAnalysis.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    如果 <strong>{projects.find(p => p.id === selectedProjectId)?.name}</strong> 延迟 <strong>{simulatedDelay}</strong> 天，将影响以下项目：
                                </p>
                                {impactAnalysis.map(impact => (
                                    <div
                                        key={impact.projectId}
                                        className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {impact.projectName}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                    原计划: {new Date(impact.originalEndDate).toLocaleDateString('zh-CN')} →
                                                    新计划: {new Date(impact.newEndDate).toLocaleDateString('zh-CN')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                    +{impact.delayDays} 天
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    ✓ 该项目延迟不会影响其他项目
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CrossProjectDependencyMap;
