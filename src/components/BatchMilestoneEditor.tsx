import React, { useState } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';

interface Milestone {
    id: string;
    name: string;
    date: string;
    completed: boolean;
    description?: string;
}

interface BatchMilestoneEditorProps {
    milestones: Milestone[];
    onSave: (updatedMilestones: Milestone[]) => void;
    onClose: () => void;
}

const BatchMilestoneEditor: React.FC<BatchMilestoneEditorProps> = ({ milestones, onSave, onClose }) => {
    const [offsetDays, setOffsetDays] = useState(0);
    const [previewMilestones, setPreviewMilestones] = useState<Milestone[]>(milestones);

    const handlePreview = () => {
        const updated = milestones.map(m => ({
            ...m,
            date: format(addDays(parseISO(m.date), offsetDays), 'yyyy-MM-dd')
        }));
        setPreviewMilestones(updated);
    };

    const handleApply = () => {
        onSave(previewMilestones);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">批量调整里程碑</h2>
                                <p className="text-sm text-purple-100 mt-1">
                                    同时调整所有里程碑的日期
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Adjustment Input */}
                    <div className="mb-6 p-5 bg-purple-50 rounded-xl border-2 border-purple-200">
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                            调整天数
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={offsetDays}
                                onChange={(e) => setOffsetDays(parseInt(e.target.value) || 0)}
                                className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
                                placeholder="输入正数推迟，负数提前"
                            />
                            <button
                                onClick={handlePreview}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                            >
                                预览效果
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                            💡 提示：输入正数将所有里程碑日期推迟，输入负数将提前。例如：输入 7 表示所有里程碑推迟 7 天。
                        </p>
                    </div>

                    {/* Milestones Comparison */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 mb-3">里程碑对比</h3>
                        {milestones.map((milestone, index) => {
                            const newMilestone = previewMilestones[index];
                            const hasChanged = milestone.date !== newMilestone.date;

                            return (
                                <div
                                    key={milestone.id}
                                    className={`p-4 rounded-lg border-2 transition-all ${hasChanged
                                            ? 'border-purple-300 bg-purple-50'
                                            : 'border-slate-200 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-slate-900 mb-1">
                                                {milestone.name}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500">原日期:</span>
                                                    <span className="font-mono font-medium text-slate-700">
                                                        {milestone.date}
                                                    </span>
                                                </div>
                                                {hasChanged && (
                                                    <>
                                                        <span className="text-purple-500">→</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-purple-600">新日期:</span>
                                                            <span className="font-mono font-bold text-purple-700">
                                                                {newMilestone.date}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {hasChanged && (
                                            <div className="flex-shrink-0 ml-4">
                                                <div className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                                                    {offsetDays > 0 ? `+${offsetDays}` : offsetDays} 天
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            {offsetDays !== 0 ? (
                                <span>
                                    将调整 <strong className="text-purple-600">{milestones.length}</strong> 个里程碑
                                </span>
                            ) : (
                                <span>请输入调整天数</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={offsetDays === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg"
                            >
                                <Check size={18} />
                                应用调整
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchMilestoneEditor;
