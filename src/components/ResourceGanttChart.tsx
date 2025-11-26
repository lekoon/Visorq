import React, { useMemo } from 'react';
import { format, eachMonthOfInterval, startOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { Project, ResourcePoolItem } from '../types';
import clsx from 'clsx';

interface ResourceGanttChartProps {
    projects: Project[];
    resources: ResourcePoolItem[];
    onProjectClick?: (projectId: string) => void;
}

const ResourceGanttChart: React.FC<ResourceGanttChartProps> = ({
    projects,
    resources,
    onProjectClick
}) => {
    const { t } = useTranslation();

    // Generate timeline
    const timeline = useMemo(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);

        return eachMonthOfInterval({ start, end });
    }, []);

    // Group projects by resource
    const resourceProjects = useMemo(() => {
        return resources.map(resource => {
            const resourceProjs = projects.filter(p =>
                p.resourceRequirements.some(req => req.resourceId === resource.id)
            ).map(project => {
                const req = project.resourceRequirements.find(r => r.resourceId === resource.id);
                return {
                    ...project,
                    resourceCount: req?.count || 0,
                    resourceDuration: req?.duration || 0,
                    resourceUnit: req?.unit || 'month'
                };
            });

            return {
                resource,
                projects: resourceProjs
            };
        });
    }, [projects, resources]);

    const getProjectPosition = (project: any, monthDate: Date) => {
        if (!project.startDate || !project.endDate) return null;

        const projectStart = parseISO(project.startDate);
        const projectEnd = parseISO(project.endDate);

        const isInRange = isWithinInterval(monthDate, { start: projectStart, end: projectEnd });

        if (!isInRange) return null;

        return {
            isStart: format(projectStart, 'yyyy-MM') === format(monthDate, 'yyyy-MM'),
            isEnd: format(projectEnd, 'yyyy-MM') === format(monthDate, 'yyyy-MM'),
            isMid: format(projectStart, 'yyyy-MM') !== format(monthDate, 'yyyy-MM') &&
                format(projectEnd, 'yyyy-MM') !== format(monthDate, 'yyyy-MM')
        };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-500';
            case 'planning': return 'bg-purple-500';
            case 'completed': return 'bg-green-500';
            case 'on-hold': return 'bg-gray-400';
            default: return 'bg-slate-500';
        }
    };

    const getStatusBorderColor = (status: string) => {
        switch (status) {
            case 'active': return 'border-blue-600';
            case 'planning': return 'border-purple-600';
            case 'completed': return 'border-green-600';
            case 'on-hold': return 'border-gray-500';
            default: return 'border-slate-600';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                    {t('resources.gantt.title')}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    {t('resources.gantt.subtitle')}
                </p>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Timeline Header */}
                    <div className="flex border-b border-slate-200 bg-slate-50">
                        <div className="w-48 flex-shrink-0 p-4 font-bold text-slate-700 sticky left-0 bg-slate-50 z-20 border-r border-slate-200">
                            {t('resources.gantt.resource')}
                        </div>
                        <div className="flex flex-1">
                            {timeline.map((month, idx) => (
                                <div
                                    key={idx}
                                    className="flex-1 min-w-[100px] p-4 text-center font-semibold text-slate-600 border-r border-slate-200"
                                >
                                    {format(month, 'MMM yyyy')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resource Rows */}
                    {resourceProjects.map(({ resource, projects: resProjects }) => (
                        <div key={resource.id} className="border-b border-slate-100">
                            <div className="flex hover:bg-slate-50/50 transition-colors">
                                <div className="w-48 flex-shrink-0 p-4 font-medium text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {resource.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {t('resources.capacity')}: {resource.totalQuantity}
                                    </div>
                                </div>
                                <div className="flex flex-1 relative" style={{ height: '80px' }}>
                                    {timeline.map((month, monthIdx) => (
                                        <div
                                            key={monthIdx}
                                            className="flex-1 min-w-[100px] border-r border-slate-100 relative"
                                        >
                                            {/* Render projects in this month */}
                                            {resProjects.map((project, projIdx) => {
                                                const position = getProjectPosition(project, month);
                                                if (!position) return null;

                                                return (
                                                    <div
                                                        key={`${project.id}-${monthIdx}`}
                                                        onClick={() => onProjectClick?.(project.id)}
                                                        className={clsx(
                                                            'absolute top-2 h-12 cursor-pointer transition-all hover:scale-105 hover:shadow-lg group',
                                                            getStatusColor(project.status),
                                                            'border-2',
                                                            getStatusBorderColor(project.status)
                                                        )}
                                                        style={{
                                                            left: position.isStart ? '4px' : '0',
                                                            right: position.isEnd ? '4px' : '0',
                                                            borderRadius: position.isStart && position.isEnd ? '8px' :
                                                                position.isStart ? '8px 0 0 8px' :
                                                                    position.isEnd ? '0 8px 8px 0' : '0',
                                                            top: `${8 + (projIdx * 20)}px`,
                                                            zIndex: 5
                                                        }}
                                                    >
                                                        {position.isStart && (
                                                            <div className="px-2 py-1 text-white text-xs font-bold truncate">
                                                                {project.name}
                                                            </div>
                                                        )}

                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                                                            <div className="font-bold mb-2">{project.name}</div>
                                                            <div className="space-y-1 text-slate-300">
                                                                <div>{t('projects.status')}: {t(`projects.${project.status}`)}</div>
                                                                <div>{t('resources.gantt.allocation')}: {project.resourceCount} {t('analysis.units')}</div>
                                                                <div>{t('projects.startDate')}: {format(parseISO(project.startDate), 'MMM dd, yyyy')}</div>
                                                                <div>{t('projects.endDate')}: {format(parseISO(project.endDate), 'MMM dd, yyyy')}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {resourceProjects.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            {t('resources.gantt.noData')}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600"></div>
                    <span>{t('projects.active')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500 border-2 border-purple-600"></div>
                    <span>{t('projects.planning')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-600"></div>
                    <span>{t('projects.completed')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-400 border-2 border-gray-500"></div>
                    <span>{t('projects.on-hold')}</span>
                </div>
            </div>
        </div>
    );
};

export default ResourceGanttChart;
