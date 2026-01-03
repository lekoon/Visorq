import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { EnvironmentType, EnvironmentStatus } from '../types';
import { Button } from './ui';

interface AddEnvironmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (environment: {
        name: string;
        type: EnvironmentType;
        status: EnvironmentStatus;
        description?: string;
        capacity?: number;
        location?: string;
        tags?: string[];
    }) => void;
}

const AddEnvironmentModal: React.FC<AddEnvironmentModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'test' as EnvironmentType,
        status: 'available' as EnvironmentStatus,
        description: '',
        capacity: 1,
        location: '',
        tags: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const environmentTypes: { value: EnvironmentType; label: string; description: string }[] = [
        { value: 'test', label: '测试环境', description: '用于功能测试和QA验证' },
        { value: 'staging', label: '预发布环境', description: '生产前的最终验证环境' },
        { value: 'production', label: '生产环境', description: '正式生产环境' },
        { value: 'integration', label: '集成环境', description: '系统集成测试环境' },
        { value: 'device', label: '设备资源', description: '物理设备或硬件资源' },
        { value: 'license', label: '许可证', description: '软件许可证或授权' },
    ];

    const statusOptions: { value: EnvironmentStatus; label: string; color: string }[] = [
        { value: 'available', label: '可用', color: 'text-green-600' },
        { value: 'occupied', label: '占用中', color: 'text-blue-600' },
        { value: 'maintenance', label: '维护中', color: 'text-yellow-600' },
        { value: 'offline', label: '离线', color: 'text-red-600' },
    ];

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = '请输入环境名称';
        }

        if (formData.capacity && formData.capacity < 1) {
            newErrors.capacity = '容量必须大于0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const tags = formData.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

        onAdd({
            name: formData.name.trim(),
            type: formData.type,
            status: formData.status,
            description: formData.description.trim() || undefined,
            capacity: formData.capacity || undefined,
            location: formData.location.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
        });

        // Reset form
        setFormData({
            name: '',
            type: 'test',
            status: 'available',
            description: '',
            capacity: 1,
            location: '',
            tags: '',
        });
        setErrors({});
        onClose();
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            添加环境资源
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            添加测试环境、设备或许可证等资源
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            环境名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="例如：测试环境-01"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.name
                                    ? 'border-red-300 dark:border-red-700'
                                    : 'border-slate-300 dark:border-slate-600'
                                } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            资源类型 <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {environmentTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleChange('type', type.value)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${formData.type === type.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                        {type.label}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {type.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            初始状态
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {statusOptions.map((status) => (
                                <button
                                    key={status.value}
                                    type="button"
                                    onClick={() => handleChange('status', status.value)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.status === status.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <span className={`font-medium ${status.color}`}>{status.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            描述
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="环境的详细描述、配置信息等..."
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Capacity */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                容量
                            </label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                                min="1"
                                placeholder="1"
                                className={`w-full px-4 py-2 rounded-lg border ${errors.capacity
                                        ? 'border-red-300 dark:border-red-700'
                                        : 'border-slate-300 dark:border-slate-600'
                                    } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.capacity && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.capacity}</p>
                            )}
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                位置
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="例如：机房A-01"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            标签
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => handleChange('tags', e.target.value)}
                            placeholder="用逗号分隔，例如：高性能,Linux,Docker"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            使用逗号分隔多个标签
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        取消
                    </Button>
                    <Button type="submit" onClick={handleSubmit}>
                        添加环境资源
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddEnvironmentModal;
