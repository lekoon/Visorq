import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import type { EnvironmentResource } from '../types';
import { Button } from './ui';
import { useStore } from '../store/useStore';

interface BookEnvironmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    environment: EnvironmentResource | null;
    onBook: (booking: {
        environmentId: string;
        projectId: string;
        projectName: string;
        bookedBy: string;
        bookedByName: string;
        startDate: string;
        endDate: string;
        purpose: string;
        status: 'reserved' | 'active';
    }) => void;
}

const BookEnvironmentModal: React.FC<BookEnvironmentModalProps> = ({
    isOpen,
    onClose,
    environment,
    onBook,
}) => {
    const { projects, user } = useStore();
    const [formData, setFormData] = useState({
        projectId: '',
        startDate: '',
        endDate: '',
        purpose: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.projectId) {
            newErrors.projectId = '请选择项目';
        }

        if (!formData.startDate) {
            newErrors.startDate = '请选择开始日期';
        }

        if (!formData.endDate) {
            newErrors.endDate = '请选择结束日期';
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end <= start) {
                newErrors.endDate = '结束日期必须晚于开始日期';
            }
        }

        if (!formData.purpose.trim()) {
            newErrors.purpose = '请输入预约目的';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !environment) return;

        const selectedProject = projects.find((p) => p.id === formData.projectId);
        if (!selectedProject) return;

        const now = new Date();
        const startDate = new Date(formData.startDate);
        const status = startDate <= now ? 'active' : 'reserved';

        onBook({
            environmentId: environment.id,
            projectId: formData.projectId,
            projectName: selectedProject.name,
            bookedBy: user?.id || 'unknown',
            bookedByName: user?.name || user?.username || 'Unknown User',
            startDate: formData.startDate,
            endDate: formData.endDate,
            purpose: formData.purpose.trim(),
            status,
        });

        // Reset form
        setFormData({
            projectId: '',
            startDate: '',
            endDate: '',
            purpose: '',
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

    if (!isOpen || !environment) return null;

    // Check for conflicts
    const hasConflict = environment.bookings.some((booking) => {
        if (booking.status === 'cancelled' || booking.status === 'completed') return false;
        if (!formData.startDate || !formData.endDate) return false;

        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        const newStart = new Date(formData.startDate);
        const newEnd = new Date(formData.endDate);

        return newStart < bookingEnd && newEnd > bookingStart;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            预约环境资源
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {environment.name} - {environment.type}
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
                    {/* Project Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            选择项目 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.projectId}
                            onChange={(e) => handleChange('projectId', e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.projectId
                                ? 'border-red-300 dark:border-red-700'
                                : 'border-slate-300 dark:border-slate-600'
                                } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        >
                            <option value="">请选择项目</option>
                            {projects
                                .filter((p) => p.status === 'active')
                                .map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                        </select>
                        {errors.projectId && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectId}</p>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                开始日期 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-2 rounded-lg border ${errors.startDate
                                    ? 'border-red-300 dark:border-red-700'
                                    : 'border-slate-300 dark:border-slate-600'
                                    } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.startDate && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                结束日期 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-2 rounded-lg border ${errors.endDate
                                    ? 'border-red-300 dark:border-red-700'
                                    : 'border-slate-300 dark:border-slate-600'
                                    } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.endDate && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Conflict Warning */}
                    {hasConflict && (
                        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                    时间冲突
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    所选时间段与现有预约存在冲突，请选择其他时间段
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Purpose */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            预约目的 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.purpose}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                            placeholder="例如：功能测试、性能测试、集成测试等"
                            rows={3}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.purpose
                                ? 'border-red-300 dark:border-red-700'
                                : 'border-slate-300 dark:border-slate-600'
                                } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                        />
                        {errors.purpose && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.purpose}</p>
                        )}
                    </div>

                    {/* Current Bookings */}
                    {environment.bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'completed')
                        .length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    现有预约
                                </h4>
                                <div className="space-y-2">
                                    {environment.bookings
                                        .filter((b) => b.status !== 'cancelled' && b.status !== 'completed')
                                        .map((booking) => (
                                            <div
                                                key={booking.id}
                                                className="text-sm text-blue-800 dark:text-blue-200"
                                            >
                                                <span className="font-medium">{booking.projectName}</span>
                                                <span className="text-blue-600 dark:text-blue-300 ml-2">
                                                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                                                    {new Date(booking.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        取消
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleSubmit({} as React.FormEvent)}
                        disabled={hasConflict}
                    >
                        {hasConflict ? '存在冲突' : '确认预约'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BookEnvironmentModal;
