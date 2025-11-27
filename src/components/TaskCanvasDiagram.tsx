import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Move, Flag, Edit3, Copy, Trash2, Link, X } from 'lucide-react';
import type { Task } from '../types';
import { format, addDays } from 'date-fns';

interface TaskCanvasDiagramProps {
    tasks: Task[];
    onTaskUpdate: (task: Task) => void;
    onTaskAdd: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
}

const TASK_WIDTH = 220;
const TASK_HEIGHT = 80;

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
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
    const [connectingTaskId, setConnectingTaskId] = useState<string | null>(null); // For creating dependencies

    // Context Menu
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);
    const [clipboardTask, setClipboardTask] = useState<Task | null>(null);

    // Edit Modal
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize positions if missing
    useEffect(() => {
        tasks.forEach((task, index) => {
            if (task.x === undefined || task.y === undefined) {
                const updatedTask = {
                    ...task,
                    x: task.x ?? 100 + (index * 250) % 1000,
                    y: task.y ?? 100 + Math.floor(index / 4) * 150
                };
                onTaskUpdate(updatedTask);
            }
        });
    }, [tasks]);

    // --- Canvas Controls ---

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, scale + delta), 3);
            setScale(newScale);
        } else {
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left
            setIsDraggingCanvas(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else if (draggingTaskId) {
            const task = tasks.find(t => t.id === draggingTaskId);
            if (task) {
                const dx = (e.clientX - lastMousePos.x) / scale;
                const dy = (e.clientY - lastMousePos.y) / scale;

                onTaskUpdate({
                    ...task,
                    x: (task.x || 0) + dx,
                    y: (task.y || 0) + dy
                });
                setLastMousePos({ x: e.clientX, y: e.clientY });
            }
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDraggingCanvas(false);
        setDraggingTaskId(null);
        setConnectingTaskId(null);
    };

    // --- Task Interaction ---

    const handleTaskMouseDown = (e: React.MouseEvent, taskId: string) => {
        if (e.button === 0 && !e.altKey && !connectingTaskId) {
            e.stopPropagation();
            setDraggingTaskId(taskId);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, taskId });
    };

    // --- Dependencies ---

    const toggleDependency = (targetId: string) => {
        if (!connectingTaskId || connectingTaskId === targetId) return;

        const targetTask = tasks.find(t => t.id === targetId);
        if (!targetTask) return;

        const currentDeps = targetTask.dependencies || [];
        const isConnected = currentDeps.includes(connectingTaskId);

        let newDeps;
        if (isConnected) {
            newDeps = currentDeps.filter(id => id !== connectingTaskId);
        } else {
            newDeps = [...currentDeps, connectingTaskId];
        }

        onTaskUpdate({ ...targetTask, dependencies: newDeps });
        setConnectingTaskId(null);
    };

    // --- CRUD Operations ---

    const handleAddTask = (type: 'task' | 'milestone') => {
        const container = containerRef.current;
        const centerX = container ? (-offset.x + container.clientWidth / 2) / scale : 0;
        const centerY = container ? (-offset.y + container.clientHeight / 2) / scale : 0;

        const newTask: Task = {
            id: Date.now().toString(),
            name: type === 'task' ? '新任务' : '新里程碑',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
            progress: 0,
            type,
            color: type === 'task' ? '#3B82F6' : '#8B5CF6',
            status: 'planning',
            priority: 'P2',
            x: centerX - TASK_WIDTH / 2,
            y: centerY - TASK_HEIGHT / 2,
            dependencies: []
        };
        onTaskAdd(newTask);
    };

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
        if (clipboardTask) {
            const pasteX = (contextMenu ? (contextMenu.x - offset.x) / scale : 0) + 20;
            const pasteY = (contextMenu ? (contextMenu.y - offset.y) / scale : 0) + 20;

            const newTask = {
                ...clipboardTask,
                id: Date.now().toString(),
                name: `${clipboardTask.name} (Copy)`,
                x: pasteX,
                y: pasteY,
                dependencies: []
            };
            onTaskAdd(newTask);
            setContextMenu(null);
        }
    };

    // --- Rendering Helpers ---

    const getConnectorPath = (start: { x: number, y: number }, end: { x: number, y: number }) => {
        const deltaX = end.x - start.x;
        const controlPointX = Math.abs(deltaX) * 0.5;
        return `M ${start.x} ${start.y} C ${start.x + controlPointX} ${start.y}, ${end.x - controlPointX} ${end.y}, ${end.x} ${end.y}`;
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-slate-50 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundSize: `${40 * scale}px ${40 * scale}px`,
                    backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                    backgroundPosition: `${offset.x}px ${offset.y}px`
                }}
            />

            {/* Canvas Content */}
            <div
                className="absolute transform-gpu origin-top-left"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
                }}
            >
                {/* Connections Layer (SVG) */}
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

                            const start = {
                                x: (source.x || 0) + TASK_WIDTH,
                                y: (source.y || 0) + TASK_HEIGHT / 2
                            };
                            const end = {
                                x: (task.x || 0),
                                y: (task.y || 0) + TASK_HEIGHT / 2
                            };

                            return (
                                <path
                                    key={`${source.id}-${task.id}`}
                                    d={getConnectorPath(start, end)}
                                    fill="none"
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        })
                    )}
                </svg>

                {/* Tasks Layer */}
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`absolute rounded-xl shadow-sm border transition-shadow group ${task.type === 'milestone' ? 'w-40 h-40 rounded-full flex items-center justify-center text-center' : ''
                            } ${hoveredTaskId === task.id ? 'z-10 ring-2 ring-blue-400 shadow-xl' : 'z-0'} ${connectingTaskId === task.id ? 'ring-2 ring-green-500' : ''
                            }`}
                        style={{
                            left: task.x || 0,
                            top: task.y || 0,
                            width: task.type === 'milestone' ? 160 : TASK_WIDTH,
                            height: task.type === 'milestone' ? 160 : TASK_HEIGHT,
                            backgroundColor: 'white',
                            borderColor: task.color || '#e2e8f0'
                        }}
                        onMouseDown={(e) => handleTaskMouseDown(e, task.id)}
                        onMouseEnter={() => setHoveredTaskId(task.id)}
                        onMouseLeave={() => setHoveredTaskId(null)}
                        onContextMenu={(e) => handleContextMenu(e, task.id)}
                        onDoubleClick={() => setEditingTask(task)}
                        onClick={() => connectingTaskId && toggleDependency(task.id)}
                    >
                        {/* Task Content */}
                        <div className="p-3 h-full flex flex-col relative overflow-hidden">
                            {/* Color Strip */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: task.color || '#3B82F6' }} />

                            <div className="pl-3 flex-1 flex flex-col justify-center">
                                <div className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight mb-1">
                                    {task.name}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span>{task.startDate}</span>
                                    {task.type !== 'milestone' && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${task.priority === 'P0' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {task.priority || 'P2'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hover Actions */}
                            <div className={`absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${hoveredTaskId === task.id ? 'animate-pulse' : ''}`}>
                                <button
                                    className="p-1.5 bg-white rounded-full shadow-md border border-slate-200 hover:bg-blue-50 text-blue-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConnectingTaskId(task.id);
                                    }}
                                    title="添加依赖连线"
                                >
                                    <Link size={14} />
                                </button>
                            </div>

                            {/* Hover Details Popup */}
                            {hoveredTaskId === task.id && !isDraggingCanvas && !draggingTaskId && (
                                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50 pointer-events-none">
                                    <div className="font-bold mb-1 text-sm">{task.name}</div>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div><span className="opacity-50">开始:</span> {task.startDate}</div>
                                        <div><span className="opacity-50">结束:</span> {task.endDate}</div>
                                        <div><span className="opacity-50">进度:</span> {task.progress}%</div>
                                        <div><span className="opacity-50">状态:</span> {task.status}</div>
                                    </div>
                                    {task.description && <div className="text-slate-300 border-t border-slate-700 pt-2 mt-1">{task.description}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Toolbar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-xl border border-slate-200 p-2 flex items-center gap-2 z-50">
                <button onClick={() => handleAddTask('task')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-medium shadow-sm">
                    <Plus size={18} /> 新建任务
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button onClick={() => handleAddTask('milestone')} className="p-2 hover:bg-slate-100 rounded-full text-purple-600" title="新建里程碑">
                    <Flag size={20} />
                </button>
                <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <Plus size={20} />
                </button>
                <span className="text-xs font-mono text-slate-400 w-12 text-center">{(scale * 100).toFixed(0)}%</span>
                <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <Minus size={20} />
                </button>
                <button onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="重置视图">
                    <Move size={20} />
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
                                        <option value="P3">P3 (低)</option>
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

            {/* Instructions Overlay */}
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur p-4 rounded-lg shadow-sm border border-slate-200 text-xs text-slate-500 pointer-events-none max-w-xs">
                <p className="font-bold text-slate-700 mb-1">操作指南</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li>左键拖动任务块移动</li>
                    <li>中键或按住 Alt 拖动画布</li>
                    <li>滚轮缩放画布</li>
                    <li>双击任务编辑详情</li>
                    <li>右键任务打开菜单</li>
                    <li>悬停任务右上角点击链接图标添加依赖</li>
                </ul>
            </div>
        </div>
    );
};

export default TaskCanvasDiagram;
