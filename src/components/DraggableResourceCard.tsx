import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Users, Trash2, Edit2 } from 'lucide-react';
import type { ResourcePoolItem } from '../types';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface DraggableResourceCardProps {
    resource: ResourcePoolItem;
    onUpdate: (id: string, updates: Partial<ResourcePoolItem>) => void;
    onDelete: (id: string) => void;
    onEdit?: (resource: ResourcePoolItem) => void;
    utilizationPercentage?: number;
}

const DraggableResourceCard: React.FC<DraggableResourceCardProps> = ({
    resource,
    onUpdate,
    onDelete,
    onEdit,
    utilizationPercentage = 0
}) => {
    const { t } = useTranslation();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: resource.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const getUtilizationColor = (percentage: number) => {
        if (percentage > 100) return 'text-red-600 bg-red-50';
        if (percentage > 80) return 'text-yellow-600 bg-yellow-50';
        if (percentage >= 50) return 'text-green-600 bg-green-50';
        return 'text-slate-600 bg-slate-50';
    };

    const getUtilizationBarColor = (percentage: number) => {
        if (percentage > 100) return 'bg-red-500';
        if (percentage > 80) return 'bg-yellow-500';
        if (percentage >= 50) return 'bg-green-500';
        return 'bg-slate-400';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                'bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all',
                isDragging && 'shadow-2xl ring-2 ring-blue-500'
            )}
        >
            {/* Drag Handle */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                        <GripVertical size={20} />
                    </button>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users size={24} />
                    </div>
                </div>
                <div className="flex gap-2">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(resource)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title={t('common.edit')}
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(resource.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title={t('common.delete')}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Resource Info */}
            <h3 className="text-lg font-bold text-slate-900 mb-1">{resource.name}</h3>

            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-blue-600">{resource.totalQuantity}</span>
                <span className="text-sm text-slate-500">{t('resources.unitsAvailable')}</span>
            </div>

            {/* Utilization Bar */}
            {utilizationPercentage > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-600">
                            {t('resources.analysis.utilization')}
                        </span>
                        <span className={clsx(
                            'text-xs font-bold px-2 py-1 rounded-full',
                            getUtilizationColor(utilizationPercentage)
                        )}>
                            {utilizationPercentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                            className={clsx(
                                'h-full rounded-full transition-all duration-500',
                                getUtilizationBarColor(utilizationPercentage)
                            )}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Update Capacity */}
            <div className="pt-4 border-t border-slate-50">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {t('resources.updateCapacity')}
                </label>
                <input
                    type="number"
                    min="0"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    value={resource.totalQuantity}
                    onChange={(e) => onUpdate(resource.id, { totalQuantity: parseInt(e.target.value) || 0 })}
                />
            </div>

            {resource.costPerUnit && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t('resources.costPerUnit')}:</span>
                        <span className="font-bold text-slate-700">
                            ${resource.costPerUnit.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DraggableResourceCard;
