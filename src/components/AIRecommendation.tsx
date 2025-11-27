import React, { useState, useMemo } from 'react';
import { Brain, TrendingUp, Users, AlertCircle, CheckCircle, X } from 'lucide-react';
import type { Project, ResourcePoolItem, TeamMember } from '../types';

interface AIRecommendationProps {
    projects: Project[];
    resources: ResourcePoolItem[];
    onClose: () => void;
}

interface Recommendation {
    type: 'resource' | 'schedule' | 'priority' | 'risk';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action?: string;
    projectId?: string;
}

const AIRecommendation: React.FC<AIRecommendationProps> = ({ projects, resources, onClose }) => {
    const [selectedType, setSelectedType] = useState<'all' | 'resource' | 'schedule' | 'priority' | 'risk'>('all');

    // Generate AI recommendations based on project and resource data
    const recommendations = useMemo(() => {
        const recs: Recommendation[] = [];

        // 1. Resource Overallocation Detection
        const overallocatedMembers = new Set<string>();
        resources.forEach(resource => {
            resource.members?.forEach(member => {
                const totalLoad = member.assignments?.reduce((sum, assign) => {
                    return sum + assign.hours;
                }, 0) || 0;

                if (totalLoad > member.availability * 1.2) { // 20% over capacity
                    overallocatedMembers.add(member.name);
                    recs.push({
                        type: 'resource',
                        severity: 'high',
                        title: `资源过载: ${member.name}`,
                        description: `${member.name} 的工作负载为 ${totalLoad}小时/周，超过其可用时间 ${member.availability}小时/周的 20%。建议重新分配任务或增加资源。`,
                        action: '查看资源分配'
                    });
                }
            });
        });

        // 2. Project Priority vs Resource Allocation Mismatch
        const highPriorityProjects = projects.filter(p => p.priority === 'P0' || p.priority === 'P1');
        highPriorityProjects.forEach(project => {
            const resourceCount = project.resourceRequirements.reduce((sum, req) => sum + req.count, 0);
            if (resourceCount < 3) {
                recs.push({
                    type: 'priority',
                    severity: 'medium',
                    title: `高优先级项目资源不足: ${project.name}`,
                    description: `项目 "${project.name}" 被标记为 ${project.priority}，但仅分配了 ${resourceCount} 个资源。建议增加资源投入以确保按时交付。`,
                    action: '调整资源分配',
                    projectId: project.id
                });
            }
        });

        // 3. Schedule Optimization
        const activeProjects = projects.filter(p => p.status === 'active');
        if (activeProjects.length > 5) {
            recs.push({
                type: 'schedule',
                severity: 'medium',
                title: `并行项目过多`,
                description: `当前有 ${activeProjects.length} 个活跃项目同时进行。建议优先完成部分项目，减少上下文切换成本。`,
                action: '优化项目排期'
            });
        }

        // 4. Risk Assessment - Projects without milestones
        projects.forEach(project => {
            if (!project.milestones || project.milestones.length === 0) {
                recs.push({
                    type: 'risk',
                    severity: 'low',
                    title: `缺少里程碑: ${project.name}`,
                    description: `项目 "${project.name}" 尚未设置里程碑。建议添加关键里程碑以便更好地跟踪进度。`,
                    action: '添加里程碑',
                    projectId: project.id
                });
            }
        });

        // 5. Budget vs Actual Cost Variance
        projects.forEach(project => {
            if (project.budget && project.actualCost) {
                const variance = ((project.actualCost - project.budget) / project.budget) * 100;
                if (variance > 10) {
                    recs.push({
                        type: 'risk',
                        severity: 'high',
                        title: `预算超支: ${project.name}`,
                        description: `项目 "${project.name}" 实际成本 ¥${project.actualCost.toLocaleString()} 超出预算 ¥${project.budget.toLocaleString()} 约 ${variance.toFixed(1)}%。建议审查成本并采取控制措施。`,
                        action: '查看成本明细',
                        projectId: project.id
                    });
                }
            }
        });

        // 6. Skill Matching Recommendations
        const skillGaps: { [key: string]: number } = {};
        projects.forEach(project => {
            project.resourceRequirements.forEach(req => {
                req.requiredSkills?.forEach(skill => {
                    skillGaps[skill] = (skillGaps[skill] || 0) + 1;
                });
            });
        });

        Object.entries(skillGaps).forEach(([skill, count]) => {
            if (count > 2) {
                recs.push({
                    type: 'resource',
                    severity: 'medium',
                    title: `技能需求高: ${skill}`,
                    description: `有 ${count} 个项目需要 "${skill}" 技能。建议培训现有团队成员或招聘相关人才。`,
                    action: '查看技能匹配'
                });
            }
        });

        return recs;
    }, [projects, resources]);

    const filteredRecommendations = selectedType === 'all'
        ? recommendations
        : recommendations.filter(r => r.type === selectedType);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-700 border-red-300';
            case 'medium': return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high': return <AlertCircle size={20} />;
            case 'medium': return <TrendingUp size={20} />;
            case 'low': return <CheckCircle size={20} />;
            default: return <Brain size={20} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <Brain size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">AI 智能推荐</h2>
                                <p className="text-sm text-purple-100 mt-1">
                                    基于历史数据和当前状态的智能分析
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {[
                            { id: 'all', label: '全部', icon: Brain },
                            { id: 'resource', label: '资源', icon: Users },
                            { id: 'schedule', label: '排期', icon: TrendingUp },
                            { id: 'priority', label: '优先级', icon: AlertCircle },
                            { id: 'risk', label: '风险', icon: AlertCircle },
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedType(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedType === tab.id
                                            ? 'bg-white text-purple-600 shadow-lg'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                    {tab.id === 'all' && (
                                        <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs">
                                            {recommendations.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recommendations List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredRecommendations.length > 0 ? (
                        <div className="space-y-4">
                            {filteredRecommendations.map((rec, index) => (
                                <div
                                    key={index}
                                    className={`p-5 rounded-xl border-2 ${getSeverityColor(rec.severity)} transition-all hover:shadow-lg`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getSeverityIcon(rec.severity)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-lg">{rec.title}</h3>
                                                <span className="text-xs font-semibold px-2 py-1 rounded uppercase">
                                                    {rec.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm mb-3 leading-relaxed">
                                                {rec.description}
                                            </p>
                                            {rec.action && (
                                                <button className="text-sm font-medium hover:underline flex items-center gap-1">
                                                    {rec.action} →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">一切正常！</h3>
                            <p className="text-slate-500">
                                当前没有发现需要关注的问题。继续保持良好的项目管理！
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            <span className="font-medium">提示:</span> AI 推荐基于当前数据分析，建议结合实际情况判断。
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIRecommendation;
