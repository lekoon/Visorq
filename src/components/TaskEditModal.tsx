import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Task } from '../types';

interface TaskEditModalProps {
    task: Task;
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onSave, onDelete, onClose }) => {
    const [editedTask, setEditedTask] = useState<Task>(task);

    const handleSave = () => {
        onSave(editedTask);
        onClose();
    };

    const handleDelete = () => {
        if (onDelete && window.confirm('确定要删除这个任务吗？')) {
            onDelete(task.id);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">编辑任务</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* 任务名称 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">任务名称</label>
                        <input
                            type="text"
                            value={editedTask.name}
                            onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
                        <textarea
                            value={editedTask.description || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                    </div>

                    {/* 日期范围 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">开始日期</label>
                            <input
                                type="date"
                                value={editedTask.startDate}
                                onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">结束日期</label>
                            <input
                                type="date"
                                value={editedTask.endDate}
                                onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* 状态、优先级、类型 */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">状态</label>
                            <select
                                value={editedTask.status}
                                onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as any })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="planning">规划中</option>
                                <option value="active">进行中</option>
                                <option value="completed">已完成</option>
                                <option value="on-hold">暂停</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">优先级</label>
                            <select
                                value={editedTask.priority}
                                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="P0">P0 - 紧急</option>
                                <option value="P1">P1 - 高</option>
                                <option value="P2">P2 - 中</option>
                                <option value="P3">P3 - 低</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">类型</label>
                            <select
                                value={editedTask.type}
                                onChange={(e) => setEditedTask({ ...editedTask, type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="task">任务</option>
                                <option value="milestone">里程碑</option>
                                <option value="group">任务组</option>
                            </select>
                        </div>
                    </div>

                    {/* 进度 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            进度: {editedTask.progress || 0}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={editedTask.progress || 0}
                            onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* 颜色选择 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">颜色</label>
                        <div className="flex gap-2">
                            {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setEditedTask({ ...editedTask, color })}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all ${editedTask.color === color ? 'border-slate-900 scale-110' : 'border-slate-200'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-between pt-4 border-t border-slate-200">
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                删除任务
                            </button>
                        )}
                        <div className="flex gap-3 ml-auto">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskEditModal;
