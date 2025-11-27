import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, TrendingUp, Edit2, Check, DollarSign } from 'lucide-react';
// import { useTranslation } from 'react-i18next'; // Unused
import { format, addDays } from 'date-fns';
import CostRegistrationForm from '../components/CostRegistrationForm';
import ProfessionalGanttChart from '../components/ProfessionalGanttChart';
import RiskAssessment from '../components/RiskAssessment';
import type { CostEntry, Milestone } from '../types';

const ProjectDetailEnhanced: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, updateProject } = useStore();
    // const { t } = useTranslation(); // Unused for now

    const project = projects.find(p => p.id === projectId);

    // Initialize from project data
    const [isEditing, setIsEditing] = useState(false);
    const [milestones, setMilestones] = useState<Milestone[]>(
        project?.milestones || [
            { id: '1', name: '需求分析完成', date: '2024-01-15', completed: true },
            { id: '2', name: '设计评审', date: '2024-02-01', completed: true },
            { id: '3', name: '开发完成', date: '2024-03-15', completed: false },
            { id: '4', name: '测试完成', date: '2024-04-01', completed: false },
            { id: '5', name: '项目交付', date: '2024-04-15', completed: false },
        ]
    );

    // Cost Management State - Initialize from project data
    const [activeTab, setActiveTab] = useState<'resources' | 'costs' | 'risks'>('resources');
    const [isCostFormOpen, setIsCostFormOpen] = useState(false);
    const [projectCosts, setProjectCosts] = useState<CostEntry[]>(project?.costHistory || []);
    const [projectBudget, setProjectBudget] = useState(project?.budget || 1000000);

    if (!project) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">项目未找到</h2>
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-blue-600 hover:underline"
                    >
                        返回项目列表
                    </button>
                </div>
            </div>
        );
    }

    const completedMilestones = milestones.filter(m => m.completed).length;
    const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

    const handleSaveCosts = (costs: CostEntry[], budget?: number) => {
        setProjectCosts(costs);
        if (budget) setProjectBudget(budget);

        // Calculate total actual cost
        const totalActualCost = costs.reduce((sum, c) => sum + c.amount, 0);

        // Persist to store
        updateProject(project.id, {
            ...project,
            costHistory: costs,
            budget: budget || project.budget,
            actualCost: totalActualCost
        });
    };

    const totalCost = projectCosts.reduce((sum, c) => sum + c.amount, 0);
    const budgetUtilization = projectBudget > 0 ? (totalCost / projectBudget) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft size={20} />
                返回
            </button>

            {/* Project Header Card - Compact & Editable */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-8">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={project.name}
                                    onChange={(e) => updateProject(project.id, { ...project, name: e.target.value })}
                                    className="text-2xl font-bold text-slate-900 w-full border-b border-slate-300 focus:border-blue-500 focus:outline-none px-1"
                                />
                                <textarea
                                    value={project.description}
                                    onChange={(e) => updateProject(project.id, { ...project, description: e.target.value })}
                                    className="w-full text-slate-600 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={2}
                                />
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">{project.name}</h1>
                                <p className="text-slate-600 line-clamp-2">{project.description}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                            {isEditing ? '完成' : '编辑'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1">状态</div>
                        {isEditing ? (
                            <select
                                value={project.status}
                                onChange={(e) => updateProject(project.id, { ...project, status: e.target.value as any })}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1"
                            >
                                <option value="planning">规划中</option>
                                <option value="active">进行中</option>
                                <option value="completed">已完成</option>
                                <option value="on-hold">暂停</option>
                            </select>
                        ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {project.status}
                            </span>
                        )}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1">优先级</div>
                        {isEditing ? (
                            <select
                                value={project.priority}
                                onChange={(e) => updateProject(project.id, { ...project, priority: e.target.value as any })}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1"
                            >
                                <option value="P0">P0 (最高)</option>
                                <option value="P1">P1 (高)</option>
                                <option value="P2">P2 (中)</option>
                                <option value="P3">P3 (低)</option>
                            </select>
                        ) : (
                            <span className={`font-bold ${project.priority === 'P0' ? 'text-red-600' : 'text-slate-700'}`}>
                                {project.priority}
                            </span>
                        )}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1">起止日期</div>
                        {isEditing ? (
                            <div className="flex gap-1">
                                <input type="date" value={project.startDate} onChange={(e) => updateProject(project.id, { ...project, startDate: e.target.value })} className="w-full text-xs border rounded px-1" />
                                <input type="date" value={project.endDate} onChange={(e) => updateProject(project.id, { ...project, endDate: e.target.value })} className="w-full text-xs border rounded px-1" />
                            </div>
                        ) : (
                            <div className="font-medium text-slate-700">
                                {project.startDate} ~ {project.endDate}
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1">进度</div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-blue-600">{progress.toFixed(0)}%</span>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1">评分</div>
                        <div className="font-bold text-slate-700 flex items-center gap-1">
                            <TrendingUp size={14} className="text-blue-500" />
                            {project.score.toFixed(1)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Diagram Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col min-h-[800px]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">项目任务示意图</h2>
                        <p className="text-xs text-slate-500 mt-1">可视化管理任务进度与依赖关系</p>
                    </div>
                </div>

                {/* Professional Gantt Chart */}
                <div className="flex-1 min-h-0">
                    <ProfessionalGanttChart
                        startDate={project.startDate}
                        endDate={project.endDate}
                        tasks={project.tasks || [
                            // Default initialization if no tasks exist
                            {
                                id: 'main-project',
                                name: project.name,
                                startDate: project.startDate || format(new Date(), 'yyyy-MM-dd'),
                                endDate: project.endDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                                progress: progress,
                                type: 'task',
                                color: '#3B82F6',
                                status: project.status,
                                priority: project.priority
                            },
                            ...milestones.map(m => ({
                                id: m.id,
                                name: m.name,
                                startDate: m.date,
                                endDate: m.date,
                                progress: m.completed ? 100 : 0,
                                type: 'milestone' as const,
                                color: '#8B5CF6',
                                description: m.description
                            }))
                        ]}
                        onTaskUpdate={(updatedTask) => {
                            const currentTasks = project.tasks || [];
                            const taskIndex = currentTasks.findIndex(t => t.id === updatedTask.id);

                            let newTasks;
                            if (taskIndex >= 0) {
                                newTasks = [...currentTasks];
                                newTasks[taskIndex] = updatedTask;
                            } else {
                                // If not found (e.g. initial load from milestones), add it
                                newTasks = [...currentTasks, updatedTask];
                            }

                            // Sync back to milestones if it's a milestone
                            if (updatedTask.type === 'milestone') {
                                const updatedMilestones = milestones.map(m =>
                                    m.id === updatedTask.id
                                        ? { ...m, date: updatedTask.startDate, name: updatedTask.name, description: updatedTask.description }
                                        : m
                                );
                                setMilestones(updatedMilestones);
                                updateProject(project.id, { ...project, milestones: updatedMilestones, tasks: newTasks });
                            } else {
                                updateProject(project.id, { ...project, tasks: newTasks });
                            }
                        }}
                        onTaskAdd={(newTask) => {
                            const currentTasks = project.tasks || [];
                            const newTasks = [...currentTasks, newTask];

                            if (newTask.type === 'milestone') {
                                const newMilestone: Milestone = {
                                    id: newTask.id,
                                    name: newTask.name,
                                    date: newTask.startDate,
                                    completed: false,
                                    description: newTask.description
                                };
                                const updatedMilestones = [...milestones, newMilestone];
                                setMilestones(updatedMilestones);
                                updateProject(project.id, { ...project, milestones: updatedMilestones, tasks: newTasks });
                            } else {
                                updateProject(project.id, { ...project, tasks: newTasks });
                            }
                        }}
                        onTaskDelete={(taskId) => {
                            const currentTasks = project.tasks || [];
                            const taskToDelete = currentTasks.find(t => t.id === taskId);
                            const newTasks = currentTasks.filter(t => t.id !== taskId);

                            if (taskToDelete?.type === 'milestone') {
                                const updatedMilestones = milestones.filter(m => m.id !== taskId);
                                setMilestones(updatedMilestones);
                                updateProject(project.id, { ...project, milestones: updatedMilestones, tasks: newTasks });
                            } else {
                                updateProject(project.id, { ...project, tasks: newTasks });
                            }
                        }}
                        onTasksReorder={(newTasks) => {
                            updateProject(project.id, { ...project, tasks: newTasks });
                        }}
                    />
                </div>
            </div>

            {/* Resource & Cost Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex gap-4 border-b border-slate-200 mb-6">
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'resources' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        资源分配
                    </button>
                    <button
                        onClick={() => setActiveTab('costs')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'costs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        成本分析
                    </button>
                    <button
                        onClick={() => setActiveTab('risks')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'risks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        风险评估
                    </button>
                </div>

                {activeTab === 'resources' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.resourceRequirements.map((req, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-slate-900">资源 #{idx + 1}</h4>
                                        <p className="text-sm text-slate-500">数量: {req.count}</p>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {req.duration} {req.unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {project.resourceRequirements.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-slate-400">
                                暂无资源分配
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'costs' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <div className="text-sm text-blue-600 font-medium mb-1">总预算</div>
                                <div className="text-2xl font-bold text-slate-900">¥{projectBudget.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                <div className="text-sm text-green-600 font-medium mb-1">实际支出</div>
                                <div className="text-2xl font-bold text-slate-900">¥{totalCost.toLocaleString()}</div>
                            </div>
                            <div className={`p-6 rounded-xl border ${budgetUtilization > 100 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-sm font-medium mb-1 ${budgetUtilization > 100 ? 'text-red-600' : 'text-slate-600'}`}>预算使用率</div>
                                <div className="text-2xl font-bold text-slate-900">{budgetUtilization.toFixed(1)}%</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">成本明细</h3>
                            <button
                                onClick={() => setIsCostFormOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <DollarSign size={18} />
                                登记/管理成本
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">日期</th>
                                        <th className="p-4 font-semibold text-slate-600">类别</th>
                                        <th className="p-4 font-semibold text-slate-600">说明</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">金额</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {projectCosts.length > 0 ? (
                                        projectCosts.map((cost) => (
                                            <tr key={cost.id} className="hover:bg-slate-50">
                                                <td className="p-4 text-slate-600">{cost.date}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 capitalize">
                                                        {cost.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-900">{cost.description}</td>
                                                <td className="p-4 text-right font-medium text-slate-900">¥{cost.amount.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                                暂无成本记录
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'risks' && (
                    <RiskAssessment
                        project={project}
                        risks={project.risks || []}
                        onRisksChange={(updatedRisks) => {
                            updateProject(project.id, {
                                ...project,
                                risks: updatedRisks
                            });
                        }}
                    />
                )}
            </div>

            {/* Cost Registration Modal */}
            {isCostFormOpen && (
                <CostRegistrationForm
                    projectId={project.id}
                    projectName={project.name}
                    budget={projectBudget}
                    existingCosts={projectCosts}
                    onSave={handleSaveCosts}
                    onClose={() => setIsCostFormOpen(false)}
                />
            )}
        </div>
    );
};

export default ProjectDetailEnhanced;
