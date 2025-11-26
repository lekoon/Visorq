import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { ProjectTemplate } from '../types';
import { X, Sparkles, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface TemplatePickerProps {
    onSelect: (template: ProjectTemplate) => void;
    onClose: () => void;
    onCreateBlank: () => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect, onClose, onCreateBlank }) => {
    const { projectTemplates } = useStore();
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        { id: 'all', label: t('templates.allCategories'), icon: '📋' },
        { id: 'web', label: t('templates.web'), icon: '🌐' },
        { id: 'mobile', label: t('templates.mobile'), icon: '📱' },
        { id: 'data', label: t('templates.data'), icon: '📊' },
        { id: 'infrastructure', label: t('templates.infrastructure'), icon: '🏗️' },
        { id: 'custom', label: t('templates.custom'), icon: '⚙️' },
    ];

    const filteredTemplates = selectedCategory === 'all'
        ? projectTemplates
        : projectTemplates.filter(t => t.category === selectedCategory);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'web': return 'from-blue-500 to-cyan-500';
            case 'mobile': return 'from-purple-500 to-pink-500';
            case 'data': return 'from-green-500 to-emerald-500';
            case 'infrastructure': return 'from-orange-500 to-red-500';
            case 'custom': return 'from-slate-500 to-gray-500';
            default: return 'from-blue-500 to-purple-500';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="text-blue-600" size={28} />
                                {t('templates.chooseTemplate')}
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">{t('templates.subtitle')}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-2"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all",
                                    selectedCategory === cat.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                        : "bg-white text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <span className="mr-2">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Blank Project Card */}
                        <button
                            onClick={onCreateBlank}
                            className="group p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left"
                        >
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 mb-4 transition-colors">
                                <Plus className="text-slate-600 group-hover:text-blue-600" size={24} />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">{t('templates.blankProject')}</h3>
                            <p className="text-sm text-slate-500">{t('templates.blankDescription')}</p>
                        </button>

                        {/* Template Cards */}
                        {filteredTemplates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => onSelect(template)}
                                className="group p-6 border border-slate-200 rounded-2xl hover:shadow-xl hover:border-transparent transition-all text-left relative overflow-hidden"
                            >
                                {/* Background Gradient */}
                                <div className={clsx(
                                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
                                    getCategoryColor(template.category)
                                )} />

                                {/* Content */}
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-3xl">{template.icon}</div>
                                        {template.isBuiltIn && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                                {t('templates.builtin')}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-slate-900 mb-2 text-lg">{template.name}</h3>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{template.description}</p>

                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <span>⏱️</span>
                                            <span>{template.defaultDuration} {t('common.months')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span>👥</span>
                                            <span>{template.defaultResources.reduce((sum, r) => sum + r.count, 0)} {t('common.people')}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-lg">{t('templates.noTemplates')}</p>
                            <p className="text-sm mt-2">{t('templates.tryDifferentCategory')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplatePicker;
