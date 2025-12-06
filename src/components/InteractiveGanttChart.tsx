import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ZoomIn, ZoomOut, Plus, Trash2, Edit2, Undo2, Redo2, Download
} from 'lucide-react';
import {
    format, addDays, differenceInDays, startOfWeek,
    isSameDay, parseISO
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Task } from '../types';

interface InteractiveGanttChartProps {
    tasks: Task[];
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
    onTaskAdd: (task: Partial<Task>) => void;
    onDependencyAdd?: (sourceId: string, targetId: string) => void;
    onDependencyDelete?: (sourceId: string, targetId: string) => void;
}

const CELL_WIDTH = 50; // Base width of a day column
const ROW_HEIGHT = 48; // Height of a task row
const HEADER_HEIGHT = 40;

const InteractiveGanttChart: React.FC<InteractiveGanttChartProps> = ({
    tasks,
    onTaskUpdate,
    onTaskDelete,
    onTaskAdd,
    onDependencyAdd,
    onDependencyDelete
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);

    // History
    const [history, setHistory] = useState<{
        past: { oldTasks: Task[], newTasks: Task[] }[],
        future: { oldTasks: Task[], newTasks: Task[] }[]
    }>({ past: [], future: [] });

    // Interaction states
    const [draggingTask, setDraggingTask] = useState<{ id: string, type: 'move' | 'resize-l' | 'resize-r' | 'link', startX: number, startY?: number, originalStart: Date, originalEnd: Date } | null>(null);
    const [linkingState, setLinkingState] = useState<{ sourceId: string, endX: number, endY: number } | null>(null);

    // Calculate timeline range
    const { startDate, totalDays } = useMemo(() => {
        if (tasks.length === 0) {
            const start = startOfWeek(new Date());
            return { startDate: start, endDate: addDays(start, 30), totalDays: 30 };
        }

        const timestamps = tasks.flatMap(t => [new Date(t.startDate).getTime(), new Date(t.endDate).getTime()]);
        const min = new Date(Math.min(...timestamps));
        const max = new Date(Math.max(...timestamps));

        // Add buffer
        const start = addDays(startOfWeek(min), -7);
        const end = addDays(max, 14);

        return {
            startDate: start,
            endDate: end,
            totalDays: differenceInDays(end, start)
        };
    }, [tasks]);

    // Handle Zoom
    const currentCellWidth = CELL_WIDTH * zoomLevel;



    // Helper: Date to Position
    const getXFromDate = (date: Date | string) => {
        const d = typeof date === 'string' ? parseISO(date) : date;
        return differenceInDays(d, startDate) * currentCellWidth;
    };

    // Mouse Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // If clicking on background, start pan
        if ((e.target as HTMLElement).classList.contains('gantt-bg')) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - scrollPos.x, y: e.clientY - scrollPos.y });

            // Clear selection if not modified
            if (!e.shiftKey && !e.ctrlKey) {
                setSelectedTasks(new Set());
            }
            setContextMenu(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setScrollPos({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
            return;
        }

        if (linkingState) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setLinkingState({
                    ...linkingState,
                    endX: e.clientX - rect.left - scrollPos.x,
                    endY: e.clientY - rect.top - scrollPos.y
                });
            }
            return;
        }

        if (draggingTask) {
            const dx = e.clientX - draggingTask.startX;
            const task = tasks.find(t => t.id === draggingTask.id);
            if (!task) return;

            // Calculate new dates based on drag
            if (draggingTask.type === 'move') {
                const daysDelta = Math.round(dx / currentCellWidth);
                if (daysDelta !== 0) {
                    // Update visually via temp state or direct DOM manipulation if performance needed
                    // For now, we'll just wait for drop to update actual data to avoid jitter, 
                    // ideally we should have a 'preview' state
                }
            }
        }
    };

    const handleUndo = () => {
        if (history.past.length === 0) return;
        const last = history.past[history.past.length - 1];
        last.oldTasks.forEach(t => onTaskUpdate(t));
        setHistory(prev => ({
            past: prev.past.slice(0, -1),
            future: [last, ...prev.future]
        }));
    };

    const handleRedo = () => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        next.newTasks.forEach(t => onTaskUpdate(t));
        setHistory(prev => ({
            past: [...prev.past, next],
            future: prev.future.slice(1)
        }));
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setIsDragging(false);
        setLinkingState(null);
        setDraggingTask(null);

        // Handle drop logic
        if (draggingTask) {
            const dx = e.clientX - draggingTask.startX;
            const daysDelta = Math.round(dx / currentCellWidth);

            if (daysDelta !== 0) {
                const affectedTasks: { old: Task, new: Task }[] = [];

                if (draggingTask.type === 'move') {
                    // Batch move
                    selectedTasks.forEach(id => {
                        const t = tasks.find(k => k.id === id);
                        if (t) {
                            const s = addDays(parseISO(t.startDate), daysDelta);
                            // Preserve duration for milestones (start=end if 0 duration, or just shift both)
                            // If type is milestone, usually duration is 0 or 1 day. 
                            // This logic works fine for both.
                            const e = addDays(parseISO(t.endDate), daysDelta);
                            affectedTasks.push({
                                old: t,
                                new: { ...t, startDate: format(s, 'yyyy-MM-dd'), endDate: format(e, 'yyyy-MM-dd') }
                            });
                        }
                    });
                } else if (draggingTask.type === 'resize-r') {
                    const task = tasks.find(t => t.id === draggingTask.id);
                    if (task) {
                        const newEndDate = addDays(new Date(draggingTask.originalEnd), daysDelta);
                        if (differenceInDays(newEndDate, new Date(task.startDate)) >= 0) {
                            affectedTasks.push({
                                old: task,
                                new: { ...task, endDate: format(newEndDate, 'yyyy-MM-dd') }
                            });
                        }
                    }
                } else if (draggingTask.type === 'resize-l') {
                    const task = tasks.find(t => t.id === draggingTask.id);
                    if (task) {
                        const newStartDate = addDays(new Date(draggingTask.originalStart), daysDelta);
                        if (differenceInDays(new Date(task.endDate), newStartDate) >= 0) {
                            affectedTasks.push({
                                old: task,
                                new: { ...task, startDate: format(newStartDate, 'yyyy-MM-dd') }
                            });
                        }
                    }
                }

                if (affectedTasks.length > 0) {
                    // Update History
                    setHistory(prev => ({
                        past: [...prev.past, {
                            oldTasks: affectedTasks.map(x => x.old),
                            newTasks: affectedTasks.map(x => x.new)
                        }],
                        future: []
                    }));

                    // Apply Updates
                    affectedTasks.forEach(x => onTaskUpdate(x.new));
                }
            }
        }
    };

    // Task Interactions
    const handleTaskDragStart = (e: React.MouseEvent, task: Task, type: 'move' | 'resize-l' | 'resize-r') => {
        e.stopPropagation();
        e.preventDefault();

        if (type === 'move') {
            let newSelection = new Set(selectedTasks);
            if (e.shiftKey || e.ctrlKey) {
                if (!newSelection.has(task.id)) {
                    newSelection.add(task.id);
                }
            } else {
                if (!newSelection.has(task.id)) {
                    newSelection = new Set([task.id]);
                }
            }
            setSelectedTasks(newSelection);
        } else {
            setSelectedTasks(new Set([task.id]));
        }

        setDraggingTask({
            id: task.id,
            type,
            startX: e.clientX,
            originalStart: new Date(task.startDate),
            originalEnd: new Date(task.endDate)
        });
        setContextMenu(null);
    };

    const startLinking = (e: React.MouseEvent, sourceId: string) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            // Calculate start position relative to container content
            // However, mouse event gives client coordinates.
            // We need to store initial position to draw the line.
            // But simplify: just use linkingState to track end point, 
            // and we know the source task's position.
            setLinkingState({
                sourceId,
                endX: e.clientX - rect.left - scrollPos.x,
                endY: e.clientY - rect.top - scrollPos.y
            });
        }
    };

    const finishLinking = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        // e.preventDefault(); // Don't prevent default to allow click to register
        if (linkingState && linkingState.sourceId !== targetId) {
            if (onDependencyAdd) {
                onDependencyAdd(linkingState.sourceId, targetId);
            }
        }
        setLinkingState(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="h-12 bg-white border-b flex items-center px-4 justify-between z-20">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoomLevel(z => Math.max(0.25, z - 0.25))}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-sm font-medium w-12 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
                    <button
                        onClick={() => setZoomLevel(z => Math.min(2, z + 0.25))}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={history.past.length === 0}
                        className={`p-1.5 rounded ${history.past.length === 0 ? 'text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                        title="撤销 (Ctrl+Z)"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={history.future.length === 0}
                        className={`p-1.5 rounded ${history.future.length === 0 ? 'text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                        title="重做 (Ctrl+Y)"
                    >
                        <Redo2 size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button
                        onClick={() => {
                            const data = JSON.stringify(tasks, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `gantt-export-${format(new Date(), 'yyyyMMdd')}.json`;
                            a.click();
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        title="导出 JSON"
                    >
                        <Download size={18} />
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                        onClick={() => onTaskAdd({ startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(addDays(new Date(), 2), 'yyyy-MM-dd') })}
                    >
                        <Plus size={16} />
                        新增任务
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div
                className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div
                    className="absolute transition-transform duration-75 ease-out origin-top-left"
                    style={{
                        transform: `translate(${scrollPos.x}px, ${scrollPos.y}px)`
                    }}
                >
                    {/* Header: Months/Days */}
                    <div className="sticky top-0 z-10 flex border-b bg-slate-50 shadow-sm" style={{ height: HEADER_HEIGHT }}>
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const date = addDays(startDate, i);
                            const isFirstDayOfMonth = date.getDate() === 1;
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            const isToday = isSameDay(date, new Date());

                            return (
                                <div
                                    key={i}
                                    className={`flex-shrink-0 border-r flex flex-col justify-center items-center text-xs
                                        ${isWeekend ? 'bg-slate-50' : 'bg-white'}
                                        ${isToday ? 'bg-blue-50' : ''}
                                    `}
                                    style={{ width: currentCellWidth }}
                                >
                                    {isFirstDayOfMonth && (
                                        <span className="absolute top-0 left-1 font-bold text-slate-900 bg-white/80 px-1 rounded transform">
                                            {format(date, 'yyyy年MM月')}
                                        </span>
                                    )}
                                    <span className={`font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                                        {format(date, 'd')}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {format(date, 'EEE', { locale: zhCN })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid Background */}
                    <div className="absolute top-[40px] bottom-0 left-0 right-0 flex pointer-events-none z-0">
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const date = addDays(startDate, i);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            return (
                                <div
                                    key={i}
                                    className={`flex-shrink-0 border-r h-full ${isWeekend ? 'bg-slate-50/50' : ''}`}
                                    style={{ width: currentCellWidth }}
                                />
                            );
                        })}
                        {/* Current Time Line */}
                        <div
                            className="absolute top-0 bottom-0 border-l-2 border-red-500 z-0 pointer-events-none"
                            style={{ left: getXFromDate(new Date()) }}
                        >
                            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
                        </div>
                    </div>

                    {/* Tasks Layer */}
                    <div className="relative z-1 pt-4 pb-20 gantt-bg" style={{ minHeight: '100%' }}>
                        {tasks.map((task, index) => {
                            const x = getXFromDate(task.startDate);
                            const width = Math.max(currentCellWidth, differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) * currentCellWidth + currentCellWidth);
                            const top = index * ROW_HEIGHT + 20;
                            const isSelected = selectedTasks.has(task.id);

                            // Calculate drag offset if this task is being dragged
                            if (draggingTask && draggingTask.id === task.id) {
                                // This assumes we track live delta. 
                                // For smoother UI, we can use local state for immediate feedback
                            }

                            if (task.type === 'milestone') {
                                return (
                                    <motion.div
                                        key={task.id}
                                        className={`absolute group w-6 h-6 rotate-45 border shadow-sm z-10 
                                            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 bg-amber-200 border-amber-400' : 'bg-amber-300 border-amber-500 hover:shadow-md'}
                                        `}
                                        style={{
                                            left: x + currentCellWidth / 2 - 12, // Center in cell
                                            top: top + 6, // Adjust vertical
                                            cursor: 'move'
                                        }}
                                        onMouseDown={(e) => handleTaskDragStart(e, task, 'move')}
                                        onContextMenu={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setContextMenu({ x: e.clientX, y: e.clientY, taskId: task.id });
                                            if (!selectedTasks.has(task.id)) {
                                                setSelectedTasks(new Set([task.id]));
                                            }
                                        }}
                                    >
                                        {/* Link Points for Milestone */}
                                        <div
                                            className="absolute top-0 right-0 w-2 h-2 -translate-y-1/2 translate-x-1/2 bg-white border border-slate-400 rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair -rotate-45"
                                            onMouseDown={(e) => startLinking(e, task.id)}
                                            onMouseUp={(e) => finishLinking(e, task.id)}
                                        />
                                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap -rotate-45 font-medium text-slate-700 pointer-events-none">
                                            {task.name}
                                        </div>
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.div
                                    key={task.id}
                                    className={`absolute group h-8 rounded-lg shadow-sm border border-transparent 
                                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : 'hover:shadow-md z-1'}
                                        ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                                    `}
                                    style={{
                                        left: x,
                                        width: width,
                                        top: top,
                                        cursor: 'move'
                                    }}
                                    onMouseDown={(e) => handleTaskDragStart(e, task, 'move')}
                                    onContextMenu={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, taskId: task.id });
                                        if (!selectedTasks.has(task.id)) {
                                            setSelectedTasks(new Set([task.id]));
                                        }
                                    }}
                                >
                                    {/* Progress Bar */}
                                    <div
                                        className="absolute top-0 left-0 bottom-0 bg-blue-500/20 rounded-l-lg"
                                        style={{ width: `${task.progress || 0}%` }}
                                    />

                                    {/* Content */}
                                    <div className="relative px-2 h-full flex items-center justify-between text-xs overflow-hidden">
                                        <span className="font-medium truncate">{task.name}</span>
                                        {task.progress !== undefined && (
                                            <span className="opacity-70">{task.progress}%</span>
                                        )}
                                    </div>

                                    {/* Resize Handles */}
                                    <div
                                        className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-blue-500/50 rounded-l-lg z-20"
                                        onMouseDown={(e) => handleTaskDragStart(e, task, 'resize-l')}
                                    />
                                    <div
                                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500/50 rounded-r-lg z-20"
                                        onMouseDown={(e) => handleTaskDragStart(e, task, 'resize-r')}
                                    />

                                    {/* Link Points (Visible on hover) */}
                                    <div
                                        className="absolute top-1/2 -right-3 w-3 h-3 bg-white border-2 border-slate-400 rounded-full opacity-0 group-hover:opacity-100 hover:border-blue-500 hover:scale-110 transition-all cursor-crosshair shadow-sm z-30"
                                        onMouseDown={(e) => startLinking(e, task.id)}
                                        onMouseUp={(e) => finishLinking(e, task.id)}
                                    />
                                    <div
                                        className="absolute top-1/2 -left-3 w-3 h-3 bg-white border-2 border-slate-400 rounded-full opacity-0 group-hover:opacity-100 hover:border-blue-500 hover:scale-110 transition-all cursor-crosshair shadow-sm z-30"
                                        onMouseUp={(e) => finishLinking(e, task.id)}
                                    />
                                </motion.div>
                            );
                        })}

                        {/* Dependencies Lines (Using SVG) */}
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                                </marker>
                            </defs>
                            {tasks.flatMap(task =>
                                (task.dependencies || []).map(depId => {
                                    const targetTask = tasks.find(t => t.id === depId);
                                    if (!targetTask) return null;

                                    const sourceTask = task;

                                    // Calc coordinates
                                    // Assume Finish-to-Start for simplicity here
                                    const startX = getXFromDate(sourceTask.endDate) + currentCellWidth;
                                    const startY = tasks.findIndex(t => t.id === sourceTask.id) * ROW_HEIGHT + 20 + 16;

                                    const endX = getXFromDate(targetTask.startDate);
                                    const endY = tasks.findIndex(t => t.id === targetTask.id) * ROW_HEIGHT + 20 + 16;

                                    // Bezier curve path
                                    const path = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;

                                    return (
                                        <path
                                            key={`${sourceTask.id}-${targetTask.id}`}
                                            d={path}
                                            stroke="#cbd5e1"
                                            strokeWidth="2"
                                            fill="none"
                                            markerEnd="url(#arrowhead)"
                                            className="hover:stroke-blue-500 cursor-pointer"
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                if (onDependencyDelete) {
                                                    onDependencyDelete(sourceTask.id, targetTask.id);
                                                }
                                            }}
                                        />
                                    );
                                })
                            )}

                            {/* Temporary Linking Line */}
                            {linkingState && (() => {
                                const sourceTask = tasks.find(t => t.id === linkingState.sourceId);
                                if (!sourceTask) return null;
                                const startX = getXFromDate(sourceTask.endDate) + currentCellWidth;
                                const startY = tasks.findIndex(t => t.id === sourceTask.id) * ROW_HEIGHT + 20 + 16;
                                return (
                                    <line
                                        x1={startX}
                                        y1={startY}
                                        x2={linkingState.endX}
                                        y2={linkingState.endY}
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        strokeDasharray="5 5"
                                        markerEnd="url(#arrowhead)"
                                    />
                                );
                            })()}
                        </svg>
                    </div>
                </div>

                {/* Context Menu */}
                <AnimatePresence>
                    {contextMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 w-48"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                        >
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => {
                                    /* Edit logic */
                                    setContextMenu(null);
                                }}
                            >
                                <Edit2 size={14} /> 编辑任务
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={() => {
                                    onTaskDelete(contextMenu.taskId);
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 size={14} /> 删除任务
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Minimap or Status Bar could go here */}
            <div className="h-8 bg-white border-t flex items-center px-4 text-xs text-slate-500 justify-between">
                <span>按住鼠标左键拖动画布 • 滚轮缩放 • 右键菜单</span>
                <span>{tasks.length} 个任务</span>
            </div>
        </div>
    );
};

export default InteractiveGanttChart;
