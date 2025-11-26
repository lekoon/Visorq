import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { detectResourceConflicts } from '../utils/conflictDetection';
import { AlertTriangle, CheckCircle, Calendar, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ResourceConflictDetector: React.FC = () => {
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();

    const conflicts = useMemo(() => {
        return detectResourceConflicts(projects, resourcePool);
    }, [projects, resourcePool]);

    const conflictsByResource = useMemo(() => {
        const map = new Map<string, typeof conflicts>();
        conflicts.forEach(conflict => {
            const existing = map.get(conflict.resourceId) || [];
            map.set(conflict.resourceId, [...existing, conflict]);
        });
        return map;
    }, [conflicts]);

    const totalConflicts = conflicts.length;
    const affectedResources = conflictsByResource.size;
    const criticalConflicts = conflicts.filter(c => c.overallocation > c.capacity * 0.5).length;

    if (totalConflicts === 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="text-green-600" size={28} />
                    <h3 className="text-lg font-bold text-green-900">{t('conflicts.noConflicts')}</h3>
                </div>
                <p className="text-green-700">{t('conflicts.allResourcesOptimal')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="text-red-600" size={24} />
                        <h4 className="font-bold text-red-900">{t('conflicts.totalConflicts')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{totalConflicts}</p>
                    <p className="text-sm text-red-700 mt-1">{t('conflicts.periodsAffected')}</p>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-orange-600" size={24} />
                        <h4 className="font-bold text-orange-900">{t('conflicts.affectedResources')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{affectedResources}</p>
                    <p className="text-sm text-orange-700 mt-1">{t('conflicts.resourceTypes')}</p>
                </div>

                <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="text-yellow-600" size={24} />
                        <h4 className="font-bold text-yellow-900">{t('conflicts.critical')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{criticalConflicts}</p>
                    <p className="text-sm text-yellow-700 mt-1">{t('conflicts.over50Percent')}</p>
                </div>
            </div>

            {/* Detailed Conflicts */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-orange-50">
                    <h3 className="text-lg font-bold text-slate-900">{t('conflicts.detailedView')}</h3>
                    <p className="text-sm text-slate-600 mt-1">{t('conflicts.reviewAndResolve')}</p>
                </div>

                <div className="divide-y divide-slate-100">
                    {Array.from(conflictsByResource.entries()).map(([resourceId, resourceConflicts]) => {
                        const resource = resourcePool.find(r => r.id === resourceId);
                        if (!resource) return null;

                        return (
                            <div key={resourceId} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{resource.name}</h4>
                                        <p className="text-sm text-slate-500">
                                            {t('conflicts.capacity')}: {resource.totalQuantity} {t('conflicts.units')}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                                        {resourceConflicts.length} {t('conflicts.conflicts')}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {resourceConflicts.map((conflict, idx) => (
                                        <div
                                            key={`${conflict.period}-${idx}`}
                                            className="bg-red-50 p-4 rounded-xl border border-red-200"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="text-red-600" size={18} />
                                                    <span className="font-bold text-red-900">{conflict.period}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-red-700">
                                                        {t('conflicts.overallocated')}:
                                                        <span className="font-bold ml-1">
                                                            +{conflict.overallocation} ({((conflict.overallocation / conflict.capacity) * 100).toFixed(0)}%)
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-red-600">
                                                        {conflict.allocated} / {conflict.capacity} {t('conflicts.allocated')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-3">
                                                <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all"
                                                        style={{ width: `${Math.min((conflict.allocated / conflict.capacity) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Conflicting Projects */}
                                            <div>
                                                <p className="text-xs font-bold text-red-800 mb-2">
                                                    {t('conflicts.conflictingProjects')}:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {conflict.conflictingProjects.map(proj => (
                                                        <div
                                                            key={proj.projectId}
                                                            className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs"
                                                        >
                                                            <span className="font-medium text-slate-900">{proj.projectName}</span>
                                                            <span className="text-red-600 ml-2">({proj.allocation} {t('conflicts.units')})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Recommendation */}
                                            <div className="mt-3 pt-3 border-t border-red-300">
                                                <p className="text-xs text-red-800">
                                                    <span className="font-bold">💡 {t('conflicts.recommendation')}:</span>
                                                    {conflict.overallocation > conflict.capacity * 0.5
                                                        ? t('conflicts.criticalRecommendation')
                                                        : t('conflicts.moderateRecommendation')
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ResourceConflictDetector;
