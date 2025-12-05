/**
 * Enhanced Project Health Visualization
 * 智能健康度可视化 - 使用 Recharts 和动画
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import type { Project, Task } from '../types';
import { calculateProjectHealth } from '../utils/projectHealth';

interface Props {
    project: Project;
    tasks: Task[];
    allProjects: Project[];
    showComparison?: boolean;
}

const EnhancedHealthVisualization: React.FC<Props> = ({
    project,
    tasks,
    allProjects,
    showComparison = false,
}) => {
    // 计算健康度数据
    const healthData = useMemo(() => {
        const health = calculateProjectHealth(project, tasks, allProjects);

        return [
            {
                dimension: '进度',
                value: health.dimensions.schedule,
                fullMark: 100,
            },
            {
                dimension: '成本',
                value: health.dimensions.cost,
                fullMark: 100,
            },
            {
                dimension: '资源',
                value: health.dimensions.resources,
                fullMark: 100,
            },
            {
                dimension: '风险',
                value: health.dimensions.risks,
                fullMark: 100,
            },
            {
                dimension: '质量',
                value: health.dimensions.quality,
                fullMark: 100,
            },
            {
                dimension: '团队',
                value: health.dimensions.team,
                fullMark: 100,
            },
        ];
    }, [project, tasks, allProjects]);

    const overallHealth = useMemo(() => {
        return calculateProjectHealth(project, tasks, allProjects);
    }, [project, tasks, allProjects]);

    // 健康度等级
    const getHealthLevel = (score: number) => {
        if (score >= 80) return { label: '优秀', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
        if (score >= 60) return { label: '良好', color: 'text-blue-600', bg: 'bg-blue-100', icon: TrendingUp };
        if (score >= 40) return { label: '警告', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertCircle };
        return { label: '危险', color: 'text-red-600', bg: 'bg-red-100', icon: TrendingDown };
    };

    const healthLevel = getHealthLevel(overallHealth.overallScore);
    const HealthIcon = healthLevel.icon;

    // 自定义 Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">{data.payload.dimension}</p>
                    <p className="text-2xl font-bold text-blue-600">{data.value}</p>
                    <p className="text-xs text-slate-500">满分: {data.payload.fullMark}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* 总体健康度卡片 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">项目健康度</h3>
                        <div className="flex items-center gap-3">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="text-5xl font-bold text-blue-600"
                            >
                                {overallHealth.overallScore}
                            </motion.div>
                            <div>
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${healthLevel.bg} ${healthLevel.color} text-sm font-semibold`}>
                                    <HealthIcon size={16} />
                                    {healthLevel.label}
                                </div>
                                <p className="text-xs text-slate-600 mt-1">
                                    {overallHealth.spi > 0 && `SPI: ${overallHealth.spi.toFixed(2)}`}
                                    {overallHealth.cpi > 0 && ` | CPI: ${overallHealth.cpi.toFixed(2)}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 环形进度指示器 */}
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#E5E7EB"
                                strokeWidth="8"
                                fill="none"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="url(#healthGradient)"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: '0 352' }}
                                animate={{
                                    strokeDasharray: `${(overallHealth.overallScore / 100) * 352} 352`
                                }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                            <defs>
                                <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-700">
                                {overallHealth.overallScore}%
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 雷达图 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
                <h4 className="text-lg font-semibold text-slate-900 mb-4">六维健康度分析</h4>
                <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={healthData}>
                        <defs>
                            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis
                            dataKey="dimension"
                            tick={{ fill: '#64748B', fontSize: 14, fontWeight: 500 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                        />
                        <Radar
                            name="健康度"
                            dataKey="value"
                            stroke="#3B82F6"
                            fill="url(#radarGradient)"
                            fillOpacity={0.6}
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', r: 4 }}
                            animationDuration={1000}
                            animationEasing="ease-out"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* 维度详情卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.map((item, index) => {
                    const level = getHealthLevel(item.value);
                    const Icon = level.icon;

                    return (
                        <motion.div
                            key={item.dimension}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                            className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-700">{item.dimension}</span>
                                <Icon size={18} className={level.color} />
                            </div>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-bold text-slate-900">{item.value}</span>
                                <span className="text-sm text-slate-500 mb-1">/ 100</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.value}%` }}
                                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${item.value >= 80
                                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                                            : item.value >= 60
                                                ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                                                : item.value >= 40
                                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                                    : 'bg-gradient-to-r from-red-400 to-red-600'
                                        }`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 改进建议 */}
            {overallHealth.suggestions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="bg-amber-50 rounded-xl p-6 border border-amber-200"
                >
                    <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                        <AlertCircle size={20} />
                        改进建议
                    </h4>
                    <ul className="space-y-2">
                        {overallHealth.suggestions.map((suggestion, index) => (
                            <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.1 + index * 0.1, duration: 0.3 }}
                                className="flex items-start gap-2 text-amber-800"
                            >
                                <span className="text-amber-600 mt-1">•</span>
                                <span>{suggestion}</span>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
};

export default EnhancedHealthVisualization;
