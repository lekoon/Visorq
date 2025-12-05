import React, { useState, useMemo } from 'react';
import { Calendar, List, LayoutGrid, Zap, ChevronDown, ChevronRight, Plus, CheckCircle2, Circle, Clock, Download, Printer, Network } from 'lucide-react';
import type { Task } from '../types';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import TaskEditModal from './TaskEditModal';
import TaskBoardView from './TaskBoardView';
import TaskNetworkDiagram from './TaskNetworkDiagram';
import { exportTasksToCSV, exportGanttToJSON, printGanttChart } from '../utils/exportUtils';

interface SmartTaskViewProps {
    tasks: Task[];
    projectName?: string;
    onTaskUpdate: (task: Task) => void;
    onTaskAdd: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
}

type ViewMode = 'gantt' | 'list' | 'board' | 'network';
type GroupBy = 'none' | 'status' | 'priority' | 'type';

const SmartTaskView: React.FC<SmartTaskViewProps> = ({
    tasks,
    projectName = 'Project',
    onTaskUpdate,
    onTaskAdd,
    onTaskDelete
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('gantt');
    const [groupBy, setGroupBy] = useState<GroupBy>('status');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['active', 'planning']));
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // 智能分组
    const groupedTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {};

        tasks.forEach(task => {
            let key = 'ungrouped';

            switch (groupBy) {
                case 'status':
                    key = task.status || 'planning';
                    break;
                case 'priority':
                    key = task.priority || 'P2';
                    break;
                case 'type':
                    key = task.type || 'task';
                    break;
                default:
                    key = 'all';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        // 排序每个组内的任务
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                const dateA = parseISO(a.startDate);
                const dateB = parseISO(b.startDate);
                return dateA.getTime() - dateB.getTime();
            });
        });

        return groups;
    }, [tasks, groupBy]);

    // 计算甘特图时间范围
    const timeRange = useMemo(() => {
        if (tasks.length === 0) {
            const today = new Date();
            return {
                start: today,
                end: addDays(today, 30),
                days: 30
            };
        }

        const dates = tasks.flatMap(t => [parseISO(t.startDate), parseISO(t.endDate)]);
        const start = new Date(Math.min(...dates.map(d => d.getTime())));
        const end = new Date(Math.max(...dates.map(d => d.getTime())));
        const days = differenceInDays(end, start) + 1;

        return { start, end, days };
    }, [tasks]);

    // 切换组展开/折叠
    const toggleGroup = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
    };

    // 获取组标签
    const getGroupLabel = (key: string): { label: string; color: string; icon: any } => {
        if (groupBy === 'status') {
            const statusMap: Record<string, any> = {
                planning: { label: '规划中', color: 'bg-blue-100 text-blue-700', icon: Circle },
                active: { label: '进行中', color: 'bg-green-100 text-green-700', icon: Clock },
                completed: { label: '已完成', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
                'on-hold': { label: '暂停', color: 'bg-orange-100 text-orange-700', icon: Circle }
            };
            return statusMap[key] || { label: key, color: 'bg-slate-100 text-slate-700', icon: Circle };
        } else if (groupBy === 'priority') {
            const priorityMap: Record<string, any> = {
                P0: { label: '紧急', color: 'bg-red-100 text-red-700', icon: Zap },
                P1: { label: '高', color: 'bg-orange-100 text-orange-700', icon: Zap },
                P2: { label: '中', color: 'bg-yellow-100 text-yellow-700', icon: Zap },
                P3: { label: '低', color: 'bg-slate-100 text-slate-700', icon: Zap }
            };
            return priorityMap[key] || { label: key, color: 'bg-slate-100 text-slate-700', icon: Zap };
        } else if (groupBy === 'type') {
            const typeMap: Record<string, any> = {
                task: { label: '任务', color: 'bg-blue-100 text-blue-700', icon: List },
                milestone: { label: '里程碑', color: 'bg-purple-100 text-purple-700', icon: Zap },
                group: { label: '任务组', color: 'bg-green-100 text-green-700', icon: LayoutGrid }
            };
            return typeMap[key] || { label: key, color: 'bg-slate-100 text-slate-700', icon: List };
        }
        return { label: '全部任务', color: 'bg-slate-100 text-slate-700', icon: List };
    };

    // 拖拽处理
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetTask: Task) => {
        e.preventDefault();
        if (!draggedTask || draggedTask.id === targetTask.id) return;

        // 重新排序逻辑：这里简单地交换位置，实际可能需要更复杂的逻辑
        // 注意：这里的实现依赖于外部状态更新，可能需要更完善的排序支持
        const allTasks = [...tasks];
        const draggedIndex = allTasks.findIndex(t => t.id === draggedTask.id);
        const targetIndex = allTasks.findIndex(t => t.id === targetTask.id);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            // 交换 y 坐标以模拟排序
            const draggedY = draggedTask.y || 0;
            const targetY = targetTask.y || 0;

            onTaskUpdate({ ...draggedTask, y: targetY });
            onTaskUpdate({ ...targetTask, y: draggedY });
        }

        setDraggedTask(null);
    };

    // 渲染甘特图视图
    const renderGanttView = () => {
        const dayWidth = 40;
        const rowHeight = 44;

        return (
            <div className="overflow-auto h-full">
                <div className="min-w-max">
                    {/* 时间轴标题 */}
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 flex">
                        <div className="w-64 shrink-0 p-3 font-semibold text-slate-700 border-r border-slate-200">
                            任务名称
                        </div>
                        <div className="flex">
                            {Array.from({ length: timeRange.days }, (_, i) => {
                                const date = addDays(timeRange.start, i);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                return (
                                    <div
                                        key={i}
                                        className={`shrink-0 p-2 text-xs text-center border-r border-slate-100 ${isWeekend ? 'bg-slate-50' : ''
                                            }`}
                                        style={{ width: dayWidth }}
                                    >
                                        <div className="font-medium">{format(date, 'MM/dd', { locale: zhCN })}</div>
                                        <div className="text-slate-400">{format(date, 'EEE', { locale: zhCN })}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 任务行 */}
                    {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => {
                        const groupInfo = getGroupLabel(groupKey);
                        const isExpanded = expandedGroups.has(groupKey);
                        const Icon = groupInfo.icon;

                        return (
                            <div key={groupKey}>
                                {/* 组标题 */}
                                {groupBy !== 'none' && (
                                    <div
                                        className="flex items-center gap-2 p-2 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                                        onClick={() => toggleGroup(groupKey)}
                                    >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        <Icon size={16} />
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${groupInfo.color}`}>
                                            {groupInfo.label}
                                        </span>
                                        <span className="text-xs text-slate-500">({groupTasks.length})</span>
                                    </div>
                                )}

                                {/* 任务列表 */}
                                {(isExpanded || groupBy === 'none') && groupTasks.map(task => {
                                    const startDate = parseISO(task.startDate);
                                    const endDate = parseISO(task.endDate);
                                    const startOffset = differenceInDays(startDate, timeRange.start);
                                    const duration = differenceInDays(endDate, startDate) + 1;
                                    const left = startOffset * dayWidth;
                                    const width = duration * dayWidth;

                                    return (
                                        <div key={task.id} className="flex border-b border-slate-100 hover:bg-slate-50">
                                            <div className="w-64 shrink-0 p-3 border-r border-slate-200 flex items-center justify-between group">
                                                <div className="font-medium text-sm text-slate-900 truncate flex-1 cursor-pointer hover:text-blue-600" onClick={() => setEditingTask(task)}>
                                                    {task.name}
                                                </div>
                                                <div className="text-xs text-slate-500 hidden group-hover:block">
                                                    {format(startDate, 'MM/dd')}
                                                </div>
                                            </div>
                                            <div className="relative flex-1" style={{ height: rowHeight }}>
                                                <div
                                                    className="absolute top-2 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                                    style={{
                                                        left: `${left}px`,
                                                        width: `${width}px`,
                                                        height: '28px',
                                                        backgroundColor: task.color || '#3B82F6'
                                                    }}
                                                    onClick={() => setEditingTask(task)}
                                                >
                                                    <div className="px-2 py-1 text-xs text-white font-medium truncate">
                                                        {task.name}
                                                    </div>
                                                    {/* 进度条 */}
                                                    {task.progress !== undefined && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-md overflow-hidden">
                                                            <div
                                                                className="h-full bg-white/60"
                                                                style={{ width: `${task.progress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 渲染列表视图
    const renderListView = () => {
        return (
            <div className="overflow-auto h-full p-4">
                {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => {
                    const groupInfo = getGroupLabel(groupKey);
                    const isExpanded = expandedGroups.has(groupKey);
                    const Icon = groupInfo.icon;

                    return (
                        <div key={groupKey} className="mb-6">
                            {groupBy !== 'none' && (
                                <div
                                    className="flex items-center gap-2 mb-3 cursor-pointer"
                                    onClick={() => toggleGroup(groupKey)}
                                >
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    <Icon size={18} />
                                    <h3 className="font-semibold text-slate-900">{groupInfo.label}</h3>
                                    <span className="text-sm text-slate-500">({groupTasks.length})</span>
                                </div>
                            )}

                            {(isExpanded || groupBy === 'none') && (
                                <div className="space-y-2">
                                    {groupTasks.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, task)}
                                            className={`bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all cursor-move ${draggedTask?.id === task.id ? 'opacity-50' : ''
                                                }`}
                                            onClick={() => setEditingTask(task)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-medium text-slate-900">{task.name}</h4>
                                                        {task.priority && (
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                                                task.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                                    task.priority === 'P2' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                {task.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {format(parseISO(task.startDate), 'yyyy-MM-dd')} - {format(parseISO(task.endDate), 'yyyy-MM-dd')}
                                                        </span>
                                                        {task.progress !== undefined && (
                                                            <span>进度: {task.progress}%</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* 进度条 */}
                                            {task.progress !== undefined && (
                                                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all"
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* 工具栏 */}
            <div className="bg-white border-b border-slate-200 p-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* 视图切换 */}
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('gantt')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'gantt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                                    }`}
                            >
                                <Calendar size={16} className="inline mr-1" />
                                甘特图
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                                    }`}
                            >
                                <List size={16} className="inline mr-1" />
                                列表
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                                    }`}
                            >
                                <LayoutGrid size={16} className="inline mr-1" />
                                看板
                            </button>
                            <button
                                onClick={() => setViewMode('network')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'network' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                                    }`}
                            >
                                <Network size={16} className="inline mr-1" />
                                网络图
                            </button>
                        </div>

                        {/* 分组方式 (仅在非看板和非网络图模式下显示) */}
                        {viewMode !== 'board' && viewMode !== 'network' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">分组:</span>
                                <select
                                    value={groupBy}
                                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="none">不分组</option>
                                    <option value="status">按状态</option>
                                    <option value="priority">按优先级</option>
                                    <option value="type">按类型</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                        {/* 导出按钮 */}
                        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-3">
                            <button
                                onClick={() => exportTasksToCSV(tasks, projectName)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="导出 CSV"
                            >
                                <Download size={18} />
                            </button>
                            <button
                                onClick={() => exportGanttToJSON(tasks, projectName)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="导出 JSON"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={printGanttChart}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="打印"
                            >
                                <Printer size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                const newTask: Task = {
                                    id: Date.now().toString(),
                                    name: '新任务',
                                    startDate: format(new Date(), 'yyyy-MM-dd'),
                                    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                                    progress: 0,
                                    type: 'task',
                                    status: 'planning',
                                    priority: 'P2',
                                    color: '#3B82F6'
                                };
                                onTaskAdd(newTask);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} />
                            新建任务
                        </button>
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'gantt' && renderGanttView()}
                {viewMode === 'list' && renderListView()}
                {viewMode === 'board' && (
                    <TaskBoardView
                        tasks={tasks}
                        onTaskUpdate={onTaskUpdate}
                        onTaskClick={setEditingTask}
                    />
                )}
                {viewMode === 'network' && (
                    <TaskNetworkDiagram tasks={tasks} />
                )}
            </div>

            {/* 编辑模态框 */}
            {editingTask && (
                <TaskEditModal
                    task={editingTask}
                    onSave={(updatedTask) => {
                        onTaskUpdate(updatedTask);
                        setEditingTask(null);
                    }}
                    onDelete={(taskId) => {
                        onTaskDelete(taskId);
                        setEditingTask(null);
                    }}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </div>
    );
};

export default SmartTaskView;
