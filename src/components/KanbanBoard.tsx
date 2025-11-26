import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Project } from '../types';
import { Users, Edit2, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const KanbanBoard: React.FC<{ onEditProject: (project: Project) => void }> = ({ onEditProject }) => {
    const { projects, updateProject } = useStore();
    const { t } = useTranslation();
    const [draggedProject, setDraggedProject] = useState<Project | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const columns = [
        { id: 'planning', label: t('projects.planning'), color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-400' },
        { id: 'active', label: t('projects.active'), color: 'bg-green-100 text-green-700', borderColor: 'border-green-400' },
        { id: 'on-hold', label: t('projects.onHold'), color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-400' },
        { id: 'completed', label: t('projects.completed'), color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-400' },
    ];

    const handleDragStart = (e: React.DragEvent, project: Project) => {
        setDraggedProject(project);
        e.dataTransfer.effectAllowed = 'move';
        // 添加拖拽样式
        (e.target as HTMLElement).style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).style.opacity = '1';
        setDraggedProject(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (draggedProject && draggedProject.status !== newStatus) {
            updateProject(draggedProject.id, {
                status: newStatus as Project['status']
            });

            // 显示成功提示
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
            notification.textContent = `${draggedProject.name} moved to ${newStatus}`;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.remove();
            }, 2000);
        }
        setDraggedProject(null);
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-6">
            {columns.map(col => {
                const columnProjects = projects.filter(p => p.status === col.id);
                const isDragOver = dragOverColumn === col.id;

                return (
                    <div
                        key={col.id}
                        className={`min-w-[320px] rounded-2xl p-4 transition-all duration-200 ${isDragOver
                                ? `bg-blue-50 border-2 ${col.borderColor} shadow-lg scale-105`
                                : 'bg-slate-100/50 border-2 border-transparent'
                            }`}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        {/* Column Header */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className={`px-3 py-2 rounded-lg font-bold text-sm ${col.color}`}>
                                {col.label}
                            </div>
                            <span className="text-sm text-slate-500 font-medium">
                                {columnProjects.length}
                            </span>
                        </div>

                        {/* Project Cards */}
                        <div className="space-y-3 min-h-[400px]">
                            {columnProjects.map(project => (
                                <div
                                    key={project.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, project)}
                                    onDragEnd={handleDragEnd}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-move group"
                                >
                                    {/* Drag Handle */}
                                    <div className="flex items-start gap-2 mb-2">
                                        <GripVertical
                                            size={16}
                                            className="text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-slate-900 text-sm leading-tight">
                                                    {project.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${project.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                                            project.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {project.priority || 'P2'}
                                                    </span>
                                                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                                        {project.score.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                                {project.description}
                                            </p>

                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Users size={12} />
                                                    <span>{project.resourceRequirements.reduce((sum, req) => sum + req.count, 0)}</span>
                                                </div>
                                                <span className="text-slate-400">
                                                    Rank #{project.rank}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditProject(project);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State */}
                            {columnProjects.length === 0 && (
                                <div className={`text-center py-12 rounded-xl border-2 border-dashed transition-colors ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'
                                    }`}>
                                    <p className="text-sm text-slate-400">
                                        {isDragOver ? t('projects.dropHere') : t('projects.noProjects')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KanbanBoard;
