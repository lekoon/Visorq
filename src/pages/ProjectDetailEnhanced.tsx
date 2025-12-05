import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useResourcePool } from '../store/useStore';
import { ArrowLeft, Edit2, Check, DollarSign, Layout, Users, AlertTriangle, BarChart3 } from 'lucide-react';
import SmartTaskView from '../components/SmartTaskView';
import ProjectResourceDetail from '../components/ProjectResourceDetail';
import RiskAssessment from '../components/RiskAssessment';
import CostRegistrationForm from '../components/CostRegistrationForm';
import ProjectHealthDashboard from '../components/ProjectHealthDashboard';
import CostControlPanel from '../components/CostControlPanel';
import type { CostEntry, Task } from '../types';

const ProjectDetailEnhanced: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, updateProject } = useStore();
    const resourcePool = useResourcePool();

    const project = projects.find(p => p.id === projectId);

    // Initialize state
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'diagram' | 'resources' | 'costs' | 'risks' | 'analytics'>('diagram');
    const [isCostFormOpen, setIsCostFormOpen] = useState(false);

    if (!project) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">项目未找到</h2>
                    <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline">返回项目列表</button>
                </div>
            </div>
        );
    }

    const projectCosts = project.costHistory || [];
    const projectBudget = project.budget || 1000000;

    // Unified Task Management
    const handleTaskUpdate = (updatedTask: Task) => {
        const currentTasks = project.tasks || [];
        const taskIndex = currentTasks.findIndex(t => t.id === updatedTask.id);

        let newTasks;
        if (taskIndex >= 0) {
            newTasks = [...currentTasks];
            newTasks[taskIndex] = updatedTask;
        } else {
            newTasks = [...currentTasks, updatedTask];
        }
        updateProject(project.id, { ...project, tasks: newTasks });
    };

    const handleTaskAdd = (newTask: Task) => {
        const currentTasks = project.tasks || [];
        const newTasks = [...currentTasks, newTask];
        updateProject(project.id, { ...project, tasks: newTasks });
    };

    const handleTaskDelete = (taskId: string) => {
        const currentTasks = project.tasks || [];
        const newTasks = currentTasks.filter(t => t.id !== taskId);
        updateProject(project.id, { ...project, tasks: newTasks });
    };

    const handleSaveCosts = (costs: CostEntry[], budget?: number) => {
        const totalActualCost = costs.reduce((sum, c) => sum + c.amount, 0);
        updateProject(project.id, {
            ...project,
            costHistory: costs,
            budget: budget || project.budget,
            actualCost: totalActualCost
        });
        setIsCostFormOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Top Navigation Bar - Compact */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/projects')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* Inline Project Info Editing */}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={project.name}
                                onChange={(e) => updateProject(project.id, { ...project, name: e.target.value })}
                                className="font-bold text-lg border-b border-blue-500 focus:outline-none px-1"
                            />
                            <select
                                value={project.status}
                                onChange={(e) => updateProject(project.id, { ...project, status: e.target.value as any })}
                                className="text-sm bg-slate-50 border rounded px-2 py-1"
                            >
                                <option value="planning">规划中</option>
                                <option value="active">进行中</option>
                                <option value="completed">已完成</option>
                                <option value="on-hold">暂停</option>
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <h1 className="font-bold text-lg text-slate-800">{project.name}</h1>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                    </button>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('diagram')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'diagram' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Layout size={16} /> 任务视图
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'resources' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users size={16} /> 资源
                    </button>
                    <button
                        onClick={() => setActiveTab('risks')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'risks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <AlertTriangle size={16} /> 风险
                    </button>
                    <button
                        onClick={() => setActiveTab('costs')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'costs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <DollarSign size={16} /> 成本
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BarChart3 size={16} /> 高级分析
                    </button>
                </div>
            </div>

            {/* Main Content Area - Full Screen */}
            <div className="flex-1 relative overflow-hidden bg-slate-50">
                {activeTab === 'diagram' && (
                    <SmartTaskView
                        tasks={project.tasks || []}
                        projectName={project.name}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskAdd={handleTaskAdd}
                        onTaskDelete={handleTaskDelete}
                    />
                )}

                {activeTab === 'risks' && (
                    <div className="h-full overflow-auto p-6 max-w-7xl mx-auto">
                        <RiskAssessment
                            project={project}
                            risks={project.risks || []}
                            onRisksChange={(updatedRisks) => updateProject(project.id, { ...project, risks: updatedRisks })}
                        />
                    </div>
                )}

                {activeTab === 'costs' && (
                    <div className="h-full overflow-auto p-6 max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">成本概览</h3>
                                <p className="text-sm text-slate-500">预算: ${projectBudget.toLocaleString()} | 实际: ${projectCosts.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setIsCostFormOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <DollarSign size={18} />
                                登记成本
                            </button>
                        </div>

                        {/* Cost List */}
                        <div className="space-y-3">
                            {projectCosts.map(cost => (
                                <div key={cost.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{cost.description}</div>
                                            <div className="text-xs text-slate-500">{cost.date} · {cost.category}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-900">
                                        ${cost.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {projectCosts.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    暂无成本记录
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 高级分析视图 */}
                {activeTab === 'analytics' && (
                    <div className="h-full overflow-auto p-6 max-w-7xl mx-auto space-y-6">
                        {/* 项目健康度仪表板 */}
                        <ProjectHealthDashboard
                            project={project}
                            tasks={project.tasks || []}
                            allProjects={projects}
                        />

                        {/* 成本控制面板 */}
                        <CostControlPanel
                            project={project}
                            tasks={project.tasks || []}
                        />
                    </div>
                )}

                {/* 资源详情视图 */}
                {activeTab === 'resources' && (
                    <ProjectResourceDetail
                        project={project}
                        resourcePool={resourcePool}
                    />
                )}
            </div>

            {/* Cost Registration Modal */}
            {isCostFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">登记项目成本</h3>
                                <button onClick={() => setIsCostFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <ArrowLeft size={24} className="rotate-180" />
                                </button>
                            </div>
                            <CostRegistrationForm
                                projectId={project.id}
                                projectName={project.name}
                                budget={projectBudget}
                                existingCosts={projectCosts}
                                onSave={handleSaveCosts}
                                onClose={() => setIsCostFormOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailEnhanced;
