/**
 * Add Resource Modal
 * Modal for adding new resources to the resource pool
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { ResourcePoolItem } from '../types';

interface AddResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose }) => {
    const { addResource } = useStore();
    const [formData, setFormData] = useState({
        name: '',
        totalQuantity: 1,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('请输入资源名称');
            return;
        }

        if (formData.totalQuantity <= 0) {
            alert('资源数量必须大于0');
            return;
        }

        const newResource: ResourcePoolItem = {
            id: `resource-${Date.now()}`,
            name: formData.name.trim(),
            totalQuantity: formData.totalQuantity,
            skills: [],
            members: [],
        };

        addResource(newResource);

        // Reset form
        setFormData({
            name: '',
            totalQuantity: 1,
        });

        onClose();
    };

    const handleClose = () => {
        setFormData({
            name: '',
            totalQuantity: 1,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">添加资源</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Resource Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            资源名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="例如：开发工程师、设计师"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Total Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            总数量 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.totalQuantity}
                            onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            添加
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddResourceModal;
