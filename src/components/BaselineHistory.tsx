import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History, Plus, Check, X, Calendar, User, TrendingUp,
    TrendingDown, AlertCircle, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import type { Project, ProjectBaseline, VarianceMetrics } from '../types';
import {
    createBaseline,
    calculateVariance,
    getVarianceStatus,
    formatVariance,
    getActiveBaseline
} from '../utils/baselineManagement';

interface BaselineHistoryProps {
    project: Project;
    onCreateBaseline: (baseline: ProjectBaseline) => void;
    onSetActiveBaseline: (baselineId: string) => void;
    currentUserId: string;
    currentUserName: string;
}

const BaselineHistory: React.FC<BaselineHistoryProps> = ({
    project,
    onCreateBaseline,
    onSetActiveBaseline,
    currentUserId,
    currentUserName
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newBaselineName, setNewBaselineName] = useState('');
    const [newBaselineDesc, setNewBaselineDesc] = useState('');

    const baselines = project.baselines || [];
    const activeBaseline = getActiveBaseline(project);

    const handleCreate = () => {
        if (!newBaselineName.trim()) return;

        const baseline = createBaseline(
            project,
            newBaselineName,
            newBaselineDesc,
            currentUserId,
            currentUserName
        );

        onCreateBaseline(baseline);
        setIsCreating(false);
        setNewBaselineName('');
        setNewBaselineDesc('');
    };

    const getVarianceMetrics = (baseline: ProjectBaseline): VarianceMetrics | null => {
        if (!baseline) return null;
        return calculateVariance(project, baseline);
    };

    const VarianceIndicator: React.FC<{ variance: number; unit: 'days' | 'currency' | 'percent' }> = ({ variance, unit }) => {
        const status = getVarianceStatus(variance);
        const color = status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-orange-600' : 'text-red-600';
        const Icon = variance > 0 ? TrendingUp : variance < 0 ? TrendingDown : AlertCircle;

        return (
            <div className={`flex items-center gap-1 ${color} text-sm font-medium`}>
                <Icon size={14} />
                <span>{formatVariance(variance, unit)}</span>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="text-blue-600 dark:text-blue-400" size={20} />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            基线管理
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                            {baselines.length} 个基线
                        </span>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus size={16} />
                        创建基线
                    </button>
                </div>
            </div>

            {/* Create Baseline Form */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-hidden"
                    >
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    基线名称 *
                                </label>
                                <input
                                    type="text"
                                    value={newBaselineName}
                                    onChange={(e) => setNewBaselineName(e.target.value)}
                                    placeholder="例如: Baseline 1.0"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    描述
                                </label>
                                <textarea
                                    value={newBaselineDesc}
                                    onChange={(e) => setNewBaselineDesc(e.target.value)}
                                    placeholder="说明创建此基线的原因..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreate}
                                    disabled={!newBaselineName.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Check size={16} />
                                    创建
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewBaselineName('');
                                        setNewBaselineDesc('');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <X size={16} />
                                    取消
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Baseline List */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {baselines.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <FileText size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">暂无基线</p>
                        <p className="text-xs mt-1">创建基线以跟踪项目变更和偏差</p>
                    </div>
                ) : (
                    baselines.map((baseline) => {
                        const isActive = activeBaseline?.id === baseline.id;
                        const variance = getVarianceMetrics(baseline);

                        return (
                            <div
                                key={baseline.id}
                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-600' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                {baseline.name}
                                            </h4>
                                            {isActive && (
                                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                                                    当前基线
                                                </span>
                                            )}
                                        </div>

                                        {baseline.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                {baseline.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {format(new Date(baseline.createdDate), 'yyyy-MM-dd HH:mm')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User size={12} />
                                                {baseline.createdByName || baseline.createdBy}
                                            </div>
                                        </div>

                                        {/* Variance Metrics */}
                                        {isActive && variance && (
                                            <div className="mt-3 grid grid-cols-3 gap-3">
                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-600">
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">进度偏差</div>
                                                    <VarianceIndicator variance={variance.scheduleVariance} unit="days" />
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-600">
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">成本偏差</div>
                                                    <VarianceIndicator variance={variance.costVariance} unit="currency" />
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-600">
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">预算偏差</div>
                                                    <VarianceIndicator variance={variance.budgetVariancePercent} unit="percent" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!isActive && (
                                        <button
                                            onClick={() => onSetActiveBaseline(baseline.id)}
                                            className="ml-4 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            设为当前
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default BaselineHistory;
