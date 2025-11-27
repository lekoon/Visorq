import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameMonth, parseISO, isValid } from 'date-fns';
import { ZoomIn, ZoomOut, Plus, MoreHorizontal, Copy, Trash2, Edit3, Flag } from 'lucide-react';
import type { Task } from '../types';

interface ProfessionalGanttChartProps {
    tasks: Task[];
    onTaskUpdate: (updatedTask: Task) => void;
    onTasksReorder?: (newTasks: Task[]) => void; // New: for vertical reordering
    onTaskAdd?: (newTask: Task) => void; // New
    onTaskDelete?: (taskId: string) => void; // New
    startDate?: string;
    endDate?: string;
}

type ViewMode = 'day' | 'week' | 'month';

const ProfessionalGanttChart: React.FC<ProfessionalGanttChartProps> = ({
    tasks: initialTasks,
    onTaskUpdate,
    onTasksReorder,
    onTaskAdd,
    onTaskDelete,
    startDate: projectStartDate,
    endDate: projectEndDate
}) => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [columnWidth, setColumnWidth] = useState(40);
    const headerHeight = 60;
    const rowHeight = 48; // Increased for better visibility

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);
    const [clipboardTask, setClipboardTask] = useState<Task | null>(null);

    // Edit Modal State
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Sync internal state
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Calculate timeline range
    const { minDate, maxDate } = useMemo(() => {
        const dates = tasks.flatMap(t => [parseISO(t.startDate), parseISO(t.endDate)]).filter(isValid);
        if (projectStartDate) dates.push(parseISO(projectStartDate));
        if (projectEndDate) dates.push(parseISO(projectEndDate));

        if (dates.length === 0) {
            const now = new Date();
            return { minDate: startOfWeek(now), maxDate: endOfWeek(addDays(now, 30)), totalDays: 30 };
        }

        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));

        // Add padding
        const start = addDays(min, -7);
        const end = addDays(max, 14);

        return {
            minDate: start,
            maxDate: end
        };
    }, [tasks, projectStartDate, projectEndDate]);

    // Generate time columns
    const timeColumns = useMemo(() => {
        if (viewMode === 'day') {
            return eachDayOfInterval({ start: minDate, end: maxDate });
        } else if (viewMode === 'week') {
            return eachWeekOfInterval({ start: minDate, end: maxDate });
        } else {
            return eachMonthOfInterval({ start: minDate, end: maxDate });
        }
    }, [minDate, maxDate, viewMode]);

    // Drag and Drop State (Horizontal - Time)
    const [draggingTask, setDraggingTask] = useState<{ id: string, startX: number, originalStart: Date, originalEnd: Date } | null>(null);
    const [resizingTask, setResizingTask] = useState<{ id: string, startX: number, originalEnd: Date } | null>(null);

    // Drag and Drop State (Vertical - Reorder)
    const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

    const handleMouseDown = (e: React.MouseEvent, task: Task) => {
        if (e.button !== 0) return; // Only left click
        if (task.type === 'group') return;
        e.stopPropagation();
        setDraggingTask({
            id: task.id,
            startX: e.clientX,
            originalStart: parseISO(task.startDate),
            originalEnd: parseISO(task.endDate)
        });
    };

    const handleResizeStart = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setResizingTask({
            id: task.id,
            startX: e.clientX,
            originalEnd: parseISO(task.endDate)
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (draggingTask) {
            const diffX = e.clientX - draggingTask.startX;
            const daysDiff = Math.round(diffX / columnWidth);

            if (daysDiff !== 0) {
                const newStart = addDays(draggingTask.originalStart, daysDiff);
                const newEnd = addDays(draggingTask.originalEnd, daysDiff);

                setTasks(prev => prev.map(t =>
                    t.id === draggingTask.id
                        ? { ...t, startDate: format(newStart, 'yyyy-MM-dd'), endDate: format(newEnd, 'yyyy-MM-dd') }
                        : t
                ));
            }
        } else if (resizingTask) {
            const diffX = e.clientX - resizingTask.startX;
            const daysDiff = Math.round(diffX / columnWidth);

            if (daysDiff !== 0) {
                const newEnd = addDays(resizingTask.originalEnd, daysDiff);
                const task = tasks.find(t => t.id === resizingTask.id);
                if (task && newEnd > parseISO(task.startDate)) {
                    setTasks(prev => prev.map(t =>
                        t.id === resizingTask.id
                            ? { ...t, endDate: format(newEnd, 'yyyy-MM-dd') }
                            : t
                    ));
                }
            }
        }
    };

    const handleMouseUp = () => {
        if (draggingTask) {
            const task = tasks.find(t => t.id === draggingTask.id);
            if (task) onTaskUpdate(task);
            setDraggingTask(null);
        }
        if (resizingTask) {
            const task = tasks.find(t => t.id === resizingTask.id);
            if (task) onTaskUpdate(task);
            setResizingTask(null);
        }
    };

    useEffect(() => {
        if (draggingTask || resizingTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggingTask, resizingTask, tasks]);

    // Row Reordering Logic
    const handleRowDragStart = (e: React.DragEvent, index: number) => {
        setDraggedRowIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleRowDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedRowIndex === null || draggedRowIndex === index) return;

        // Reorder locally for visual feedback
        const newTasks = [...tasks];
        const [removed] = newTasks.splice(draggedRowIndex, 1);
        newTasks.splice(index, 0, removed);
        setTasks(newTasks);
        setDraggedRowIndex(index);
    };

    const handleRowDragEnd = () => {
        if (onTasksReorder) onTasksReorder(tasks);
        setDraggedRowIndex(null);
    };

    // Context Menu Logic
    const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, taskId });
    };

    const closeContextMenu = () => setContextMenu(null);

    // Task Operations
    const handleAddTask = (type: 'task' | 'milestone' = 'task') => {
        const newTask: Task = {
            id: Date.now().toString(),
            name: type === 'task' ? '新任务' : '新里程碑',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), type === 'task' ? 5 : 0), 'yyyy-MM-dd'),
            progress: 0,
            type,
            color: type === 'task' ? '#3B82F6' : '#8B5CF6',
            status: 'planning',
            priority: 'P2'
        };
        if (onTaskAdd) onTaskAdd(newTask);
    };

    const handleCopyTask = () => {
        if (contextMenu) {
            const task = tasks.find(t => t.id === contextMenu.taskId);
            if (task) setClipboardTask(task);
            closeContextMenu();
        }
    };

    const handlePasteTask = () => {
        if (clipboardTask && onTaskAdd) {
            const newTask = {
                ...clipboardTask,
                id: Date.now().toString(),
                name: `${clipboardTask.name} (Copy)`,
                startDate: format(addDays(parseISO(clipboardTask.startDate), 1), 'yyyy-MM-dd'),
                endDate: format(addDays(parseISO(clipboardTask.endDate), 1), 'yyyy-MM-dd'),
            };
            onTaskAdd(newTask);
        }
    };

    const handleDeleteTask = () => {
        if (contextMenu && onTaskDelete) {
            onTaskDelete(contextMenu.taskId);
            closeContextMenu();
        }
    };

    const handleEditTask = () => {
        if (contextMenu) {
            const task = tasks.find(t => t.id === contextMenu.taskId);
            if (task) setEditingTask(task);
            closeContextMenu();
        }
    };

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => closeContextMenu();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden select-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4">
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        <button onClick={() => setViewMode('day')} className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'day' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>日</button>
                        <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'week' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>周</button>
                        <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'month' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>月</button>
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setColumnWidth(prev => Math.max(20, prev - 10))} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><ZoomOut size={18} /></button>
                        <button onClick={() => setColumnWidth(prev => Math.min(100, prev + 10))} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><ZoomIn size={18} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleAddTask('milestone')} className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors">
                        <Flag size={16} /> 添加里程碑
                    </button>
                    <button onClick={() => handleAddTask('task')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <Plus size={16} /> 添加任务
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Panel: Task List */}
                <div className="w-[320px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="h-[60px] border-b border-slate-200 bg-slate-50 flex items-center px-4 font-semibold text-slate-700 shrink-0">
                        任务列表
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {tasks.map((task, index) => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleRowDragStart(e, index)}
                                onDragOver={(e) => handleRowDragOver(e, index)}
                                onDragEnd={handleRowDragEnd}
                                className="flex items-center px-4 border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-move"
                                style={{ height: rowHeight }}
                                onContextMenu={(e) => handleContextMenu(e, task.id)}
                            >
                                <div className="mr-2 text-slate-300 group-hover:text-slate-500">
                                    <MoreHorizontal size={14} />
                                </div>
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                    <div
                                        className={`w-3 h-3 rounded-full flex-shrink-0 border-2 border-white shadow-sm`}
                                        style={{ backgroundColor: task.color || '#3B82F6' }}
                                    />
                                    <span className="truncate text-sm font-medium text-slate-700">{task.name}</span>
                                </div>
                                <div className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {task.startDate}
                                </div>
                            </div>
                        ))}
                        {/* Add Task Placeholder */}
                        <div
                            className="flex items-center justify-center p-2 m-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                            onClick={() => handleAddTask('task')}
                        >
                            <Plus size={20} />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Timeline */}
                <div className="flex-1 overflow-auto bg-slate-50 relative" id="gantt-timeline">
                    <div style={{ width: timeColumns.length * columnWidth, minWidth: '100%' }}>
                        {/* Timeline Header - Sticky */}
                        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm" style={{ height: headerHeight }}>
                            <div className="flex border-b border-slate-100 h-[30px]">
                                {timeColumns.map((date, i) => {
                                    const isNewMonth = i === 0 || !isSameMonth(date, timeColumns[i - 1]);
                                    if (isNewMonth) {
                                        return (
                                            <div key={`month-${i}`} className="px-2 text-xs font-bold text-slate-600 flex items-center border-l border-slate-200 sticky left-0 bg-white/90 backdrop-blur-sm z-10">
                                                {format(date, 'yyyy年MM月')}
                                            </div>
                                        );
                                    }
                                    return <div key={i} style={{ width: columnWidth }}></div>;
                                })}
                            </div>
                            <div className="flex h-[30px]">
                                {timeColumns.map((date, i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 border-r border-slate-100 flex items-center justify-center text-[10px] text-slate-500"
                                        style={{ width: columnWidth }}
                                    >
                                        {viewMode === 'day' ? format(date, 'd') : format(date, 'w周')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grid & Tasks */}
                        <div className="relative">
                            {/* Vertical Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none h-full">
                                {timeColumns.map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 border-r border-slate-200/50 h-full"
                                        style={{ width: columnWidth }}
                                    />
                                ))}
                            </div>

                            {/* Task Rows */}
                            {tasks.map((task) => {
                                const startDate = parseISO(task.startDate);
                                const endDate = parseISO(task.endDate);
                                const offsetDays = differenceInDays(startDate, minDate);
                                const durationDays = differenceInDays(endDate, startDate) + 1;

                                const left = offsetDays * columnWidth;
                                const width = durationDays * columnWidth;

                                return (
                                    <div
                                        key={task.id}
                                        className="relative border-b border-slate-100/50 hover:bg-blue-50/30 transition-colors group"
                                        style={{ height: rowHeight }}
                                        onContextMenu={(e) => handleContextMenu(e, task.id)}
                                    >
                                        {/* Task Bar */}
                                        <div
                                            className={`absolute top-3 bottom-3 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-100 group-hover:animate-pulse ${task.type === 'milestone'
                                                ? 'w-6 h-6 rotate-45 top-3'
                                                : ''
                                                }`}
                                            style={{
                                                left,
                                                width: task.type === 'milestone' ? undefined : width,
                                                backgroundColor: task.color || (task.type === 'milestone' ? '#8B5CF6' : '#3B82F6'),
                                                marginLeft: task.type === 'milestone' ? -12 : 0
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, task)}
                                            onDoubleClick={() => setEditingTask(task)}
                                        >
                                            {task.type !== 'milestone' && (
                                                <>
                                                    {/* Label */}
                                                    <div className="absolute left-2 top-0 bottom-0 flex items-center whitespace-nowrap text-xs text-white font-medium pointer-events-none overflow-hidden">
                                                        {task.name}
                                                    </div>

                                                    {/* Resize Handle */}
                                                    <div
                                                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 rounded-r-md transition-colors"
                                                        onMouseDown={(e) => handleResizeStart(e, task)}
                                                    />
                                                </>
                                            )}

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                                <div className="font-bold mb-1">{task.name}</div>
                                                <div>{task.startDate} ~ {task.endDate}</div>
                                                {task.description && <div className="mt-1 text-slate-300 max-w-xs truncate">{task.description}</div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 w-48"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button onClick={handleEditTask} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Edit3 size={14} /> 编辑任务
                    </button>
                    <button onClick={handleCopyTask} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Copy size={14} /> 复制
                    </button>
                    <button onClick={handlePasteTask} disabled={!clipboardTask} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50">
                        <Copy size={14} /> 粘贴
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={handleDeleteTask} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 size={14} /> 删除
                    </button>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">编辑任务</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
                                <input
                                    type="text"
                                    value={editingTask.name}
                                    onChange={e => setEditingTask({ ...editingTask, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
                                    <input
                                        type="date"
                                        value={editingTask.startDate}
                                        onChange={e => setEditingTask({ ...editingTask, startDate: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
                                    <input
                                        type="date"
                                        value={editingTask.endDate}
                                        onChange={e => setEditingTask({ ...editingTask, endDate: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">显示颜色</label>
                                <div className="flex gap-2">
                                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEditingTask({ ...editingTask, color })}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${editingTask.color === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                <textarea
                                    value={editingTask.description || ''}
                                    onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
                                    <select
                                        value={editingTask.priority || 'P2'}
                                        onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="P0">P0 (最高)</option>
                                        <option value="P1">P1 (高)</option>
                                        <option value="P2">P2 (中)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                                    <select
                                        value={editingTask.status || 'planning'}
                                        onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="planning">规划中</option>
                                        <option value="active">进行中</option>
                                        <option value="completed">已完成</option>
                                        <option value="on-hold">暂停</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditingTask(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
                            <button
                                onClick={() => {
                                    onTaskUpdate(editingTask);
                                    setEditingTask(null);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalGanttChart;
