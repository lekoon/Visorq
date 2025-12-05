import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { Task } from '../types';
import { format, parseISO } from 'date-fns';

interface TaskBoardViewProps {
    tasks: Task[];
    onTaskUpdate: (task: Task) => void;
    onTaskClick: (task: Task) => void;
}

const TaskBoardView: React.FC<TaskBoardViewProps> = ({ tasks, onTaskUpdate, onTaskClick }) => {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const columns = [
        { id: 'planning', label: '规划中', color: 'bg-blue-50 border-blue-200' },
        { id: 'active', label: '进行中', color: 'bg-green-50 border-green-200' },
        { id: 'completed', label: '已完成', color: 'bg-purple-50 border-purple-200' },
        { id: 'on-hold', label: '暂停', color: 'bg-orange-50 border-orange-200' }
    ];

    const getTasksByStatus = (status: string) => {
        return tasks.filter(t => (t.status || 'planning') === status);
    };

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (draggedTask && draggedTask.status !== newStatus) {
            onTaskUpdate({ ...draggedTask, status: newStatus as any });
        }
        setDraggedTask(null);
    };

    return (
        <div className="h-full overflow-x-auto p-4 bg-slate-50">
            <div className="flex gap-4 min-w-max h-full">
                {columns.map(column => {
                    const columnTasks = getTasksByStatus(column.id);

                    return (
                        <div
                            key={column.id}
                            className="flex-1 min-w-[300px] flex flex-col"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            {/* 列标题 */}
                            <div className={`rounded-t-lg border-2 ${column.color} p-3 mb-2`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900">{column.label}</h3>
                                    <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-slate-600">
                                        {columnTasks.length}
                                    </span>
                                </div>
                            </div>

                            {/* 任务卡片列表 */}
                            <div className="flex-1 space-y-2 overflow-y-auto">
                                {columnTasks.map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        onClick={() => onTaskClick(task)}
                                        className={`bg-white rounded-lg border border-slate-200 p-3 cursor-move hover:shadow-md transition-all ${draggedTask?.id === task.id ? 'opacity-50' : ''
                                            }`}
                                    >
                                        {/* 拖拽手柄 */}
                                        <div className="flex items-start gap-2">
                                            <GripVertical size={16} className="text-slate-400 mt-1 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                {/* 任务标题 */}
                                                <h4 className="font-medium text-slate-900 mb-1 truncate">
                                                    {task.name}
                                                </h4>

                                                {/* 描述 */}
                                                {task.description && (
                                                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                {/* 标签 */}
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {task.priority && (
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                                                task.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                                    task.priority === 'P2' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                    {task.type && task.type !== 'task' && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            {task.type === 'milestone' ? '里程碑' : '任务组'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 日期 */}
                                                <div className="text-xs text-slate-500 mb-2">
                                                    {format(parseISO(task.startDate), 'MM/dd')} - {format(parseISO(task.endDate), 'MM/dd')}
                                                </div>

                                                {/* 进度条 */}
                                                {task.progress !== undefined && (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs text-slate-600">进度</span>
                                                            <span className="text-xs font-medium text-slate-900">{task.progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all"
                                                                style={{
                                                                    width: `${task.progress}%`,
                                                                    backgroundColor: task.color || '#3B82F6'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* 空状态 */}
                                {columnTasks.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        暂无任务
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskBoardView;
