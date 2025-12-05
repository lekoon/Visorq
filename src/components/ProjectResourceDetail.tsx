import React, { useMemo, useState } from 'react';
import { Users, TrendingUp, Calendar, AlertCircle, CheckCircle, Download, BarChart2 } from 'lucide-react';
import type { Project, ResourcePoolItem } from '../types';
import { exportResourceReportToCSV } from '../utils/exportUtils';
import EnhancedResourceTimeline from './EnhancedResourceTimeline';

interface ProjectResourceDetailProps {
    project: Project;
    resourcePool: ResourcePoolItem[];
}

const ProjectResourceDetail: React.FC<ProjectResourceDetailProps> = ({ project, resourcePool }) => {
    const [showTimeline, setShowTimeline] = useState(false);

    // 计算资源详细信息
    const resourceDetails = useMemo(() => {
        return (project.resourceRequirements || []).map(req => {
            const resource = resourcePool.find(r => r.id === req.resourceId);
            if (!resource) return null;

            // 计算工作日
            const workDays = req.unit === 'day' ? req.duration :
                req.unit === 'month' ? req.duration * 22 :
                    req.unit === 'year' ? req.duration * 260 : 0;

            // 计算成本
            const estimatedCost = resource.hourlyRate
                ? resource.hourlyRate * workDays * 8 * req.count
                : resource.costPerUnit
                    ? resource.costPerUnit * req.duration * req.count
                    : 0;

            // 计算利用率
            const totalCapacity = resource.totalQuantity;
            const utilization = (req.count / totalCapacity) * 100;

            return {
                requirement: req,
                resource,
                workDays,
                estimatedCost,
                utilization,
                isOverAllocated: req.count > totalCapacity
            };
        }).filter(Boolean);
    }, [project.resourceRequirements, resourcePool]);

    // 计算总体统计
    const summary = useMemo(() => {
        const totalCost = resourceDetails.reduce((sum, detail) => sum + (detail?.estimatedCost || 0), 0);
        const totalHeadcount = resourceDetails.reduce((sum, detail) => sum + (detail?.requirement.count || 0), 0);
        const overAllocatedCount = resourceDetails.filter(detail => detail?.isOverAllocated).length;
        const avgUtilization = resourceDetails.length > 0
            ? resourceDetails.reduce((sum, detail) => sum + (detail?.utilization || 0), 0) / resourceDetails.length
            : 0;

        return {
            totalCost,
            totalHeadcount,
            overAllocatedCount,
            avgUtilization
        };
    }, [resourceDetails]);

    return (
        <div className="h-full overflow-auto p-6 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 顶部工具栏 */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">资源详情</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowTimeline(!showTimeline)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showTimeline ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <BarChart2 size={18} />
                            {showTimeline ? '隐藏时间线' : '显示时间线'}
                        </button>
                        <button
                            onClick={() => exportResourceReportToCSV(project, resourcePool)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Download size={18} />
                            导出报表
                        </button>
                    </div>
                </div>

                {/* 时间线视图 */}
                {showTimeline && (
                    <div className="bg-white rounded-lg border border-slate-200 p-4 h-[400px]">
                        <EnhancedResourceTimeline
                            resources={resourcePool}
                            projects={[project]}
                        />
                    </div>
                )}

                {/* 概览卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={20} className="text-blue-600" />
                            <span className="text-sm text-slate-600">总人力</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{summary.totalHeadcount}</div>
                        <div className="text-xs text-slate-500 mt-1">分配人数</div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={20} className="text-green-600" />
                            <span className="text-sm text-slate-600">平均利用率</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{summary.avgUtilization.toFixed(1)}%</div>
                        <div className="text-xs text-slate-500 mt-1">资源占用率</div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar size={20} className="text-purple-600" />
                            <span className="text-sm text-slate-600">预估成本</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            ¥{(summary.totalCost / 10000).toFixed(1)}万
                        </div>
                        <div className="text-xs text-slate-500 mt-1">人力成本</div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            {summary.overAllocatedCount > 0 ? (
                                <AlertCircle size={20} className="text-red-600" />
                            ) : (
                                <CheckCircle size={20} className="text-green-600" />
                            )}
                            <span className="text-sm text-slate-600">资源状态</span>
                        </div>
                        <div className={`text-2xl font-bold ${summary.overAllocatedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {summary.overAllocatedCount > 0 ? '超额' : '正常'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {summary.overAllocatedCount > 0 ? `${summary.overAllocatedCount} 项超额` : '资源充足'}
                        </div>
                    </div>
                </div>

                {/* 资源详细列表 */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-900">资源分配详情</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">资源名称</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">分配数量</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">总容量</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">利用率</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">工期</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">工作日</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">预估成本</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">技能要求</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {resourceDetails.map((detail, index) => {
                                    if (!detail) return null;

                                    return (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Users size={16} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{detail.resource.name}</div>
                                                        {detail.resource.hourlyRate && (
                                                            <div className="text-xs text-slate-500">¥{detail.resource.hourlyRate}/小时</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-slate-900">{detail.requirement.count}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-slate-600">{detail.resource.totalQuantity}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                                        <div
                                                            className={`h-full rounded-full ${detail.utilization > 100 ? 'bg-red-500' :
                                                                detail.utilization > 80 ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                                }`}
                                                            style={{ width: `${Math.min(detail.utilization, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm font-medium ${detail.utilization > 100 ? 'text-red-600' :
                                                        detail.utilization > 80 ? 'text-yellow-600' :
                                                            'text-green-600'
                                                        }`}>
                                                        {detail.utilization.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-slate-600">
                                                    {detail.requirement.duration} {
                                                        detail.requirement.unit === 'day' ? '天' :
                                                            detail.requirement.unit === 'month' ? '月' :
                                                                detail.requirement.unit === 'year' ? '年' : ''
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-slate-600">{detail.workDays} 天</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-slate-900">
                                                    ¥{(detail.estimatedCost / 10000).toFixed(2)}万
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {detail.requirement.requiredSkills?.map((skill, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                            {skill}
                                                        </span>
                                                    )) || <span className="text-slate-400 text-xs">无要求</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {detail.isOverAllocated ? (
                                                    <span className="flex items-center gap-1 text-red-600 text-sm">
                                                        <AlertCircle size={14} />
                                                        超额
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm">
                                                        <CheckCircle size={14} />
                                                        正常
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 资源技能匹配分析 */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">技能匹配分析</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resourceDetails.map((detail, index) => {
                            if (!detail || !detail.resource.skills) return null;

                            const requiredSkills = detail.requirement.requiredSkills || [];
                            const availableSkills = detail.resource.skills.map(s => s.name);
                            const matchedSkills = requiredSkills.filter(rs => availableSkills.includes(rs));
                            const matchRate = requiredSkills.length > 0
                                ? (matchedSkills.length / requiredSkills.length) * 100
                                : 100;

                            return (
                                <div key={index} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-slate-900">{detail.resource.name}</h4>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${matchRate === 100 ? 'bg-green-100 text-green-700' :
                                            matchRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            匹配度 {matchRate.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-xs text-slate-600 mb-1">需要技能:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {requiredSkills.length > 0 ? requiredSkills.map((skill, i) => (
                                                    <span key={i} className={`px-2 py-0.5 text-xs rounded ${matchedSkills.includes(skill)
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                        }`}>
                                                        {skill}
                                                    </span>
                                                )) : <span className="text-xs text-slate-400">无特殊要求</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-600 mb-1">拥有技能:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {detail.resource.skills.map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                        {skill.name} ({skill.level})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 成本预警 */}
                {summary.totalCost > (project.budget || 0) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-red-900 mb-1">成本预警</h4>
                                <p className="text-sm text-red-700">
                                    预估人力成本 ¥{(summary.totalCost / 10000).toFixed(2)}万 超出项目预算
                                    ¥{((project.budget || 0) / 10000).toFixed(2)}万，
                                    超支 ¥{((summary.totalCost - (project.budget || 0)) / 10000).toFixed(2)}万
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectResourceDetail;
