import React, { useState, useMemo } from 'react';
import { Calendar, Sliders, ArrowRight, CheckCircle, AlertTriangle, RefreshCw, BarChart2 } from 'lucide-react';
import type { Project, Task, ResourcePoolItem } from '../types';
import { optimizeSchedule } from '../utils/scheduleOptimizer';

interface ScheduleOptimizerPanelProps {
    project: Project;
    tasks: Task[];
    resourcePool: ResourcePoolItem[];
    onApplyChanges: (optimizedTasks: Task[]) => void;
}

const ScheduleOptimizerPanel: React.FC<ScheduleOptimizerPanelProps> = ({
    project,
    tasks,
    resourcePool,
    onApplyChanges
}) => {
    const [strategy, setStrategy] = useState<'smoothing' | 'leveling'>('smoothing');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof optimizeSchedule> | null>(null);

    const handleOptimize = () => {
        setIsOptimizing(true);
        // 使用 setTimeout 让 UI 有机会渲染 loading 状态
        setTimeout(() => {
            const optimizationResult = optimizeSchedule(project, tasks, resourcePool, strategy);
            setResult(optimizationResult);
            setIsOptimizing(false);
        }, 500);
    };

    const handleApply = () => {
        if (result) {
            onApplyChanges(result.optimizedTasks);
            setResult(null);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                    <Sliders size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">智能进度调度</h3>
                </div>
                <p className="text-sm text-slate-500">
                    自动调整任务时间以解决资源冲突并优化工期
                </p>
            </div>

            {/* 策略选择 */}
            <div className="p-6 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setStrategy('smoothing')}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${strategy === 'smoothing'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-200'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-900">资源平滑 (Smoothing)</span>
                            {strategy === 'smoothing' && <CheckCircle size={18} className="text-blue-600" />}
                        </div>
                        <p className="text-sm text-slate-600">
                            利用任务浮动时间调整进度，<span className="font-medium text-blue-700">不延长项目工期</span>。适用于资源有限但工期固定的场景。
                        </p>
                    </button>

                    <button
                        onClick={() => setStrategy('leveling')}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${strategy === 'leveling'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-slate-200 hover:border-purple-200'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-900">资源平衡 (Leveling)</span>
                            {strategy === 'leveling' && <CheckCircle size={18} className="text-purple-600" />}
                        </div>
                        <p className="text-sm text-slate-600">
                            彻底解决资源冲突，可能<span className="font-medium text-purple-700">延长项目工期</span>。适用于资源刚性约束的场景。
                        </p>
                    </button>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleOptimize}
                        disabled={isOptimizing}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                    >
                        {isOptimizing ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                正在计算最优解...
                            </>
                        ) : (
                            <>
                                <BarChart2 size={18} />
                                开始优化计算
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 优化结果 */}
            {result && (
                <div className="p-6 bg-slate-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-900">优化方案预览</h4>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setResult(null)}
                                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium"
                            >
                                放弃
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                应用方案
                            </button>
                        </div>
                    </div>

                    {/* 核心指标对比 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="text-sm text-slate-500 mb-1">项目工期</div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-slate-900">
                                    {result.metrics.newDuration} 天
                                </span>
                                <span className={`text-xs mb-1 ${result.metrics.newDuration > result.metrics.originalDuration
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                    }`}>
                                    ({result.metrics.newDuration - result.metrics.originalDuration > 0 ? '+' : ''}
                                    {result.metrics.newDuration - result.metrics.originalDuration} 天)
                                </span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="text-sm text-slate-500 mb-1">解决冲突</div>
                            <div className="text-xl font-bold text-green-600">
                                {result.metrics.conflictsResolved} 个
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="text-sm text-slate-500 mb-1">资源峰值削减</div>
                            <div className="text-xl font-bold text-blue-600">
                                {result.metrics.resourcePeakReduced} 单位
                            </div>
                        </div>
                    </div>

                    {/* 变更列表 */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium text-sm text-slate-700">
                            变更详情 ({result.changes.length})
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                            {result.changes.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    没有需要调整的任务，当前计划已是最优。
                                </div>
                            ) : (
                                result.changes.map((change, index) => (
                                    <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-900 text-sm">
                                                {change.taskName}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                                推迟 {change.delay} 天
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar size={12} />
                                            <span>{change.originalStart}</span>
                                            <ArrowRight size={12} />
                                            <span className="text-slate-900 font-medium">{change.newStart}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-400">
                                            原因: {change.reason}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 警告信息 */}
                    {strategy === 'leveling' && result.metrics.newDuration > result.metrics.originalDuration && (
                        <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                            <p>
                                注意：为了解决资源冲突，项目总工期延长了 {result.metrics.newDuration - result.metrics.originalDuration} 天。
                                请确认这是否符合项目交付要求。
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScheduleOptimizerPanel;
