import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, DollarSign, Calendar,
    Target, AlertCircle, CheckCircle, Activity
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import type { Project } from '../types';
import {
    calculateEVM,
    generateEVMTimeSeries,
    getEVMStatus,
    formatCurrency,
    formatPerformanceIndex,
    getPerformanceIndexColor
} from '../utils/evmCalculations';

interface EVMChartsProps {
    project: Project;
}

const EVMCharts: React.FC<EVMChartsProps> = ({ project }) => {
    const evmMetrics = useMemo(() => calculateEVM(project), [project]);
    const evmTimeSeries = useMemo(() => generateEVMTimeSeries(project, 12), [project]);
    const evmStatus = useMemo(() => getEVMStatus(evmMetrics), [evmMetrics]);

    const MetricCard: React.FC<{
        icon: React.ReactNode;
        label: string;
        value: string;
        subtitle?: string;
        status?: 'good' | 'warning' | 'critical';
    }> = ({ icon, label, value, subtitle, status }) => {
        const statusColors = {
            good: 'border-green-500 bg-green-50 dark:bg-green-900/20',
            warning: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
            critical: 'border-red-500 bg-red-50 dark:bg-red-900/20'
        };

        return (
            <div className={`p-4 rounded-lg border-2 ${status ? statusColors[status] : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-slate-600 dark:text-slate-400">
                        {icon}
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                        {label}
                    </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {value}
                </div>
                {subtitle && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {subtitle}
                    </div>
                )}
            </div>
        );
    };

    const PerformanceGauge: React.FC<{
        label: string;
        value: number;
        threshold: number;
    }> = ({ label, value, threshold }) => {
        const percentage = Math.min((value / threshold) * 100, 150);
        const colorClass = getPerformanceIndexColor(value);

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </span>
                    <span className={`text-lg font-bold ${colorClass}`}>
                        {formatPerformanceIndex(value)}
                    </span>
                </div>
                <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`absolute top-0 left-0 h-full rounded-full ${value >= 1.05 ? 'bg-green-500' :
                                value >= 0.95 ? 'bg-blue-500' :
                                    value >= 0.85 ? 'bg-orange-500' :
                                        'bg-red-500'
                            }`}
                    />
                    {/* Threshold marker at 1.0 */}
                    <div
                        className="absolute top-0 h-full w-0.5 bg-slate-900 dark:bg-slate-100"
                        style={{ left: `${(threshold / 1.5) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>0.0</span>
                    <span>1.0 (目标)</span>
                    <span>1.5</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Activity className="text-blue-600 dark:text-blue-400" size={28} />
                        挣值管理 (EVM)
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Earned Value Management - 财务绩效分析
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-lg ${evmStatus.overallHealth === 'good' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                        evmStatus.overallHealth === 'warning' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                            'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                    <div className="flex items-center gap-2">
                        {evmStatus.overallHealth === 'good' ? <CheckCircle size={20} /> :
                            evmStatus.overallHealth === 'warning' ? <AlertCircle size={20} /> :
                                <AlertCircle size={20} />}
                        <span className="font-bold">
                            {evmStatus.overallHealth === 'good' ? '健康' :
                                evmStatus.overallHealth === 'warning' ? '警告' :
                                    '风险'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Core EVM Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    icon={<Calendar size={20} />}
                    label="计划价值 (PV)"
                    value={formatCurrency(evmMetrics.plannedValue)}
                    subtitle="应该完成的工作价值"
                />
                <MetricCard
                    icon={<Target size={20} />}
                    label="挣值 (EV)"
                    value={formatCurrency(evmMetrics.earnedValue)}
                    subtitle="实际完成的工作价值"
                    status={
                        evmMetrics.earnedValue >= evmMetrics.plannedValue ? 'good' :
                            evmMetrics.earnedValue >= evmMetrics.plannedValue * 0.9 ? 'warning' :
                                'critical'
                    }
                />
                <MetricCard
                    icon={<DollarSign size={20} />}
                    label="实际成本 (AC)"
                    value={formatCurrency(evmMetrics.actualCost)}
                    subtitle="实际花费的成本"
                    status={
                        evmMetrics.actualCost <= evmMetrics.earnedValue ? 'good' :
                            evmMetrics.actualCost <= evmMetrics.earnedValue * 1.1 ? 'warning' :
                                'critical'
                    }
                />
            </div>

            {/* S-Curve Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                    S 曲线分析
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={evmTimeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                        />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('zh-CN')}
                        />
                        <Legend />
                        <ReferenceLine y={project.budget || 0} stroke="#94a3b8" strokeDasharray="3 3" label="预算" />
                        <Line
                            type="monotone"
                            dataKey="pv"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="计划价值 (PV)"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="ev"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="挣值 (EV)"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="ac"
                            stroke="#ef4444"
                            strokeWidth={2}
                            name="实际成本 (AC)"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Performance Indices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SPI & CPI Gauges */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        绩效指数
                    </h3>
                    <PerformanceGauge
                        label="进度绩效指数 (SPI)"
                        value={evmMetrics.schedulePerformanceIndex}
                        threshold={1.0}
                    />
                    <PerformanceGauge
                        label="成本绩效指数 (CPI)"
                        value={evmMetrics.costPerformanceIndex}
                        threshold={1.0}
                    />
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                        <p><strong>SPI &gt; 1.0:</strong> 进度超前 | <strong>SPI &lt; 1.0:</strong> 进度落后</p>
                        <p className="mt-1"><strong>CPI &gt; 1.0:</strong> 成本节约 | <strong>CPI &lt; 1.0:</strong> 成本超支</p>
                    </div>
                </div>

                {/* Variance & Forecasts */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                        偏差与预测
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">进度偏差 (SV)</span>
                            <span className={`text-lg font-bold ${evmMetrics.scheduleVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {evmMetrics.scheduleVariance >= 0 ? '+' : ''}{formatCurrency(evmMetrics.scheduleVariance)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">成本偏差 (CV)</span>
                            <span className={`text-lg font-bold ${evmMetrics.costVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {evmMetrics.costVariance >= 0 ? '+' : ''}{formatCurrency(evmMetrics.costVariance)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">完工估算 (EAC)</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(evmMetrics.estimateAtCompletion)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">完工尚需估算 (ETC)</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(evmMetrics.estimateToComplete)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">完工偏差 (VAC)</span>
                            <span className={`text-lg font-bold ${evmMetrics.varianceAtCompletion >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {evmMetrics.varianceAtCompletion >= 0 ? '+' : ''}{formatCurrency(evmMetrics.varianceAtCompletion)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EVMCharts;
