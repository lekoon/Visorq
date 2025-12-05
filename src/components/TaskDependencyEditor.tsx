import React, { useMemo, useState } from 'react';
import { GitBranch, AlertCircle, Trash2, Plus, CheckCircle } from 'lucide-react';
import type { Task } from '../types';
import { detectCircularDependency, calculateCriticalPath } from '../utils/taskDependency';

interface TaskDependencyEditorProps {
    tasks: Task[];
    onUpdateTask: (task: Task) => void;
}

const TaskDependencyEditor: React.FC<TaskDependencyEditorProps> = ({
    tasks,
    onUpdateTask
}) => {
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [newDependencyId, setNewDependencyId] = useState<string>('');

    const selectedTask = useMemo(() => {
        return tasks.find(t => t.id === selectedTaskId);
    }, [tasks, selectedTaskId]);

    // 计算关键路径
    const criticalPathData = useMemo(() => {
        return calculateCriticalPath(tasks);
    }, [tasks]);

    // 添加依赖
    const handleAddDependency = () => {
        if (!selectedTask || !newDependencyId) return;

        // 检测循环依赖
        const hasCycle = detectCircularDependency(tasks, newDependencyId, selectedTask.id);
        if (hasCycle) {
            alert('添加此依赖会形成循环！');
            return;
        }

        const updatedTask = {
            ...selectedTask,
            dependencies: [...(selectedTask.dependencies || []), newDependencyId]
        };

        onUpdateTask(updatedTask);
        setNewDependencyId('');
    };

    // 删除依赖
    const handleRemoveDependency = (depId: string) => {
        if (!selectedTask) return;

        const updatedTask = {
            ...selectedTask,
            dependencies: (selectedTask.dependencies || []).filter(id => id !== depId)
        };

        onUpdateTask(updatedTask);
    };

    // 获取可用的依赖选项（排除自己和已有依赖）
    const availableDependencies = useMemo(() => {
        if (!selectedTask) return [];

        const existingDeps = new Set(selectedTask.dependencies || []);
        return tasks.filter(t =>
            t.id !== selectedTask.id && !existingDeps.has(t.id)
        );
    }, [tasks, selectedTask]);

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                    <GitBranch size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">任务依赖关系</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                    管理任务之间的依赖关系，确保项目顺利进行
                </p>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200">
                {/* 左侧：任务列表 */}
                <div className="p-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">任务列表</h4>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {tasks.map(task => {
                            const isOnCriticalPath = criticalPathData.criticalPath.includes(task.id);
                            const slack = criticalPathData.slack[task.id] || 0;

                            return (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTaskId(task.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTaskId === task.id
                                            ? 'bg-blue-50 border-2 border-blue-500'
                                            : 'hover:bg-slate-50 border-2 border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-slate-900 text-sm">{task.name}</span>
                                        {isOnCriticalPath && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                关键路径
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        {task.dependencies && task.dependencies.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <GitBranch size={12} />
                                                {task.dependencies.length} 个依赖
                                            </span>
                                        )}
                                        {!isOnCriticalPath && slack > 0 && (
                                            <span className="text-green-600">
                                                浮动 {slack} 天
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 右侧：依赖编辑 */}
                <div className="p-4">
                    {selectedTask ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-1">
                                    {selectedTask.name}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {selectedTask.startDate} ~ {selectedTask.endDate}
                                </p>
                            </div>

                            {/* 当前依赖 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        前置任务
                                    </label>
                                    <span className="text-xs text-slate-500">
                                        {(selectedTask.dependencies || []).length} 个
                                    </span>
                                </div>

                                {selectedTask.dependencies && selectedTask.dependencies.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedTask.dependencies.map(depId => {
                                            const depTask = tasks.find(t => t.id === depId);
                                            if (!depTask) return null;

                                            return (
                                                <div
                                                    key={depId}
                                                    className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-slate-900 truncate">
                                                            {depTask.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {depTask.startDate} ~ {depTask.endDate}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveDependency(depId)}
                                                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="删除依赖"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded border border-dashed border-slate-300">
                                        无前置任务
                                    </div>
                                )}
                            </div>

                            {/* 添加依赖 */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                    添加前置任务
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={newDependencyId}
                                        onChange={(e) => setNewDependencyId(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">选择任务...</option>
                                        {availableDependencies.map(task => (
                                            <option key={task.id} value={task.id}>
                                                {task.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAddDependency}
                                        disabled={!newDependencyId}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* 提示信息 */}
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-900">
                                    <p className="font-medium mb-1">依赖规则</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>前置任务必须在当前任务之前完成</li>
                                        <li>系统会自动检测并阻止循环依赖</li>
                                        <li>关键路径上的任务没有浮动时间</li>
                                    </ul>
                                </div>
                            </div>

                            {/* 关键路径信息 */}
                            {criticalPathData.criticalPath.includes(selectedTask.id) && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                                    <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-red-900">
                                        <p className="font-medium mb-1">关键路径任务</p>
                                        <p>此任务在关键路径上，任何延期都会影响项目整体进度。</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            <div className="text-center">
                                <GitBranch size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">选择一个任务以编辑依赖关系</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 底部统计 */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{tasks.length}</div>
                        <div className="text-xs text-slate-500">总任务数</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-700">
                            {criticalPathData.criticalPath.length}
                        </div>
                        <div className="text-xs text-slate-500">关键路径任务</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-700">
                            {tasks.filter(t => t.dependencies && t.dependencies.length > 0).length}
                        </div>
                        <div className="text-xs text-slate-500">有依赖的任务</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDependencyEditor;
