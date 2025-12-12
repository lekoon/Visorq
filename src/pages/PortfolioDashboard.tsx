import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Briefcase, TrendingUp, DollarSign, AlertTriangle,
    Users, CheckCircle, Activity, Target
} from 'lucide-react';
import { useProjects } from '../store/useStore';
import { calculatePortfolioMetrics } from '../utils/portfolioHealth';
import ProjectHealthGrid from '../components/ProjectHealthGrid';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PortfolioDashboard: React.FC = () => {
    const projects = useProjects();

    const portfolioMetrics = useMemo(() => {
        return calculatePortfolioMetrics(projects);
    }, [projects]);

    // Prepare data for health distribution chart
    const healthChartData = [
        { name: '健康', value: portfolioMetrics.healthDistribution.green, color: '#10b981' },
        { name: '警告', value: portfolioMetrics.healthDistribution.amber, color: '#f59e0b' },
        { name: '风险', value: portfolioMetrics.healthDistribution.red, color: '#ef4444' }
    ].filter(d => d.value > 0);

    // Prepare data for project status chart
    const statusChartData = [
        { name: '活跃', value: portfolioMetrics.activeProjects, color: '#3b82f6' },
        { name: '已完成', value: portfolioMetrics.completedProjects, color: '#10b981' },
        { name: '暂停', value: portfolioMetrics.onHoldProjects, color: '#6b7280' }
    ].filter(d => d.value > 0);

    const MetricCard: React.FC<{
        icon: React.ReactNode;
        title: string;
        value: string | number;
        subtitle?: string;
        trend?: 'up' | 'down' | 'neutral';
        colorClass?: string;
    }> = ({ icon, title, value, subtitle, trend, colorClass = 'text-blue-600 dark:text-blue-400' }) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`${colorClass}`}>
                                {icon}
                            </div>
                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {title}
                            </h3>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {value}
                        </div>
                        {subtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {trend && (
                        <div className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' :
                            trend === 'down' ? 'text-red-600' :
                                'text-slate-400'
                            }`}>
                            {trend === 'up' && <TrendingUp size={20} />}
                            {trend === 'down' && <TrendingUp size={20} className="rotate-180" />}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Briefcase className="text-blue-600 dark:text-blue-400" size={32} />
                        项目组合仪表盘
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        PMO 总览 - 实时监控所有项目的健康状态
                    </p>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Target size={24} />}
                    title="项目总数"
                    value={portfolioMetrics.totalProjects}
                    subtitle={`${portfolioMetrics.activeProjects} 个活跃项目`}
                    colorClass="text-blue-600 dark:text-blue-400"
                />
                <MetricCard
                    icon={<DollarSign size={24} />}
                    title="总预算"
                    value={`¥${(portfolioMetrics.totalBudget / 10000).toFixed(1)}万`}
                    subtitle={`已使用 ¥${(portfolioMetrics.totalSpent / 10000).toFixed(1)}万`}
                    colorClass="text-green-600 dark:text-green-400"
                />
                <MetricCard
                    icon={<AlertTriangle size={24} />}
                    title="风险暴露"
                    value={portfolioMetrics.criticalRisks}
                    subtitle={`${portfolioMetrics.criticalRisks} 个关键风险`}
                    colorClass="text-red-600 dark:text-red-400"
                />
                <MetricCard
                    icon={<Users size={24} />}
                    title="资源利用率"
                    value={`${portfolioMetrics.resourceUtilizationRate}%`}
                    subtitle={`${portfolioMetrics.totalResourcesAllocated} 人已分配`}
                    colorClass="text-purple-600 dark:text-purple-400"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Health Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-blue-600 dark:text-blue-400" />
                        健康状态分布
                    </h3>
                    {healthChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={healthChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {healthChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400">
                            暂无数据
                        </div>
                    )}
                </div>

                {/* Project Status Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                        项目状态分布
                    </h3>
                    {statusChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400">
                            暂无数据
                        </div>
                    )}
                </div>
            </div>

            {/* Project Health Grid */}
            <ProjectHealthGrid projects={projects} />
        </div>
    );
};

export default PortfolioDashboard;
