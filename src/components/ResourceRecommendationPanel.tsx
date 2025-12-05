import React, { useState, useMemo } from 'react';
import { Users, TrendingUp, DollarSign, Award, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { ResourceRequirement, ResourcePoolItem, Project } from '../types';
import { recommendResources, type ResourceRecommendation } from '../utils/resourceRecommendation';

interface ResourceRecommendationPanelProps {
    requirement: ResourceRequirement;
    resourcePool: ResourcePoolItem[];
    allProjects?: Project[];
    onSelectResource?: (resource: ResourcePoolItem) => void;
}

const ResourceRecommendationPanel: React.FC<ResourceRecommendationPanelProps> = ({
    requirement,
    resourcePool,
    allProjects = [],
    onSelectResource
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [priorityMode, setPriorityMode] = useState<'skills' | 'cost' | 'availability'>('skills');

    // 获取推荐
    const recommendations = useMemo(() => {
        return recommendResources(
            requirement,
            resourcePool,
            allProjects,
            {
                prioritizeSkills: priorityMode === 'skills',
                prioritizeCost: priorityMode === 'cost',
                prioritizeAvailability: priorityMode === 'availability'
            }
        );
    }, [requirement, resourcePool, allProjects, priorityMode]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">资源推荐</h3>
                    <div className="text-sm text-slate-500">
                        需求: {requirement.count} 人 × {requirement.duration} {
                            requirement.unit === 'day' ? '天' :
                                requirement.unit === 'month' ? '月' : '年'
                        }
                    </div>
                </div>

                {/* 优先级模式切换 */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setPriorityMode('skills')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${priorityMode === 'skills'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Award size={14} className="inline mr-1" />
                        技能优先
                    </button>
                    <button
                        onClick={() => setPriorityMode('availability')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${priorityMode === 'availability'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Users size={14} className="inline mr-1" />
                        可用性优先
                    </button>
                    <button
                        onClick={() => setPriorityMode('cost')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${priorityMode === 'cost'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <DollarSign size={14} className="inline mr-1" />
                        成本优先
                    </button>
                </div>
            </div>

            {/* 推荐列表 */}
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {recommendations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Users size={48} className="mx-auto mb-3 opacity-30" />
                        <p>暂无可用资源</p>
                    </div>
                ) : (
                    recommendations.map((rec, index) => (
                        <div
                            key={rec.resource.id}
                            className="p-4 hover:bg-slate-50 transition-colors"
                        >
                            {/* 资源卡片头部 */}
                            <div className="flex items-start gap-3">
                                {/* 排名徽章 */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-slate-200 text-slate-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-slate-100 text-slate-600'
                                    }`}>
                                    {index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* 资源名称和评分 */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-slate-900">{rec.resource.name}</h4>
                                        <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(rec.score)}`}>
                                            {rec.score.toFixed(0)} 分
                                        </div>
                                    </div>

                                    {/* 评分条 */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getScoreBarColor(rec.score)} transition-all`}
                                                    style={{ width: `${rec.score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-500 w-12 text-right">
                                                {rec.score.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* 关键指标 */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center p-2 bg-slate-50 rounded">
                                            <div className="text-xs text-slate-500 mb-1">技能匹配</div>
                                            <div className={`text-sm font-semibold ${rec.matchRate >= 80 ? 'text-green-600' :
                                                    rec.matchRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {rec.matchRate.toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className="text-center p-2 bg-slate-50 rounded">
                                            <div className="text-xs text-slate-500 mb-1">可用性</div>
                                            <div className={`text-sm font-semibold ${rec.availability >= 80 ? 'text-green-600' :
                                                    rec.availability >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {rec.availability.toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className="text-center p-2 bg-slate-50 rounded">
                                            <div className="text-xs text-slate-500 mb-1">成本效率</div>
                                            <div className={`text-sm font-semibold ${rec.costEfficiency >= 80 ? 'text-green-600' :
                                                    rec.costEfficiency >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {rec.costEfficiency.toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* 推荐理由和警告 */}
                                    <div className="space-y-2 mb-3">
                                        {rec.reasons.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-slate-600">
                                                    {rec.reasons.join('；')}
                                                </div>
                                            </div>
                                        )}
                                        {rec.warnings.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <AlertCircle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-slate-600">
                                                    {rec.warnings.join('；')}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 详细信息展开 */}
                                    <button
                                        onClick={() => setExpandedId(expandedId === rec.resource.id ? null : rec.resource.id)}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        {expandedId === rec.resource.id ? (
                                            <>
                                                <ChevronUp size={14} />
                                                收起详情
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={14} />
                                                查看详情
                                            </>
                                        )}
                                    </button>

                                    {/* 展开的详细信息 */}
                                    {expandedId === rec.resource.id && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                                            <div className="text-xs">
                                                <span className="text-slate-500">总容量：</span>
                                                <span className="text-slate-900 font-medium">{rec.resource.totalQuantity} 人</span>
                                            </div>
                                            {rec.resource.hourlyRate && (
                                                <div className="text-xs">
                                                    <span className="text-slate-500">时薪：</span>
                                                    <span className="text-slate-900 font-medium">¥{rec.resource.hourlyRate}/小时</span>
                                                </div>
                                            )}
                                            {rec.resource.skills && rec.resource.skills.length > 0 && (
                                                <div className="text-xs">
                                                    <span className="text-slate-500 block mb-1">技能：</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {rec.resource.skills.map((skill, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                                                            >
                                                                {skill.name} ({skill.level})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 操作按钮 */}
                                    {onSelectResource && (
                                        <button
                                            onClick={() => onSelectResource(rec.resource)}
                                            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            选择此资源
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ResourceRecommendationPanel;
