import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Move, Edit3, Copy, Trash2, Link, X, Calendar } from 'lucide-react';
import type { Task } from '../types';
import { format, addDays, differenceInDays, parseISO, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskCanvasDiagramProps {
    tasks: Task[];
    onTaskUpdate: (task: Task) => void;
    onTaskAdd: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
}

const PIXELS_PER_DAY = 60;
const MIN_TASK_WIDTH = 60;
const DEFAULT_TASK_HEIGHT = 80;
const BASE_DATE = new Date(2024, 0, 1); // Reference date for x=0

const TaskCanvasDiagram: React.FC<TaskCanvasDiagramProps> = ({
    tasks,
    onTaskUpdate,
    onTaskAdd,
    onTaskDelete
}) => {
    // Canvas State
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // Interaction State
    const [interactionMode, setInteractionMode] = useState<'none' | 'drag' | 'resize-w' | 'resize-h' | 'connect'>('none');
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
    const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

    // Context Menu & Clipboard
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);
    const [clipboardTask, setClipboardTask] = useState<Task | null>(null);

    // Edit Modal
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Helpers for Coordinate <-> Date conversion
    const dateToX = (dateStr: string) => {
        try {
            const date = parseISO(dateStr);
            return differenceInDays(date, BASE_DATE) * PIXELS_PER_DAY;
        } catch (e) {
            return 0;
        }
    };

    const xToDate = (x: number) => {
        const days = Math.round(x / PIXELS_PER_DAY);
        return format(addDays(BASE_DATE, days), 'yyyy-MM-dd');
    };

    // Initialize positions if missing (auto-layout vertically)
    useEffect(() => {
        tasks.forEach((task, index) => {
            if (task.y === undefined) {
                onTaskUpdate({
                    ...task,
                    y: 100 + (index * 100)
                });
            }
        });
    }, [tasks]);

    // --- Canvas Controls ---

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.2, scale + delta), 2);
            setScale(newScale);
        } else {
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsDraggingCanvas(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
            setContextMenu(null);
        } else if (interactionMode === 'connect') {
            setInteractionMode('none');
            setConnectingSourceId(null);
        } else {
            setContextMenu(null);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setLastMousePos({ x: e.clientX, y: e.clientY });

        if (isDraggingCanvas) {
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            return;
        }

        if (interactionMode !== 'none' && activeTaskId) {
            const task = tasks.find(t => t.id === activeTaskId);
            if (!task) return;

            const deltaX = dx / scale;
            const deltaY = dy / scale;

            if (interactionMode === 'drag') {
                const newY = (task.y || 0) + deltaY;
                const currentX = dateToX(task.startDate);
                const newX = currentX + deltaX;
                const newStartDate = xToDate(newX);

                const durationDays = differenceInDays(parseISO(task.endDate), parseISO(task.startDate));
                const newEndDate = format(addDays(parseISO(newStartDate), durationDays), 'yyyy-MM-dd');

                if (newStartDate !== task.startDate || Math.abs(deltaY) > 0) {
                    onTaskUpdate({ ...task, startDate: newStartDate, endDate: newEndDate, y: newY });
                }

            } else if (interactionMode === 'resize-w') {
                const currentEndX = dateToX(task.endDate);
                const newEndX = currentEndX + deltaX;
                const startX = dateToX(task.startDate);
                if (newEndX - startX >= MIN_TASK_WIDTH) {
                    const newEndDate = xToDate(newEndX);
                    if (newEndDate !== task.endDate) {
                        onTaskUpdate({ ...task, endDate: newEndDate });
                    }
                }

            } else if (interactionMode === 'resize-h') {
                const currentHeight = task.height || DEFAULT_TASK_HEIGHT;
                const newHeight = Math.max(40, currentHeight + deltaY);
                onTaskUpdate({ ...task, height: newHeight });
            }
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDraggingCanvas(false);
        if (interactionMode !== 'connect') {
            setInteractionMode('none');
            setActiveTaskId(null);
        }
    };

    // --- Task Interaction ---

    const handleTaskMouseDown = (e: React.MouseEvent, taskId: string, mode: 'drag' | 'resize-w' | 'resize-h') => {
        if (e.button === 0 && !e.altKey && interactionMode !== 'connect') {
            e.stopPropagation();
            setInteractionMode(mode);
            setActiveTaskId(taskId);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            setContextMenu(null);
        } else if (interactionMode === 'connect' && connectingSourceId) {
            e.stopPropagation();
            if (connectingSourceId !== taskId) {
                const targetTask = tasks.find(t => t.id === taskId);
                if (targetTask) {
                    const currentDeps = targetTask.dependencies || [];
                    if (!currentDeps.includes(connectingSourceId)) {
                        onTaskUpdate({ ...targetTask, dependencies: [...currentDeps, connectingSourceId] });
                    }
                }
            }
            setInteractionMode('none');
            setConnectingSourceId(null);
        }
    };

    const startConnection = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        setInteractionMode('connect');
        setConnectingSourceId(taskId);
        setContextMenu(null);
    };

    // --- Context Menu Actions ---
    const handleDelete = () => {
        if (contextMenu) {
            onTaskDelete(contextMenu.taskId);
            setContextMenu(null);
        }
    };

    const handleCopy = () => {
        if (contextMenu) {
            const task = tasks.find(t => t.id === contextMenu.taskId);
            if (task) setClipboardTask(task);
            setContextMenu(null);
        }
    };

    const handlePaste = () => {
        if (clipboardTask && contextMenu) {
            // Paste at context menu location mapped to date/y
            const pasteX = (contextMenu.x - offset.x) / scale;
            const pasteY = (contextMenu.y - offset.y) / scale;

            const startDate = xToDate(pasteX);
            const duration = differenceInDays(parseISO(clipboardTask.endDate), parseISO(clipboardTask.startDate));
            const endDate = format(addDays(parseISO(startDate), duration), 'yyyy-MM-dd');

            const newTask = {
                ...clipboardTask,
                id: Date.now().toString(),
                name: `${clipboardTask.name} (Copy)`,
                startDate,
                endDate,
                y: pasteY,
                dependencies: []
            };
            onTaskAdd(newTask);
            setContextMenu(null);
        }
    };

    // --- Rendering Helpers ---

    const renderRuler = () => {
        if (!containerRef.current) return null;

        const startX = -offset.x / scale;
        const endX = (-offset.x + containerRef.current.clientWidth) / scale;

        const startDate = addDays(BASE_DATE, Math.floor(startX / PIXELS_PER_DAY));
        const endDate = addDays(BASE_DATE, Math.ceil(endX / PIXELS_PER_DAY));

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div
                className="absolute top-0 left-0 h-12 bg-white border-b border-slate-200 z-30 flex items-end select-none shadow-sm"
                style={{
                    width: '100%',
                    transform: `translateY(0)`
                }}
            >
                <div
                    className="relative h-full"
                    style={{
                        transform: `translateX(${offset.x}px) scaleX(${scale})`,
                        transformOrigin: 'left bottom',
                        width: '100000px'
                    }}
                >
                    {days.map(day => {
                        const x = dateToX(format(day, 'yyyy-MM-dd'));
                        const isFirstDayOfMonth = day.getDate() === 1;
                        return (
                            <div
                                key={day.toISOString()}
                                className={`absolute bottom-0 border-l ${isFirstDayOfMonth ? 'border-slate-400 h-full' : 'border-slate-200 h-4'}`}
                                style={{ left: x, width: PIXELS_PER_DAY }}
                            >
                                <div className="pl-1 text-[10px] text-slate-500">
                                    {day.getDate()}
                                </div>
                                {isFirstDayOfMonth && (
                                    <div className="absolute top-1 left-1 text-xs font-bold text-slate-700 whitespace-nowrap">
                                        {format(day, 'yyyy年MM月', { locale: zhCN })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const getConnectorPath = (start: { x: number, y: number }, end: { x: number, y: number }) => {
        const deltaX = end.x - start.x;
        const controlPointX = Math.max(Math.abs(deltaX) * 0.5, 50);
        return `M ${start.x} ${start.y} C ${start.x + controlPointX} ${start.y}, ${end.x - controlPointX} ${end.y}, ${end.x} ${end.y}`;
    };

    // --- CRUD ---
    const handleAddTask = (type: 'task' | 'milestone') => {
        const container = containerRef.current;
        const centerX = container ? (-offset.x + container.clientWidth / 2) / scale : 0;
        const centerY = container ? (-offset.y + container.clientHeight / 2) / scale : 0;

        const startDate = xToDate(centerX);
        const endDate = xToDate(centerX + (type === 'milestone' ? 0 : 5 * PIXELS_PER_DAY));

        const newTask: Task = {
            id: Date.now().toString(),
            name: type === 'task' ? '新任务' : '新里程碑',
            startDate,
            endDate,
            progress: 0,
            type,
            color: type === 'task' ? '#3B82F6' : '#8B5CF6',
            status: 'planning',
            priority: 'P2',
            y: centerY,
            height: DEFAULT_TASK_HEIGHT,
            dependencies: []
        };
        onTaskAdd(newTask);
    };

    return (
        <div
            ref={containerRef}
            className={`w-full h-full bg-slate-50 relative overflow-hidden select-none ${interactionMode === 'drag' ? 'cursor-grabbing' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Top Ruler */}
            {renderRuler()}

            {/* Canvas Content */}
            <div
                className="absolute transform-gpu origin-top-left"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    top: 48 // Offset by ruler height
                }}
            >
                {/* Grid Lines (Vertical) */}
                <div className="absolute inset-0 pointer-events-none h-[10000px] w-[100000px]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #f1f5f9 1px, transparent 1px)`,
                        backgroundSize: `${PIXELS_PER_DAY}px 100%`,
                        left: dateToX(format(BASE_DATE, 'yyyy-MM-dd'))
                    }}
                />

                {/* Connections Layer */}
                <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: 1, height: 1 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                        </marker>
                    </defs>
                    {tasks.map(task =>
                        (task.dependencies || []).map(depId => {
                            const source = tasks.find(t => t.id === depId);
                            if (!source) return null;

                            const sourceX = dateToX(source.endDate);
                            const sourceY = (source.y || 0) + (source.height || DEFAULT_TASK_HEIGHT) / 2;
                            const targetX = dateToX(task.startDate);
                            const targetY = (task.y || 0) + (task.height || DEFAULT_TASK_HEIGHT) / 2;

                            return (
                                <path
                                    key={`${source.id}-${task.id}`}
                                    d={getConnectorPath({ x: sourceX, y: sourceY }, { x: targetX, y: targetY })}
                                    fill="none"
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        })
                    )}
                    {/* Active Connection Line */}
                    {interactionMode === 'connect' && connectingSourceId && (
                        (() => {
                            const source = tasks.find(t => t.id === connectingSourceId);
                            if (!source) return null;
                            const sourceX = dateToX(source.endDate);
                            const sourceY = (source.y || 0) + (source.height || DEFAULT_TASK_HEIGHT) / 2;
                            const targetX = (lastMousePos.x - offset.x) / scale;
                            const targetY = (lastMousePos.y - offset.y - 48) / scale; // Adjust for ruler

                            return (
                                <path
                                    d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                            );
                        })()
                    )}
                </svg>

                {/* Tasks Layer */}
                {tasks.map(task => {
                    const x = dateToX(task.startDate);
                    const width = Math.max(MIN_TASK_WIDTH, dateToX(task.endDate) - x);
                    const height = task.height || DEFAULT_TASK_HEIGHT;
                    const isConnecting = interactionMode === 'connect';
                    const isSource = connectingSourceId === task.id;

                    return (
                        <div
                            key={task.id}
                            className={`absolute rounded-lg shadow-sm border bg-white transition-shadow group
                                ${hoveredTaskId === task.id ? 'z-20 ring-2 ring-blue-400 shadow-xl' : 'z-10'}
                                ${isConnecting && !isSource ? 'cursor-crosshair hover:ring-green-500 hover:bg-green-50' : ''}
                                ${isSource ? 'ring-2 ring-blue-500' : ''}
                            `}
                            style={{
                                left: x,
                                top: task.y || 0,
                                width,
                                height,
                                borderColor: task.color || '#e2e8f0'
                            }}
                            onMouseDown={(e) => handleTaskMouseDown(e, task.id, 'drag')}
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({ x: e.clientX, y: e.clientY, taskId: task.id });
                            }}
                            onDoubleClick={() => setEditingTask(task)}
                        >
                            {/* Color Strip */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg" style={{ backgroundColor: task.color || '#3B82F6' }} />

                            {/* Content */}
                            <div className="pl-3 p-2 h-full flex flex-col overflow-hidden">
                                <div className="font-bold text-slate-800 text-sm truncate">{task.name}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <Calendar size={12} />
                                    <span>{format(parseISO(task.startDate), 'MM/dd')} - {format(parseISO(task.endDate), 'MM/dd')}</span>
                                </div>
                            </div>

                            {/* Resize Handles */}
                            {!isConnecting && (
                                <>
                                    {/* Width Resize (Right) */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => handleTaskMouseDown(e, task.id, 'resize-w')}
                                    />
                                    {/* Height Resize (Bottom) */}
                                    <div
                                        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => handleTaskMouseDown(e, task.id, 'resize-h')}
                                    />
                                    {/* Corner Resize (Both - optional, for now just visual hint) */}
                                    <div className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize opacity-0 group-hover:opacity-100">
                                        <svg viewBox="0 0 10 10" className="fill-slate-400">
                                            <path d="M 10 0 L 10 10 L 0 10 Z" />
                                        </svg>
                                    </div>
                                </>
                            )}

                            {/* Connection Point */}
                            {!isConnecting && (
                                <button
                                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow border border-slate-200 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                    onMouseDown={(e) => startConnection(e, task.id)}
                                    title="建立依赖"
                                >
                                    <Link size={12} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Floating Toolbar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-xl border border-slate-200 p-2 flex items-center gap-2 z-50">
                <button onClick={() => handleAddTask('task')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-medium shadow-sm">
                    <Plus size={18} /> 新建任务
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <Plus size={20} />
                </button>
                <span className="text-xs font-mono text-slate-400 w-12 text-center">{(scale * 100).toFixed(0)}%</span>
                <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <Minus size={20} />
                </button>
                <button onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="重置视图">
                    <Move size={20} />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button
                    onClick={() => {
                        const days = prompt('请输入要平移的天数 (负数向前，正数向后):', '0');
                        if (days && !isNaN(parseInt(days)) && parseInt(days) !== 0) {
                            const shift = parseInt(days);
                            tasks.forEach(t => {
                                const newStart = format(addDays(parseISO(t.startDate), shift), 'yyyy-MM-dd');
                                const newEnd = format(addDays(parseISO(t.endDate), shift), 'yyyy-MM-dd');
                                onTaskUpdate({ ...t, startDate: newStart, endDate: newEnd });
                            });
                        }
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-600"
                    title="批量平移"
                >
                    <Calendar size={20} />
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 w-48"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button onClick={() => { setEditingTask(tasks.find(t => t.id === contextMenu.taskId) || null); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Edit3 size={14} /> 编辑任务
                    </button>
                    <button onClick={handleCopy} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Copy size={14} /> 复制
                    </button>
                    <button onClick={handlePaste} disabled={!clipboardTask} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50">
                        <Copy size={14} /> 粘贴
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 size={14} /> 删除
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">编辑任务</h3>
                            <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
                                <input
                                    type="text"
                                    value={editingTask.name}
                                    onChange={e => setEditingTask({ ...editingTask, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                </div>
            )}
        </div>
    );
};

export default TaskCanvasDiagram;
