import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { User, Calendar, Download, Edit, Clock, AlertCircle } from 'lucide-react';
import { format, addWeeks, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns';
import { useTranslation } from 'react-i18next';

const UserWorkbench: React.FC = () => {
    const { user, projects, resourcePool } = useStore();
    const { t } = useTranslation();

    // 模拟当前用户作为团队成员
    const currentMember = useMemo(() => {
        // 在实际应用中，应该从 store 中获取当前用户对应的 TeamMember
        return {
            id: user?.id || 'user-1',
            name: user?.name || 'Current User',
            role: 'Senior Developer',
            availability: 40,
            assignments: [
                {
                    projectId: projects[0]?.id || 'proj-1',
                    projectName: projects[0]?.name || 'Project Alpha',
                    hours: 16,
                    startDate: format(new Date(), 'yyyy-MM-dd'),
                    endDate: format(addWeeks(new Date(), 2), 'yyyy-MM-dd')
                },
                {
                    projectId: projects[1]?.id || 'proj-2',
                    projectName: projects[1]?.name || 'Project Beta',
                    hours: 20,
                    startDate: format(new Date(), 'yyyy-MM-dd'),
                    endDate: format(addWeeks(new Date(), 3), 'yyyy-MM-dd')
                }
            ]
        };
    }, [user, projects]);

    const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
        start: currentWeek,
        end: endOfWeek(currentWeek, { weekStartsOn: 1 })
    }).slice(0, 5); // Mon-Fri

    const totalHours = currentMember.assignments.reduce((sum, a) => sum + a.hours, 0);
    const isOverloaded = totalHours > currentMember.availability;

    const handleExportPlan = () => {
        // 实现导出计划为PDF的逻辑
        alert(t('workbench.exportingPlan'));
    };

    const handleRequestAdjustment = () => {
        // 实现申请调整的逻辑
        alert(t('workbench.adjustmentRequested'));
    };

    return (
        <div className="space-y-6">
            {/* Profile Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold">
                            {currentMember.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">{currentMember.name}</h1>
                            <p className="text-blue-100">{currentMember.role}</p>
                            <p className="text-sm text-blue-100 mt-2">
                                <Clock className="inline mr-1" size={14} />
                                {t('workbench.weeklyCapacity')}: {currentMember.availability}h
                            </p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors flex items-center gap-2">
                        <Edit size={18} />
                        {t('common.edit')}
                    </button>
                </div>
            </div>

            {/* Weekly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('workbench.thisWeek')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalHours}h</h3>
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-xl border shadow-sm ${isOverloaded ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-3 rounded-lg ${isOverloaded ? 'bg-red-100' : 'bg-green-100'}`}>
                            {isOverloaded ? (
                                <AlertCircle className="text-red-600" size={24} />
                            ) : (
                                <User className="text-green-600" size={24} />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('workbench.utilization')}</p>
                            <h3 className={`text-2xl font-bold ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
                                {((totalHours / currentMember.availability) * 100).toFixed(0)}%
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('workbench.activeProjects')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{currentMember.assignments.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignment Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{t('workbench.assignmentTimeline')}</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Week {format(currentWeek, 'w, yyyy')} - {format(currentWeek, 'MMM d')} to {format(addWeeks(currentWeek, 1), 'MMM d')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRequestAdjustment}
                            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                        >
                            {t('workbench.requestAdjustment')}
                        </button>
                        <button
                            onClick={handleExportPlan}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Download size={18} />
                            {t('workbench.exportPlan')}
                        </button>
                    </div>
                </div>

                {/* Gantt-style Timeline */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left p-3 text-sm font-semibold text-slate-600 w-64">
                                    {t('workbench.project')}
                                </th>
                                {weekDays.map(day => (
                                    <th key={day.toISOString()} className="p-3 text-center text-xs font-medium text-slate-500 min-w-[80px]">
                                        <div>{format(day, 'EEE')}</div>
                                        <div className="text-slate-400">{format(day, 'MMM d')}</div>
                                    </th>
                                ))}
                                <th className="p-3 text-center text-sm font-semibold text-slate-600">
                                    {t('workbench.total')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentMember.assignments.map((assignment, idx) => {
                                const dailyHours = assignment.hours / 5; // 平均分配到5个工作日
                                const project = projects.find(p => p.id === assignment.projectId);

                                return (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${project?.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                                        project?.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {project?.priority || 'P2'}
                                                </span>
                                                <span className="font-medium text-slate-900">{assignment.projectName}</span>
                                            </div>
                                        </td>
                                        {weekDays.map(day => (
                                            <td key={day.toISOString()} className="p-2">
                                                <div className="h-8 bg-blue-100 rounded flex items-center justify-center">
                                                    <span className="text-xs font-medium text-blue-700">
                                                        {dailyHours.toFixed(1)}h
                                                    </span>
                                                </div>
                                            </td>
                                        ))}
                                        <td className="p-3 text-center">
                                            <span className="font-bold text-slate-900">{assignment.hours}h</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-slate-50 font-bold">
                                <td className="p-3">{t('workbench.total')}</td>
                                {weekDays.map((day, idx) => {
                                    const dayTotal = currentMember.assignments.reduce((sum, a) => sum + a.hours / 5, 0);
                                    const isOverDay = dayTotal > 8;
                                    return (
                                        <td key={idx} className="p-2">
                                            <div className={`h-8 rounded flex items-center justify-center ${isOverDay ? 'bg-red-100' : 'bg-green-100'
                                                }`}>
                                                <span className={`text-xs font-bold ${isOverDay ? 'text-red-700' : 'text-green-700'
                                                    }`}>
                                                    {dayTotal.toFixed(1)}h
                                                </span>
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="p-3 text-center">
                                    <span className={`font-bold ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
                                        {totalHours}h
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {isOverloaded && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                        <div>
                            <h5 className="font-bold text-red-900 mb-1">{t('workbench.overloadWarning')}</h5>
                            <p className="text-sm text-red-700">
                                {t('workbench.overloadMessage', { hours: totalHours, capacity: currentMember.availability })}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserWorkbench;
