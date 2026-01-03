import React, { useState, useMemo } from 'react';
import {
    Play,
    RotateCcw,
    TrendingUp,
    PlusCircle,
    Trash2,
    Calendar,
    Users,
    BarChart2,
    CircleAlert,
    CheckCircle2,
    ArrowRight,
    Info
} from 'lucide-react';
import { usePMOStore } from '../store/usePMOStore';
import { useStore } from '../store/useStore';
import { Card, Button, Badge } from '../components/ui';

interface SimulationItem {
    id: string;
    type: 'add_project' | 'delay_project' | 'resource_cut' | 'priority_shift';
    targetId?: string;
    targetName?: string;
    value: string | number;
    details?: string;
}

interface ProjectImpact {
    projectId: string;
    projectName: string;
    impactType: 'none' | 'delay' | 'resource' | 'critical';
    delayDays: number;
    resourceConflict: boolean;
    riskTrend: 'stable' | 'increasing' | 'decreasing';
    newEndDate: string;
}

interface ResourceImpact {
    resourceType: string;
    originalUtilization: number;
    newUtilization: number;
    isOverloaded: boolean;
}

const WhatIfSimulation: React.FC = () => {
    const { createSimulation, getActiveSimulation } = usePMOStore();
    const { projects, resourcePool } = useStore();

    const [simulationName, setSimulationName] = useState('');
    const [selectedScenario, setSelectedScenario] = useState<'resource_change' | 'priority_change' | 'new_project' | 'delay_simulation'>('delay_simulation');
    const [isRunning, setIsRunning] = useState(false);

    // 影响事项列表
    const [impactItems, setImpactItems] = useState<SimulationItem[]>([
        { id: '1', type: 'delay_project', value: 14, targetId: projects[0]?.id, targetName: projects[0]?.name }
    ]);

    const activeSimulation = getActiveSimulation();

    // 模拟数据生成：计算对所有项目的影响
    const generateProjectImpacts = (items: SimulationItem[]): ProjectImpact[] => {
        return projects.map(p => {
            // 简单的 mock 逻辑：如果有延期项目，其依赖或后续项目可能受影响
            const isTarget = items.some(item => item.targetId === p.id);
            const randomEffect = Math.random();

            let impactType: ProjectImpact['impactType'] = 'none';
            let delayDays = 0;
            let resourceConflict = false;

            if (isTarget) {
                const targetItem = items.find(item => item.targetId === p.id);
                impactType = 'delay';
                delayDays = Number(targetItem?.value || 0);
            } else if (randomEffect > 0.7) {
                impactType = randomEffect > 0.9 ? 'critical' : 'resource';
                delayDays = Math.floor(randomEffect * 10);
                resourceConflict = randomEffect > 0.85;
            }

            const currentEndDate = new Date(p.endDate);
            currentEndDate.setDate(currentEndDate.getDate() + delayDays);

            return {
                projectId: p.id,
                projectName: p.name,
                impactType,
                delayDays,
                resourceConflict,
                riskTrend: delayDays > 5 ? 'increasing' : 'stable',
                newEndDate: currentEndDate.toISOString().split('T')[0]
            };
        });
    };

    // 模拟数据生成：资源影响
    const generateResourceImpacts = (items: SimulationItem[]): ResourceImpact[] => {
        return resourcePool.map(res => {
            const addedLoad = items.some(i => i.type === 'add_project') ? 15 : 0;
            const cutLoad = items.filter(i => i.type === 'resource_cut').reduce((acc, current) => acc + Number(current.value), 0);

            const originalLoad = 60 + Math.random() * 20;
            const newLoad = Math.min(100, originalLoad + addedLoad + cutLoad);

            return {
                resourceType: res.name,
                originalUtilization: Math.round(originalLoad),
                newUtilization: Math.round(newLoad),
                isOverloaded: newLoad > 90
            };
        });
    };

    const calculateImpact = () => {
        if (!simulationName.trim()) return;
        setIsRunning(true);

        setTimeout(() => {
            const projectImpacts = generateProjectImpacts(impactItems);

            const totalDelay = Math.max(...projectImpacts.map(i => i.delayDays));
            const totalConflicts = projectImpacts.filter(i => i.resourceConflict).length;
            const budgetImpact = impactItems.length * 50000 + (totalDelay * 2000);

            createSimulation({
                name: simulationName,
                description: `包含 ${impactItems.length} 项变更事项`,
                scenarioType: selectedScenario,
                changes: impactItems.map(i => ({
                    changeType: i.type as any,
                    targetEntityId: i.targetId || '',
                    targetEntityName: i.targetName || 'New Entity',
                    changeDetails: { value: i.value }
                })),
                impactAnalysis: {
                    affectedProjects: projectImpacts.filter(i => i.impactType !== 'none').map(i => i.projectId),
                    totalDelayDays: totalDelay,
                    resourceConflicts: totalConflicts,
                    budgetImpact,
                },
                createdBy: 'current-user',
                createdByName: '管理员',
                isActive: true,
            });

            // 将详细的影响分析结果存储在本地（或扩展状态）
            // 这里为了演示，我们直接在渲染时根据当前激活的模拟渲染
            setIsRunning(false);
        }, 1500);
    };

    const addImpactItem = () => {
        const newItem: SimulationItem = {
            id: Date.now().toString(),
            type: 'delay_project',
            value: 0,
            targetId: projects[0]?.id,
            targetName: projects[0]?.name
        };
        setImpactItems([...impactItems, newItem]);
    };

    const removeImpactItem = (id: string) => {
        setImpactItems(impactItems.filter(i => i.id !== id));
    };

    const updateImpactItem = (id: string, updates: Partial<SimulationItem>) => {
        setImpactItems(impactItems.map(i => {
            if (i.id === id) {
                const updated = { ...i, ...updates };
                if (updates.targetId) {
                    updated.targetName = projects.find(p => p.id === updates.targetId)?.name;
                }
                return updated;
            }
            return i;
        }));
    };

    // 获取当前结果的详细报告（派生数据）
    const detailedReport = useMemo(() => {
        if (!activeSimulation) return null;
        return {
            projects: generateProjectImpacts(impactItems), // 在真实环境应从后端/Store获取
            resources: generateResourceImpacts(impactItems)
        };
    }, [activeSimulation, impactItems]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                            What-If 沙盘推演中心
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <Info size={16} /> 模拟复杂环境下的多重决策，量化全局影响与资源瓶颈
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => { setSimulationName(''); setImpactItems([]); }}
                            variant="secondary"
                            className="bg-white dark:bg-slate-800 border-slate-200"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> 重置画布
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* 左侧：输入配置 */}
                    <div className="xl:col-span-12 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* 基础信息 */}
                            <Card className="lg:col-span-4 p-6 shadow-sm border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                    1. 模拟基础设定
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                            方案名称
                                        </label>
                                        <input
                                            type="text"
                                            value={simulationName}
                                            onChange={(e) => setSimulationName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                            placeholder="如：双11促销期间资源抽调分析"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                            核心模拟方向
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'new_project', label: '新项准入', icon: <PlusCircle size={18} /> },
                                                { value: 'delay_simulation', label: '项目波动', icon: <Calendar size={18} /> },
                                                { value: 'resource_change', label: '资源调整', icon: <Users size={18} /> },
                                                { value: 'priority_change', label: '优先级洗牌', icon: <TrendingUp size={18} /> },
                                            ].map((scenario) => (
                                                <button
                                                    key={scenario.value}
                                                    onClick={() => setSelectedScenario(scenario.value as any)}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selectedScenario === scenario.value
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className="mb-2 opacity-80">{scenario.icon}</div>
                                                    <div className="text-xs font-bold leading-none text-center">
                                                        {scenario.label}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <Button
                                            onClick={calculateImpact}
                                            disabled={isRunning || !simulationName || impactItems.length === 0}
                                            className="w-full py-6 rounded-xl shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 group"
                                        >
                                            {isRunning ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>正在进行全局拓扑计算...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Play className="group-hover:translate-x-1 transition-transform" size={20} />
                                                    <span className="text-lg font-bold">开始运行模拟</span>
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* 变更细节输入 */}
                            <Card className="lg:col-span-8 p-6 shadow-sm border-slate-200 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <div className="w-1 h-5 bg-purple-600 rounded-full" />
                                        2. 变更影响事项录入
                                    </h3>
                                    <Button onClick={addImpactItem} variant="secondary" size="sm" className="rounded-full gap-2">
                                        <PlusCircle size={14} /> 添加事项
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">事项类型</th>
                                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">影响对象</th>
                                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">参数值</th>
                                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {impactItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={item.type}
                                                            onChange={(e) => updateImpactItem(item.id, { type: e.target.value as any })}
                                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="delay_project">项目延期 (天)</option>
                                                            <option value="add_project">新项准入需求</option>
                                                            <option value="resource_cut">资源削减 (%)</option>
                                                            <option value="priority_shift">优先级异动</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={item.targetId || ''}
                                                            onChange={(e) => updateImpactItem(item.id, { targetId: e.target.value })}
                                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-slate-600 dark:text-slate-400"
                                                        >
                                                            <option value="">选择项目或资源...</option>
                                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            value={item.value}
                                                            onChange={(e) => updateImpactItem(item.id, { value: e.target.value })}
                                                            className="w-20 bg-slate-100 dark:bg-slate-800/50 border-none rounded px-2 py-1 text-sm font-bold text-center"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => removeImpactItem(item.id)}
                                                            className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {impactItems.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                                        点击右上角添加模拟事项开始分析...
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>

                        {/* 模拟结果输出区 */}
                        {activeSimulation && detailedReport && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 mt-12">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: '交付延期波动', value: activeSimulation.impactAnalysis?.totalDelayDays, unit: '天', icon: <Calendar />, color: 'red' },
                                        { label: '新增资源冲突', value: activeSimulation.impactAnalysis?.resourceConflicts, unit: '个', icon: <Users />, color: 'orange' },
                                        { label: '预估预算超支', value: activeSimulation.impactAnalysis?.budgetImpact, unit: 'CNY', icon: <TrendingUp />, color: 'blue' },
                                        { label: '模拟置信度', value: '88', unit: '%', icon: <CheckCircle2 />, color: 'green' },
                                    ].map((metric, idx) => (
                                        <div key={idx} className={`p-5 rounded-2xl border bg-${metric.color}-50/30 border-${metric.color}-100 dark:border-${metric.color}-900/30`}>
                                            <div className="flex items-center gap-3 mb-3 text-slate-500 dark:text-slate-400">
                                                <span className={`text-${metric.color}-600`}>{metric.icon}</span>
                                                <span className="text-xs font-bold uppercase">{metric.label}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-3xl font-black text-${metric.color}-600`}>
                                                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">{metric.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* 资源水位变化 */}
                                    <Card className="lg:col-span-5 p-6 shadow-sm border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                                            <BarChart2 size={20} className="text-blue-600" />
                                            全局资源占用变化
                                        </h3>
                                        <div className="space-y-6">
                                            {detailedReport.resources.map((res, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between text-sm items-center">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{res.resourceType}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-400">{res.originalUtilization}% →</span>
                                                            <span className={`font-black ${res.isOverloaded ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                                                {res.newUtilization}%
                                                            </span>
                                                            {res.isOverloaded && <CircleAlert size={14} className="text-red-500 animate-pulse" />}
                                                        </div>
                                                    </div>
                                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                                                        <div
                                                            className="h-full bg-slate-300 dark:bg-slate-600 absolute transition-all duration-1000"
                                                            style={{ width: `${res.originalUtilization}%` }}
                                                        />
                                                        <div
                                                            className={`h-full absolute transition-all duration-1000 ${res.isOverloaded ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`}
                                                            style={{ width: `${res.newUtilization}%`, opacity: 0.6 }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                                分析引擎提示：当前场景下资源瓶颈主要集中在 <span className="font-bold text-red-600">后端工程师</span> 开发周期内，建议考虑优先级对齐或外部人力补充。
                                            </p>
                                        </div>
                                    </Card>

                                    {/* 项目清单影响结果 */}
                                    <Card className="lg:col-span-7 p-6 shadow-sm border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                                            <TrendingUp size={20} className="text-purple-600" />
                                            所有项目受影响清单 (Impact List)
                                        </h3>
                                        <div className="overflow-auto max-h-[500px] border border-slate-100 dark:border-slate-800 rounded-xl">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 font-bold text-slate-500">项目名称</th>
                                                        <th className="px-4 py-3 font-bold text-slate-500">模拟排期</th>
                                                        <th className="px-4 py-3 font-bold text-slate-500">差异</th>
                                                        <th className="px-4 py-3 font-bold text-slate-500 text-center">风险指标</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {detailedReport.projects.map((p, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-100">{p.projectName}</td>
                                                            <td className="px-4 py-4 text-slate-500">
                                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                                    <ArrowRight size={12} />
                                                                    {p.newEndDate}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {p.delayDays > 0 ? (
                                                                    <Badge variant="danger" size="sm">+{p.delayDays}d</Badge>
                                                                ) : (
                                                                    <Badge variant="success" size="sm">无变动</Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex justify-center gap-2">
                                                                    {p.resourceConflict && <Badge variant="warning">资源告警</Badge>}
                                                                    {p.impactType === 'critical' && <Badge variant="danger">关键路径受损</Badge>}
                                                                    {!p.resourceConflict && p.impactType !== 'critical' && <span className="text-green-500"><CheckCircle2 size={16} /></span>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatIfSimulation;
