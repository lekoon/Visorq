import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { ProjectTemplate } from '../types';
import { Plus, Edit2, Trash2, Copy, FileText, X, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TemplateManager: React.FC = () => {
    const { projectTemplates, addTemplate, updateTemplate, deleteTemplate, factorDefinitions } = useStore();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<ProjectTemplate>>({
        name: '',
        description: '',
        defaultFactors: {},
        defaultResources: []
    });

    const initializeFactors = () => {
        const factors: Record<string, number> = {};
        factorDefinitions.forEach(f => factors[f.id] = 5);
        return factors;
    };

    const handleOpenModal = (template?: ProjectTemplate) => {
        if (template) {
            setEditingId(template.id);
            setFormData(template);
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                defaultFactors: initializeFactors(),
                defaultResources: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateTemplate(editingId, formData);
        } else {
            addTemplate({
                ...formData,
                id: Math.random().toString(36).substr(2, 9),
            } as ProjectTemplate);
        }
        setIsModalOpen(false);
    };

    const handleDuplicate = (template: ProjectTemplate) => {
        addTemplate({
            ...template,
            id: Math.random().toString(36).substr(2, 9),
            name: `${template.name} (Copy)`,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('templates.title')}</h2>
                    <p className="text-slate-500 mt-1">{t('templates.subtitle')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} />
                    {t('templates.createTemplate')}
                </button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectTemplates.map(template => (
                    <div
                        key={template.id}
                        className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <FileText className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{template.name}</h3>
                                    <p className="text-xs text-slate-500">{t('templates.template')}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {template.description}
                        </p>

                        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                            <span>{Object.keys(template.defaultFactors).length} {t('templates.factors')}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Users size={14} />
                                {template.defaultResources?.length || 0} {t('templates.resources')}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleOpenModal(template)}
                                className="flex-1 py-2 px-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <Edit2 size={14} />
                                {t('common.edit')}
                            </button>
                            <button
                                onClick={() => handleDuplicate(template)}
                                className="py-2 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title={t('templates.duplicate')}
                            >
                                <Copy size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm(t('templates.confirmDelete'))) {
                                        deleteTemplate(template.id);
                                    }
                                }}
                                className="py-2 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={t('common.delete')}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {projectTemplates.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <FileText className="mx-auto text-slate-400 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('templates.noTemplates')}</h3>
                        <p className="text-slate-500 mb-4">{t('templates.createFirst')}</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            {t('templates.createTemplate')}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingId ? t('templates.editTemplate') : t('templates.createTemplate')}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {t('templates.templateName')}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={t('templates.namePlaceholder')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {t('templates.description')}
                                        </label>
                                        <textarea
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder={t('templates.descriptionPlaceholder')}
                                        />
                                    </div>
                                </div>

                                {/* Default Factors */}
                                <div className="border-t border-slate-100 pt-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t('templates.defaultFactors')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {factorDefinitions.map((factor) => (
                                            <div key={factor.id}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <label className="font-medium text-slate-600">{factor.name}</label>
                                                    <span className="font-bold text-blue-600">
                                                        {formData.defaultFactors?.[factor.id] || 0}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    step="1"
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    value={formData.defaultFactors?.[factor.id] || 0}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        defaultFactors: {
                                                            ...prev.defaultFactors,
                                                            [factor.id]: parseInt(e.target.value)
                                                        }
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TemplateManager;
