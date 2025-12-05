/**
 * Enhanced Cost Trend Visualization
 * 智能成本趋势可视化 - EVM 多线图
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
    ReferenceLine,
    Brush,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import type { Project, Task } from '../types';
import { calculateEVM, generateCostTrendData } from '../utils/costControl';
import { format } from 'date-fns';

interface Props {
    project: Project;
    tasks: Task[];
}

const EnhancedCostTrendVisualization: React.FC<Props> = ({ project, tasks }) => {
    const [timeRange, setTimeRange] = useState<'all' | '3m' | '6m' | '1y'>('all');
    const [showPrediction, setShowPrediction] = useState(true);

    // 计算 EVM 数据
    const evmData = useMemo(() => {
        return calculateEVM(project, tasks);
    }, [project, tasks]);

    // 生成趋势数据
    const trendData = useMemo(() => {
        const data = generateCostTrendData(project, tasks);

        // 根据时间范围过滤
        if (timeRange === '3m') {
            return data.slice(-12); // 最近3个月（假设每周一个数据点）
        } else if (timeRange === '6m') {
            return data.slice(-24);
        } else if (timeRange === '1y') {
            return data.slice(-52);
        }
        return data;
    }, [project, tasks, timeRange]);

    // 计算趋势指标
    const trendMetrics = useMemo(() => {
        if (trendData.length < 2) return null;

        const latest = trendData[trendData.length - 1];
        const previous = trendData[trendData.length - 2];

        const acChange = latest.AC - previous.AC;
        const evChange = latest.EV - previous.EV;

        return {
            acChange,
            evChange,
            acTrend: acChange > 0 ? 'up' : 'down',
            evTrend: evChange > 0 ? 'up' : 'down',
        };
    }, [trendData]);

    // 自定义 Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm">
                            <span style={{ color: entry.color }} className="font-medium">
                                {entry.name}:
                            </span>
                            <span className="font-bold">
                                ${entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {payload[0]?.payload.variance && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                            <div className="text-xs text-slate-600">
                                成本偏差: <span className={payload[0].payload.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                                    ${Math.abs(payload[0].payload.variance).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* EVM 指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CPI 卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`rounded-xl p-5 ${evmData.CPI >= 1
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                        } border`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">成本绩效指数</span>
                        <DollarSign size={20} className={evmData.CPI >= 1 ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{ color: evmData.CPI >= 1 ? '#059669' : '#DC2626' }}>
                        {evmData.CPI.toFixed(2)}
                    </div>
                    <p className="text-xs text-slate-600">
                        {evmData.CPI >= 1 ? '成本控制良好' : '成本超支'}
                    </p>
                </motion.div>

                {/* SPI 卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className={`rounded-xl p-5 ${evmData.SPI >= 1
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                            : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                        } border`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">进度绩效指数</span>
                        <Calendar size={20} className={evmData.SPI >= 1 ? 'text-blue-600' : 'text-orange-600'} />
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{ color: evmData.SPI >= 1 ? '#2563EB' : '#EA580C' }}>
                        {evmData.SPI.toFixed(2)}
                    </div>
                    <p className="text-xs text-slate-600">
                        {evmData.SPI >= 1 ? '进度正常' : '进度延迟'}
                    </p>
                </motion.div>

                {/* EAC 卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-200"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">完工估算</span>
                        <TrendingUp size={20} className="text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                        ${evmData.EAC.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-600">
                        预计总成本
                    </p>
                </motion.div>

                {/* VAC 卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className={`rounded-xl p-5 ${evmData.VAC >= 0
                            ? 'bg-gradient-to-br from-green-50 to-teal-50 border-green-200'
                            : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                        } border`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">完工偏差</span>
                        {evmData.VAC >= 0 ? (
                            <TrendingUp size={20} className="text-green-600" />
                        ) : (
                            <TrendingDown size={20} className="text-red-600" />
                        )}
                    </div>
                    <div className={`text-3xl font-bold mb-1 ${evmData.VAC >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(evmData.VAC).toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-600">
                        {evmData.VAC >= 0 ? '预算节余' : '预算超支'}
                    </p>
                </motion.div>
            </div>

            {/* 趋势图控制 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-slate-900">成本趋势分析</h4>
                    <div className="flex items-center gap-3">
                        {/* 时间范围选择 */}
                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                            {(['all', '3m', '6m', '1y'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${timeRange === range
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    {range === 'all' ? '全部' : range.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* 预测开关 */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showPrediction}
                                onChange={(e) => setShowPrediction(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">显示预测</span>
                        </label>
                    </div>
                </div>

                {/* 趋势图 */}
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="evGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="acGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                        />
                        <YAxis
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}
                        />

                        {/* 计划价值 */}
                        <Area
                            type="monotone"
                            dataKey="PV"
                            stroke="#8B5CF6"
                            fill="url(#pvGradient)"
                            strokeWidth={2}
                            name="计划价值 (PV)"
                            animationDuration={1000}
                        />

                        {/* 挣值 */}
                        <Area
                            type="monotone"
                            dataKey="EV"
                            stroke="#3B82F6"
                            fill="url(#evGradient)"
                            strokeWidth={2}
                            name="挣值 (EV)"
                            animationDuration={1200}
                        />

                        {/* 实际成本 */}
                        <Line
                            type="monotone"
                            dataKey="AC"
                            stroke="#EF4444"
                            strokeWidth={3}
                            dot={{ fill: '#EF4444', r: 4 }}
                            name="实际成本 (AC)"
                            animationDuration={1400}
                        />

                        {/* 预测线 */}
                        {showPrediction && (
                            <Line
                                type="monotone"
                                dataKey="predicted"
                                stroke="#F59E0B"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="预测成本"
                                animationDuration={1600}
                            />
                        )}

                        {/* 预算基准线 */}
                        <ReferenceLine
                            y={evmData.BAC}
                            stroke="#10B981"
                            strokeDasharray="3 3"
                            label={{ value: '预算基准', fill: '#10B981', fontSize: 12 }}
                        />

                        <Brush
                            dataKey="date"
                            height={30}
                            stroke="#3B82F6"
                            tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </motion.div>

            {/* 趋势洞察 */}
            {trendMetrics && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="bg-blue-50 rounded-xl p-6 border border-blue-200"
                >
                    <h4 className="text-lg font-semibold text-blue-900 mb-4">趋势洞察</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            {trendMetrics.acTrend === 'up' ? (
                                <TrendingUp className="text-red-600" size={24} />
                            ) : (
                                <TrendingDown className="text-green-600" size={24} />
                            )}
                            <div>
                                <p className="text-sm text-slate-600">实际成本变化</p>
                                <p className={`text-xl font-bold ${trendMetrics.acTrend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                                    {trendMetrics.acTrend === 'up' ? '+' : ''}${trendMetrics.acChange.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {trendMetrics.evTrend === 'up' ? (
                                <TrendingUp className="text-green-600" size={24} />
                            ) : (
                                <TrendingDown className="text-red-600" size={24} />
                            )}
                            <div>
                                <p className="text-sm text-slate-600">挣值变化</p>
                                <p className={`text-xl font-bold ${trendMetrics.evTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trendMetrics.evTrend === 'up' ? '+' : ''}${trendMetrics.evChange.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default EnhancedCostTrendVisualization;
