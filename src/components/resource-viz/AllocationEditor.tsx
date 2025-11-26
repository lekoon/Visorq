import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Copy, Save, AlertTriangle, X, Undo, Redo, GripVertical } from 'lucide-react';
import { format, addWeeks, startOfWeek } from 'date-fns';
import type { Project, ResourcePoolItem, TeamMember } from '../../types';
import { useTranslation } from 'react-i18next';

interface Assignment {
    id: string;
    memberId: string;
    memberName: string;
    projectId: string;
    hours: number;
    week: string;
}

interface AllocationEditorProps {
    projects: Project[];
    resources: ResourcePoolItem[];
    onSave?: (allocations: Assignment[]) => void;
}

const AllocationEditor: React.FC<AllocationEditorProps> = ({
    projects,
    resources,
    onSave
}) => {
    const { t } = useTranslation();
    const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [history, setHistory] = useState<Assignment[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [draggedMember, setDraggedMember] = useState<TeamMember | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    const weekKey = format(currentWeek, 'yyyy-MM-dd');

    // 计算冲突
    const conflicts = useCallback(() => {
        const memberHours = new Map<string, number>();
        assignments
            .filter(a => a.week === weekKey)
            .forEach(a => {
                const current = memberHours.get(a.memberId) || 0;
                memberHours.set(a.memberId, current + a.hours);
            });

        const overloaded: string[] = [];
        resources.forEach(resource => {
            resource.members?.forEach(member => {
                const hours = memberHours.get(member.id) || 0;
                if (hours > member.availability) {
                    overloaded.push(member.name);
                }
            });
        });

        return overloaded;
    }, [assignments, weekKey, resources]);

    const hasConflicts = conflicts().length > 0;

    const handlePrevWeek = () => {
        setCurrentWeek(prev => addWeeks(prev, -1));
    };

    const handleNextWeek = () => {
        setCurrentWeek(prev => addWeeks(prev, 1));
    };

    const addToHistory = (newAssignments: Assignment[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAssignments);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setAssignments(newAssignments);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setAssignments(history[historyIndex - 1]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setAssignments(history[historyIndex + 1]);
        }
    };

    const handleCopyLastWeek = () => {
        const lastWeek = format(addWeeks(currentWeek, -1), 'yyyy-MM-dd');
        const lastWeekAssignments = assignments.filter(a => a.week === lastWeek);

        const copiedAssignments = lastWeekAssignments.map(a => ({
            ...a,
            id: `assign-${Date.now()}-${Math.random()}`,
            week: weekKey
        }));

        const otherWeeks = assignments.filter(a => a.week !== weekKey);
        addToHistory([...otherWeeks, ...copiedAssignments]);
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleDragStart = (member: TeamMember) => {
        setDraggedMember(member);
    };

    const handleDragOver = (e: React.DragEvent, projectId: string) => {
        e.preventDefault();
        setDropTarget(projectId);
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = (e: React.DragEvent, projectId: string) => {
        e.preventDefault();
        setDropTarget(null);

        if (!draggedMember) return;

        // 打开输入对话框
        const hours = prompt(t('allocation.enterHours'), '8');
        if (hours && !isNaN(Number(hours))) {
            const newAssignment: Assignment = {
                id: `assign-${Date.now()}-${Math.random()}`,
                memberId: draggedMember.id,
                memberName: draggedMember.name,
                projectId,
                hours: Number(hours),
                week: weekKey
            };

            addToHistory([...assignments, newAssignment]);
        }

        setDraggedMember(null);
    };

    const removeAssignment = (assignmentId: string) => {
        addToHistory(assignments.filter(a => a.id !== assignmentId));
    };

    const getProjectAssignments = (projectId: string) => {
        return assignments.filter(a => a.projectId === projectId && a.week === weekKey);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {/* Week Selector */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevWeek}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h3 className="font-bold text-slate-900">
                            Week {format(currentWeek, 'w, yyyy')}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {format(currentWeek, 'MMM d')} - {format(addWeeks(currentWeek, 1), 'MMM d')}
                        </p>
                    </div>
                    <button
                        onClick={handleNextWeek}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={historyIndex === 0}
                        className="p-2 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title={t('allocation.undo')}
                    >
                        <Undo size={18} />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={historyIndex === history.length - 1}
                        className="p-2 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title={t('allocation.redo')}
                    >
                        <Redo size={18} />
                    </button>
                    <button
                        onClick={handleCopyLastWeek}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                        <Copy size={16} />
                        {t('allocation.copyLastWeek')}
                    </button>
                    <button
                        onClick={() => onSave?.(assignments)}
                        disabled={hasConflicts}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Save size={16} />
                        {t('common.save')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available Resources Panel */}
                <div className="lg:col-span-1">
                    <h4 className="font-bold text-slate-900 mb-4">{t('allocation.availableResources')}</h4>
                    <div className="space-y-2">
                        {resources.map(resource => (
                            <div key={resource.id} className="border border-slate-200 rounded-lg p-3">
                                <div className="font-medium text-slate-900 mb-2">{resource.name}</div>
                                {resource.members?.map(member => {
                                    const memberAssignments = assignments.filter(
                                        a => a.memberId === member.id && a.week === weekKey
                                    );
                                    const totalHours = memberAssignments.reduce((sum, a) => sum + a.hours, 0);
                                    const isOverloaded = totalHours > member.availability;

                                    return (
                                        <div
                                            key={member.id}
                                            draggable
                                            onDragStart={() => handleDragStart(member)}
                                            className={`flex items-center justify-between p-2 rounded cursor-move mb-1 transition-colors ${isOverloaded
                                                    ? 'bg-red-50 hover:bg-red-100 border border-red-200'
                                                    : 'bg-slate-50 hover:bg-blue-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <GripVertical size={14} className="text-slate-400" />
                                                <span className="text-sm text-slate-700">{member.name}</span>
                                            </div>
                                            <span className={`text-xs ${isOverloaded ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                                {totalHours}/{member.availability}h
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Project Allocation List */}
                <div className="lg:col-span-2">
                    <h4 className="font-bold text-slate-900 mb-4">{t('allocation.projectAllocations')}</h4>
                    <div className="space-y-3">
                        {projects.filter(p => p.status === 'active' || p.status === 'planning').map(project => {
                            const projectAssignments = getProjectAssignments(project.id);
                            const totalHours = projectAssignments.reduce((sum, a) => sum + a.hours, 0);

                            return (
                                <div
                                    key={project.id}
                                    className={`border rounded-lg transition-all ${dropTarget === project.id
                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                            : 'border-slate-200'
                                        }`}
                                    onDragOver={(e) => handleDragOver(e, project.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, project.id)}
                                >
                                    <button
                                        onClick={() => toggleProject(project.id)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${project.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                                    project.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {project.priority || 'P2'}
                                            </span>
                                            <span className="font-medium text-slate-900">{project.name}</span>
                                            {totalHours > 0 && (
                                                <span className="text-xs text-slate-500">({totalHours}h)</span>
                                            )}
                                        </div>
                                        <ChevronRight
                                            className={`transition-transform ${expandedProjects.includes(project.id) ? 'rotate-90' : ''}`}
                                            size={20}
                                        />
                                    </button>

                                    {expandedProjects.includes(project.id) && (
                                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                                            <div className="text-sm text-slate-600 mb-3">
                                                {t('allocation.assignedMembers')}: {projectAssignments.length}
                                            </div>

                                            {projectAssignments.length > 0 ? (
                                                <div className="space-y-2 mb-3">
                                                    {projectAssignments.map(assignment => (
                                                        <div
                                                            key={assignment.id}
                                                            className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                                                        >
                                                            <span className="text-sm text-slate-700">{assignment.memberName}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-slate-900">{assignment.hours}h</span>
                                                                <button
                                                                    onClick={() => removeAssignment(assignment.id)}
                                                                    className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400 mb-3 text-center py-4 border-2 border-dashed border-slate-200 rounded">
                                                    {t('allocation.dragMemberHere')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Conflict Warning */}
            {hasConflicts && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                    <div>
                        <h5 className="font-bold text-red-900 mb-1">{t('allocation.conflictsDetected')}</h5>
                        <p className="text-sm text-red-700">
                            {t('allocation.overloadedMembers')}: {conflicts().join(', ')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllocationEditor;
