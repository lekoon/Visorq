import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Project, ResourceRequirement } from '../types';
import { Plus, Trash2, Edit2, X, LayoutList, Kanban, Users, Calendar } from 'lucide-react';
import { calculateProjectScore } from '../utils/algorithm';
import { format, differenceInMonths, parseISO, startOfMonth, endOfMonth, addMonths, differenceInDays } from 'date-fns';

const Projects: React.FC = () => {
    const { projects, addProject, deleteProject, updateProject, factorDefinitions, resourcePool } = useStore();
    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Project>>({
        name: '',
        description: '',
        status: 'planning',
        startDate: '',
        endDate: '',
        factors: {},
        resourceRequirements: []
    });

    // Initialize factors for new project
    const initializeFactors = () => {
        const factors: Record<string, number> = {};
        factorDefinitions.forEach(f => factors[f.id] = 5);
        return factors;
    };

    const handleOpenModal = (project?: Project) => {
        if (project) {
            setEditingId(project.id);
            // Ensure all current definitions exist in the project factors
            const mergedFactors = { ...project.factors };
            factorDefinitions.forEach(f => {
                if (mergedFactors[f.id] === undefined) mergedFactors[f.id] = 5;
            });
            setFormData({ ...project, factors: mergedFactors });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                status: 'planning',
                startDate: '',
                endDate: '',
                factors: initializeFactors(),
                resourceRequirements: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateProject(editingId, formData);
        } else {
            addProject({
                ...formData,
                id: Math.random().toString(36).substr(2, 9),
                score: 0 // Will be calculated by store
            } as Project);
        }
        setIsModalOpen(false);
    };

    // Resource Requirement Handlers
    const addResourceReq = () => {
        setFormData(prev => ({
            ...prev,
            resourceRequirements: [
                ...(prev.resourceRequirements || []),
                { resourceId: resourcePool[0]?.id || '', count: 1, duration: 1, unit: 'month' }
            ]
        }));
    };

    const removeResourceReq = (index: number) => {
        setFormData(prev => ({
            ...prev,
            resourceRequirements: prev.resourceRequirements?.filter((_, i) => i !== index)
        }));
    };

    const updateResourceReq = (index: number, field: keyof ResourceRequirement, value: any) => {
        setFormData(prev => ({
            ...prev,
            resourceRequirements: prev.resourceRequirements?.map((req, i) =>
                i === index ? { ...req, [field]: value } : req
            )
        }));
    };

    const currentScore = formData.factors ? calculateProjectScore(formData.factors, factorDefinitions) : 0;

    // Kanban Columns
    const columns = [
        { id: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-700' },
        { id: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
        { id: 'on-hold', label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
        { id: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-700' },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
                    <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutList size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Kanban size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'gantt' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Calendar size={20} />
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} />
                    New Project
                </button>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Rank</th>
                                <th className="p-4 font-semibold text-slate-600">Project Name</th>
                                <th className="p-4 font-semibold text-slate-600">Status</th>
                                <th className="p-4 font-semibold text-slate-600">Score</th>
                                <th className="p-4 font-semibold text-slate-600">Resources</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map((project) => (
                                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center">
                                            {project.rank}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-900">{project.name}</div>
                                        <div className="text-sm text-slate-500 truncate max-w-xs">{project.description}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                            project.status === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {project.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-blue-600">
                                        {project.score.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1" title="Total Headcount Required">
                                            <Users size={14} />
                                            {project.resourceRequirements.reduce((sum, req) => sum + req.count, 0)} people
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(project)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => deleteProject(project.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : viewMode === 'kanban' ? (
                <div className="flex gap-6 overflow-x-auto pb-6">
                    {columns.map(col => (
                        <div key={col.id} className="min-w-[300px] bg-slate-100/50 rounded-2xl p-4">
                            <div className={`mb-4 px-3 py-2 rounded-lg font-bold text-sm inline-block ${col.color}`}>
                                {col.label}
                            </div>
                            <div className="space-y-4">
                                {projects.filter(p => p.status === col.id).map(project => (
                                    <div key={project.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenModal(project)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-900">{project.name}</h3>
                                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                                {project.score.toFixed(1)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span>Rank #{project.rank}</span>
                                            <div className="flex items-center gap-1" title="Total Headcount">
                                                <Users size={12} />
                                                {project.resourceRequirements.reduce((sum, req) => sum + req.count, 0)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
                    <div className="overflow-x-auto">
                        <div className="min-w-[1200px] pb-4">
                            {/* Timeline Header */}
                            <div className="flex border-b border-slate-200 pb-2 mb-4">
                                <div className="w-48 shrink-0 font-bold text-slate-500">Project</div>
                                <div className="flex-1 flex relative h-6">
                                    {(() => {
                                        const validProjects = projects.filter(p => p.startDate && p.endDate);
                                        if (validProjects.length === 0) return <div className="text-sm text-slate-400">No scheduled projects</div>;

                                        const startDates = validProjects.map(p => parseISO(p.startDate).getTime());
                                        const endDates = validProjects.map(p => parseISO(p.endDate).getTime());
                                        const minDate = startOfMonth(new Date(Math.min(...startDates)));
                                        const maxDate = endOfMonth(new Date(Math.max(...endDates)));
                                        const months = differenceInMonths(maxDate, minDate) + 1;

                                        return Array.from({ length: months }).map((_, i) => {
                                            const monthDate = addMonths(minDate, i);
                                            return (
                                                <div key={i} className="flex-1 text-xs text-slate-400 border-l border-slate-100 pl-1">
                                                    {format(monthDate, 'MMM yy')}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Project Rows */}
                            <div className="space-y-3">
                                {projects.filter(p => p.startDate && p.endDate).map(project => {
                                    const validProjects = projects.filter(p => p.startDate && p.endDate);
                                    const startDates = validProjects.map(p => parseISO(p.startDate).getTime());
                                    const endDates = validProjects.map(p => parseISO(p.endDate).getTime());
                                    const minDate = startOfMonth(new Date(Math.min(...startDates)));
                                    const maxDate = endOfMonth(new Date(Math.max(...endDates)));
                                    const totalDays = differenceInDays(maxDate, minDate) + 1;

                                    const start = parseISO(project.startDate);
                                    const end = parseISO(project.endDate);
                                    const offset = differenceInDays(start, minDate);
                                    const duration = differenceInDays(end, start);

                                    const left = (offset / totalDays) * 100;
                                    const width = (duration / totalDays) * 100;

                                    const colorClass =
                                        project.status === 'active' ? 'bg-green-500' :
                                            project.status === 'planning' ? 'bg-blue-500' :
                                                project.status === 'completed' ? 'bg-purple-500' : 'bg-orange-500';

                                    return (
                                        <div key={project.id} className="flex items-center group">
                                            <div className="w-48 shrink-0 pr-4">
                                                <div className="font-medium text-sm text-slate-900 truncate">{project.name}</div>
                                                <div className="text-xs text-slate-400">Rank #{project.rank}</div>
                                            </div>
                                            <div className="flex-1 relative h-8 bg-slate-50 rounded-lg overflow-hidden">
                                                <div
                                                    className={`absolute top-1 bottom-1 rounded-md ${colorClass} opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2`}
                                                    style={{ left: `${left}%`, width: `${width}%` }}
                                                    onClick={() => handleOpenModal(project)}
                                                    title={`${project.name}: ${project.startDate} to ${project.endDate}`}
                                                >
                                                    <span className="text-xs text-white font-bold truncate drop-shadow-md">{project.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Project' : 'New Project'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                        <select
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="planning">Planning</option>
                                            <option value="active">Active</option>
                                            <option value="on-hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Resource Requirements */}
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">Resource Requirements</h3>
                                        <button type="button" onClick={addResourceReq} className="text-sm text-blue-600 font-bold hover:underline">+ Add Requirement</button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.resourceRequirements?.map((req, index) => (
                                            <div key={index} className="flex gap-3 items-end bg-slate-50 p-3 rounded-xl">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-slate-500">Resource</label>
                                                    <select
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.resourceId}
                                                        onChange={e => updateResourceReq(index, 'resourceId', e.target.value)}
                                                    >
                                                        {resourcePool.map(r => (
                                                            <option key={r.id} value={r.id}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-slate-500">Count</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.count}
                                                        onChange={e => updateResourceReq(index, 'count', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-slate-500">Duration</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.duration}
                                                        onChange={e => updateResourceReq(index, 'duration', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-slate-500">Unit</label>
                                                    <select
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.unit}
                                                        onChange={e => updateResourceReq(index, 'unit', e.target.value)}
                                                    >
                                                        <option value="day">Days</option>
                                                        <option value="month">Months</option>
                                                        <option value="year">Years</option>
                                                    </select>
                                                </div>
                                                <button type="button" onClick={() => removeResourceReq(index)} className="p-2 text-slate-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.resourceRequirements?.length === 0 && (
                                            <p className="text-sm text-slate-400 italic">No resources allocated yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Scoring Factors */}
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">Scoring Factors</h3>
                                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm">
                                            Predicted Score: {currentScore.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {factorDefinitions.map((factor) => (
                                            <div key={factor.id}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <label className="font-medium text-slate-600">{factor.name}</label>
                                                    <span className="font-bold text-blue-600">{formData.factors?.[factor.id] || 0}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    step="1"
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    value={formData.factors?.[factor.id] || 0}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        factors: { ...prev.factors, [factor.id]: parseInt(e.target.value) }
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors"
                                    >
                                        Save Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Projects;
