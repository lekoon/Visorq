import React, { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Users, Calendar, AlertTriangle, CheckCircle, ChevronRight, BarChart3 } from 'lucide-react';
import type { Project, ResourcePoolItem } from '../types';
import { generateOptimizationSuggestions, simulateOptimization } from '../utils/resourceOptimization';

interface ResourceOptimizationPanelProps {
    projects: Project[];
    resourcePool: ResourcePoolItem[];
}

const ResourceOptimizationPanel: React.FC<ResourceOptimizationPanelProps> = ({
    projects,
    resourcePool
}) => {
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
    const [showSimulation, setShowSimulation] = useState(false);

    // 生成优化建议
    const optimizationResult = useMemo(() => {
        return generateOptimizationSuggestions(projects, resourcePool);
    }, [projects, resourcePool]);

    // 模拟优化效果
    const simulation = useMemo(() => {
        if (!showSimulation || selectedSuggestions.size === 0) return null;

        const selected = optimizationResult.suggestions.filter((_, index) =>
            selectedSuggestions.has(index)
        );

        return simulateOptimization(projects, resourcePool, selected);
    }, [projects, resourcePool, optimizationResult.suggestions, selectedSuggestions, showSimulation]);

    const toggleSuggestion = (index: number) => {
        const newSet = new Set(selectedSuggestions);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedSuggestions(newSet);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'reallocation':
                return <Users size={18} />;
            case 'hiring':
                return <TrendingUp size={18} />;
            case 'training':
                return <CheckCircle size={18} />;
            case 'schedule':
                return <Calendar size={18} />;
            case 'cost':
                return <DollarSign size={18} />;
            default:
                return <BarChart3 size={18} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'reallocation':
                return 'bg-blue-100 text-blue-700';
            case 'hiring':
                return 'bg-purple-100 text-purple-700';
            case 'training':
                return 'bg-green-100 text-green-700';
            case 'schedule':
                return 'bg-orange-100 text-orange-700';
            case 'cost':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getComplexityText = (complexity: string) => {
        switch (complexity) {
            case 'low':
                return '低';
            case 'medium':
                return '中';
            case 'high':
                return '高';
            default:
                return '未知';
        }
    };

    return (
        <div className="space-y-6">
            {/* 当前状态概览 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4">当前资源状态</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500 mb-1">总成本</div>
                        <div className="text-xl font-bold text-slate-900">
                            ¥{optimizationResult.currentState.totalCost.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500 mb-1">平均利用率</div>
                        <div className="text-xl font-bold text-slate-900">
                            {optimizationResult.currentState.averageUtilization.toFixed(0)}%
                        </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-sm text-red-600 mb-1">过载资源</div>
                        <div className="text-xl font-bold text-red-700">
                            {optimizationResult.currentState.overloadedCount}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600 mb-1">闲置资源</div>
                        <div className="text-xl font-bold text-blue-700">
                            {optimizationResult.currentState.underutilizedCount}
                        </div>
                    </div>
                </div>
            </div>

            {/* 优化建议列表 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">优化建议 ({optimizationResult.suggestions.length})</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">实施复杂度:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${optimizationResult.implementationComplexity === 'low' ? 'bg-green-100 text-green-700' :
                                optimizationResult.implementationComplexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            {getComplexityText(optimizationResult.implementationComplexity)}
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {optimizationResult.suggestions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                            <p>当前资源配置良好，暂无优化建议</p>
                        </div>
                    ) : (
                        optimizationResult.suggestions.map((suggestion, index) => (
                            <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    {/* 选择框 */}
                                    <input
                                        type="checkbox"
                                        checked={selectedSuggestions.has(index)}
                                        onChange={() => toggleSuggestion(index)}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />

                                    {/* 类型图标 */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(suggestion.type)}`}>
                                        {getTypeIcon(suggestion.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* 标题和优先级 */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium text-slate-900">{suggestion.title}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                                                {suggestion.priority === 'high' ? '高优先级' :
                                                    suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                                            </span>
                                        </div>

                                        {/* 描述 */}
                                        <p className="text-sm text-slate-600 mb-3">{suggestion.description}</p>

                                        {/* 影响指标 */}
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {suggestion.impact.costSaving !== undefined && suggestion.impact.costSaving !== 0 && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <DollarSign size={14} className={suggestion.impact.costSaving > 0 ? 'text-green-600' : 'text-red-600'} />
                                                    <span className={suggestion.impact.costSaving > 0 ? 'text-green-700' : 'text-red-700'}>
                                                        {suggestion.impact.costSaving > 0 ? '节省' : '增加'} ¥{Math.abs(suggestion.impact.costSaving).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {suggestion.impact.efficiencyGain !== undefined && suggestion.impact.efficiencyGain > 0 && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <TrendingUp size={14} className="text-blue-600" />
                                                    <span className="text-blue-700">
                                                        效率提升 {suggestion.impact.efficiencyGain}%
                                                    </span>
                                                </div>
                                            )}
                                            {suggestion.impact.riskReduction !== undefined && suggestion.impact.riskReduction > 0 && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <AlertTriangle size={14} className="text-orange-600" />
                                                    <span className="text-orange-700">
                                                        风险降低 {suggestion.impact.riskReduction}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 行动步骤 */}
                                        <details className="group">
                                            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
                                                查看行动步骤
                                            </summary>
                                            <ul className="mt-2 space-y-1 ml-5">
                                                {suggestion.actions.map((action, i) => (
                                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                        <span className="text-blue-600 mt-0.5">•</span>
                                                        <span>{action}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 模拟结果 */}
            {selectedSuggestions.size > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">优化效果预测</h3>
                        <button
                            onClick={() => setShowSimulation(!showSimulation)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {showSimulation ? '隐藏' : '查看'}模拟结果
                        </button>
                    </div>

                    {showSimulation && simulation && (
                        <div className="p-6 space-y-6">
                            {/* 对比图表 */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* 优化前 */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">优化前</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                                            <span className="text-sm text-slate-600">总成本</span>
                                            <span className="font-semibold text-slate-900">
                                                ¥{simulation.before.totalCost.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                                            <span className="text-sm text-slate-600">平均利用率</span>
                                            <span className="font-semibold text-slate-900">
                                                {simulation.before.averageUtilization.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                                            <span className="text-sm text-red-600">过载资源</span>
                                            <span className="font-semibold text-red-700">
                                                {simulation.before.overloadedCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 优化后 */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">优化后</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                                            <span className="text-sm text-green-600">总成本</span>
                                            <span className="font-semibold text-green-700">
                                                ¥{simulation.after.totalCost.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                                            <span className="text-sm text-green-600">平均利用率</span>
                                            <span className="font-semibold text-green-700">
                                                {simulation.after.averageUtilization.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                                            <span className="text-sm text-green-600">过载资源</span>
                                            <span className="font-semibold text-green-700">
                                                {simulation.after.overloadedCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 改进指标 */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-3">预期改进</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-700">
                                            ¥{simulation.improvement.costReduction.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-blue-600 mt-1">成本节省</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-700">
                                            +{simulation.improvement.utilizationIncrease.toFixed(0)}%
                                        </div>
                                        <div className="text-sm text-blue-600 mt-1">利用率提升</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-700">
                                            -{simulation.improvement.riskReduction.toFixed(0)}%
                                        </div>
                                        <div className="text-sm text-blue-600 mt-1">风险降低</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResourceOptimizationPanel;
