import React, { useMemo, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Shield, Calendar, DollarSign, Users, Award, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import type { Project, Task, ResourcePoolItem } from '../types';
import { generateRiskWarnings, getRiskSummary, type RiskWarning, type WarningCategory, type WarningLevel } from '../utils/riskWarning';

interface RiskWarningPanelProps {
    project: Project;
    tasks: Task[];
    allProjects?: Project[];
    resourcePool?: ResourcePoolItem[];
}

const RiskWarningPanel: React.FC<RiskWarningPanelProps> = ({
    project,
    tasks,
    allProjects = [],
    resourcePool = []
}) => {
    const [levelFilter, setLevelFilter] = useState<WarningLevel | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<WarningCategory | 'all'>('all');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // 生成风险预警
    const warnings = useMemo(() => {
        return generateRiskWarnings(project, tasks, allProjects, resourcePool);
    }, [project, tasks, allProjects, resourcePool]);

    // 获取摘要
    const summary = useMemo(() => {
        return getRiskSummary(warnings);
    }, [warnings]);

    // 过滤后的预警
    const filteredWarnings = useMemo(() => {
        let filtered = warnings;

        if (levelFilter !== 'all') {
            filtered = filtered.filter(w => w.level === levelFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(w => w.category === categoryFilter);
        }

        return filtered;
    }, [warnings, levelFilter, categoryFilter]);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const getLevelIcon = (level: WarningLevel) => {
        switch (level) {
            case 'critical':
                return <AlertTriangle size={18} />;
            case 'warning':
                return <AlertCircle size={18} />;
            case 'info':
                return <Info size={18} />;
        }
    };

    const getLevelColor = (level: WarningLevel) => {
        switch (level) {
            case 'critical':
                return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-500' };
            case 'warning':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-500' };
            case 'info':
                return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-500' };
        }
    };

    const getCategoryIcon = (category: WarningCategory) => {
        switch (category) {
            case 'schedule':
                return <Calendar size={16} />;
            case 'cost':
                return <DollarSign size={16} />;
            case 'resource':
                return <Users size={16} />;
            case 'quality':
                return <Award size={16} />;
            case 'team':
                return <Users size={16} />;
        }
    };

    const getCategoryLabel = (category: WarningCategory) => {
        switch (category) {
            case 'schedule':
                return '进度';
            case 'cost':
                return '成本';
            case 'resource':
                return '资源';
            case 'quality':
                return '质量';
            case 'team':
                return '团队';
        }
    };

    return (
        <div className="space-y-4">
            {/* 风险摘要卡片 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">风险预警摘要</h3>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
                        <div className="text-xs text-slate-500">总预警</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-700">{summary.critical}</div>
                        <div className="text-xs text-red-600">严重</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700">{summary.warning}</div>
                        <div className="text-xs text-yellow-600">警告</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">{summary.info}</div>
                        <div className="text-xs text-blue-600">提示</div>
                    </div>
                </div>

                {/* 按类别统计 */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(summary.byCategory).map(([cat, count]) => (
                        count > 0 && (
                            <span key={cat} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                                {getCategoryIcon(cat as WarningCategory)}
                                {getCategoryLabel(cat as WarningCategory)}: {count}
                            </span>
                        )
                    ))}
                </div>
            </div>

            {/* 过滤器 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <Filter size={16} className="text-slate-400" />

                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value as any)}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="all">所有级别</option>
                        <option value="critical">严重</option>
                        <option value="warning">警告</option>
                        <option value="info">提示</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as any)}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="all">所有类别</option>
                        <option value="schedule">进度</option>
                        <option value="cost">成本</option>
                        <option value="resource">资源</option>
                        <option value="quality">质量</option>
                        <option value="team">团队</option>
                    </select>

                    <span className="text-sm text-slate-500 ml-auto">
                        显示 {filteredWarnings.length} / {warnings.length} 条预警
                    </span>
                </div>
            </div>

            {/* 预警列表 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">
                {filteredWarnings.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Shield size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                            {warnings.length === 0 ? '暂无风险预警，项目状态良好' : '没有符合过滤条件的预警'}
                        </p>
                    </div>
                ) : (
                    filteredWarnings.map(warning => {
                        const levelColor = getLevelColor(warning.level);
                        const isExpanded = expandedIds.has(warning.id);

                        return (
                            <div key={warning.id} className={`${levelColor.bg} ${levelColor.border} border-l-4`}>
                                {/* 预警头部 */}
                                <button
                                    onClick={() => toggleExpand(warning.id)}
                                    className="w-full p-4 text-left hover:bg-white/50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 ${levelColor.text}`}>
                                            {getLevelIcon(warning.level)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-medium ${levelColor.text}`}>
                                                    {warning.title}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded text-xs text-white ${levelColor.badge}`}>
                                                    {warning.level === 'critical' ? '严重' :
                                                        warning.level === 'warning' ? '警告' : '提示'}
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs flex items-center gap-1">
                                                    {getCategoryIcon(warning.category)}
                                                    {getCategoryLabel(warning.category)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700">{warning.description}</p>
                                        </div>

                                        <div className="flex-shrink-0 text-slate-400">
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </div>
                                </button>

                                {/* 展开详情 */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 ml-9 space-y-3">
                                        {/* 影响 */}
                                        <div className="p-3 bg-white/60 rounded-lg">
                                            <div className="text-xs font-medium text-slate-500 mb-1">潜在影响</div>
                                            <div className="text-sm text-slate-700">{warning.impact}</div>
                                        </div>

                                        {/* 指标 */}
                                        {warning.metrics && Object.keys(warning.metrics).length > 0 && (
                                            <div className="p-3 bg-white/60 rounded-lg">
                                                <div className="text-xs font-medium text-slate-500 mb-2">相关指标</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(warning.metrics).map(([key, value]) => (
                                                        <span key={key} className="px-2 py-1 bg-slate-100 rounded text-xs">
                                                            <span className="text-slate-500">{key}:</span>{' '}
                                                            <span className="font-medium text-slate-900">{value}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 建议 */}
                                        <div className="p-3 bg-white/60 rounded-lg">
                                            <div className="text-xs font-medium text-slate-500 mb-2">应对建议</div>
                                            <ul className="space-y-1">
                                                {warning.suggestions.map((suggestion, index) => (
                                                    <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="text-blue-600 mt-0.5">•</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RiskWarningPanel;
