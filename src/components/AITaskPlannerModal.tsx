import React, { useState, useMemo } from 'react';
import { X, Sparkles, Calendar, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import type { Task } from '../types';
import {
    generateTaskSuggestions,
    convertTemplateToTasks,
    PROJECT_TEMPLATES,
    type TaskTemplate
} from '../utils/aiTaskPlanner';

interface AITaskPlannerModalProps {
    projectId: string;
    projectName: string;
    onClose: () => void;
    onApply: (tasks: Task[]) => void;
}

const AITaskPlannerModal: React.FC<AITaskPlannerModalProps> = ({
    projectId,
    projectName,
    onClose,
    onApply
}) => {
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'web' | 'mobile' | 'data' | 'infrastructure' | 'custom'>('custom');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTemplates, setSelectedTemplates] = useState<TaskTemplate[]>([]);

    // 生成任务建议
    const handleGenerate = () => {
        const templates = generateTaskSuggestions(description, category);
        setSelectedTemplates(templates);
        setStep('preview');
    };

    // 应用任务
    const handleApply = () => {
        const tasks = convertTemplateToTasks(selectedTemplates, new Date(startDate), projectId);
        onApply(tasks);
        onClose();
    };

    // 计算总工期
    const totalDays = useMemo(() => {
        return selectedTemplates.reduce((sum, t) => sum + t.estimatedDays, 0);
    }, [selectedTemplates]);

    // 计算关键任务数
    const criticalTasksCount = useMemo(() => {
        return selectedTemplates.filter(t => t.priority === 'P0').length;
    }, [selectedTemplates]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">AI 任务规划助手</h2>
                            <p className="text-sm text-slate-500">为 {projectName} 生成任务计划</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* 步骤指示器 */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 ${step === 'input' ? 'text-blue-600' : 'text-green-600'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'input' ? 'bg-blue-100' : 'bg-green-100'
                                }`}>
                                {step === 'input' ? '1' : <CheckCircle size={16} />}
                            </div>
                            <span className="text-sm font-medium">项目描述</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400" />
                        <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'preview' ? 'bg-blue-100' : 'bg-slate-100'
                                }`}>
                                2
                            </div>
                            <span className="text-sm font-medium">预览和调整</span>
                        </div>
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'input' ? (
                        <div className="space-y-6">
                            {/* 项目类别选择 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    项目类别
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {PROJECT_TEMPLATES.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => setCategory(template.category)}
                                            className={`p-4 rounded-lg border-2 transition-all ${category === template.category
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="font-medium text-slate-900 mb-1">{template.name}</div>
                                            <div className="text-xs text-slate-500">{template.tasks.length} 个任务</div>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCategory('custom')}
                                        className={`p-4 rounded-lg border-2 transition-all ${category === 'custom'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="font-medium text-slate-900 mb-1">自定义</div>
                                        <div className="text-xs text-slate-500">通用模板</div>
                                    </button>
                                </div>
                            </div>

                            {/* 项目描述 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    项目描述 <span className="text-slate-400">(可选)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="描述项目的主要目标和功能，AI 将根据描述生成更精准的任务计划..."
                                    className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    💡 提示：包含关键词如"网站"、"移动应用"、"数据分析"等可以帮助 AI 更好地理解项目类型
                                </p>
                            </div>

                            {/* 开始日期 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    项目开始日期
                                </label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 概览卡片 */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-blue-600 mb-1">任务总数</div>
                                    <div className="text-2xl font-bold text-blue-900">{selectedTemplates.length}</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="text-sm text-purple-600 mb-1">预计工期</div>
                                    <div className="text-2xl font-bold text-purple-900">{totalDays} 天</div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg">
                                    <div className="text-sm text-orange-600 mb-1">关键任务</div>
                                    <div className="text-2xl font-bold text-orange-900">{criticalTasksCount} 个</div>
                                </div>
                            </div>

                            {/* 任务列表 */}
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-3">任务列表</h3>
                                <div className="space-y-2">
                                    {selectedTemplates.map((template, index) => (
                                        <div
                                            key={index}
                                            className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-slate-900">{template.name}</h4>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${template.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                                                template.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {template.priority}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${template.type === 'milestone' ? 'bg-green-100 text-green-700' :
                                                                'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {template.type === 'milestone' ? '里程碑' : '任务'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span>预计 {template.estimatedDays} 天</span>
                                                        {template.dependencies && template.dependencies.length > 0 && (
                                                            <span>依赖: 任务 {template.dependencies.map(d => d + 1).join(', ')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 提示信息 */}
                            <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
                                <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">温馨提示</p>
                                    <p>任务将按照依赖关系自动排期，您可以在应用后继续调整任务详情和时间安排。</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部操作栏 */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                    {step === 'input' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                            >
                                <Sparkles size={18} />
                                生成任务计划
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep('input')}
                                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                            >
                                返回修改
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    应用到项目
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AITaskPlannerModal;
