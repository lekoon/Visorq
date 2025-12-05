import React, { useState, useMemo, useRef } from 'react';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Project, ResourcePoolItem } from '../types';
import { calculateResourceLoad } from '../utils/resourcePlanning';
import clsx from 'clsx';

interface EnhancedResourceTimelineProps {
    projects: Project[];
    resources: ResourcePoolItem[];
    onProjectClick?: (projectId: string) => void;
}

type Granularity = 'day' | 'week' | 'month' | 'quarter';

const EnhancedResourceTimeline: React.FC<EnhancedResourceTimelineProps> = ({
    projects,
    resources,
    onProjectClick
}) => {
    const [granularity, setGranularity] = useState<Granularity>('month');
    const [page, setPage] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Configuration based on granularity
    const config = useMemo(() => {
        switch (granularity) {
            case 'day': return { count: 30, width: 40, format: 'dd' };
            case 'week': return { count: 12, width: 100, format: "'W'w" };
            case 'month': return { count: 12, width: 120, format: 'MMM yyyy' };
            case 'quarter': return { count: 4, width: 150, format: "'Q'Q yyyy" };
        }
    }, [granularity]);

    // Actually, generateTimeBuckets generates from "now". We need to support navigation.
    // Let's modify the usage of generateTimeBuckets or implement a local version that supports start date offset.
    // For now, let's assume "now" is the anchor and we can't go back in time easily without modifying the util.
    // But wait, the util takes 'count'.

    // Let's use a custom bucket generator for navigation support
    const buckets = useMemo(() => {
        const now = new Date();
        let start = now;

        // Apply offset based on page
        if (page !== 0) {
            if (granularity === 'day') start = new Date(now.setDate(now.getDate() + page * config.count));
            else if (granularity === 'week') start = new Date(now.setDate(now.getDate() + page * config.count * 7));
            else if (granularity === 'month') start = new Date(now.setMonth(now.getMonth() + page * config.count));
            else if (granularity === 'quarter') start = new Date(now.setMonth(now.getMonth() + page * config.count * 3));
        }

        // We can use the existing util but we need to trick it or just rewrite the date generation here for flexibility
        // Let's rewrite simple date generation here to support pagination
        const dates: Date[] = [];
        let current = start;

        for (let i = 0; i < config.count; i++) {
            dates.push(new Date(current));
            if (granularity === 'day') current.setDate(current.getDate() + 1);
            else if (granularity === 'week') current.setDate(current.getDate() + 7);
            else if (granularity === 'month') current.setMonth(current.getMonth() + 1);
            else if (granularity === 'quarter') current.setMonth(current.getMonth() + 3);
        }

        return dates.map(date => ({
            date,
            label: format(date, config.format),
            fullLabel: format(date, 'yyyy-MM-dd')
        }));
    }, [granularity, page, config]);

    // Calculate loads for conflict detection
    const resourceLoads = useMemo(() => {
        return calculateResourceLoad(projects, resources, buckets, granularity);
    }, [projects, resources, buckets, granularity]);

    // Helper to check if a project is in a bucket
    const isProjectInBucket = (project: Project, bucketDate: Date) => {
        if (!project.startDate || !project.endDate) return false;
        const start = parseISO(project.startDate);
        const end = parseISO(project.endDate);

        let bucketStart, bucketEnd;
        if (granularity === 'day') {
            bucketStart = startOfDay(bucketDate);
            bucketEnd = endOfDay(bucketDate);
        } else if (granularity === 'week') {
            bucketStart = startOfWeek(bucketDate);
            bucketEnd = endOfWeek(bucketDate);
        } else if (granularity === 'month') {
            bucketStart = startOfMonth(bucketDate);
            bucketEnd = endOfMonth(bucketDate);
        } else {
            bucketStart = startOfQuarter(bucketDate);
            bucketEnd = endOfQuarter(bucketDate);
        }

        return start <= bucketEnd && end >= bucketStart;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-500 border-blue-600';
            case 'planning': return 'bg-purple-500 border-purple-600';
            case 'completed': return 'bg-green-500 border-green-600';
            case 'on-hold': return 'bg-gray-400 border-gray-500';
            default: return 'bg-slate-500 border-slate-600';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
            {/* Header Controls */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-800">资源时间线</h3>
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        {(['day', 'week', 'month', 'quarter'] as Granularity[]).map(g => (
                            <button
                                key={g}
                                onClick={() => { setGranularity(g); setPage(0); }}
                                className={clsx(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                    granularity === g ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {g === 'day' ? '日' : g === 'week' ? '周' : g === 'month' ? '月' : '季'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => p - 1)}
                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <span className="text-sm font-medium text-slate-600 min-w-[100px] text-center">
                        {buckets[0]?.label} - {buckets[buckets.length - 1]?.label}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 overflow-hidden flex flex-col" ref={scrollContainerRef}>
                {/* Header Row */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <div className="w-48 flex-shrink-0 p-3 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        资源名称
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        {buckets.map((bucket, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 border-r border-slate-200 p-2 text-center text-xs font-medium text-slate-600"
                                style={{ width: `${config.width}px` }}
                            >
                                {bucket.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resource Rows */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {resources.map((resource) => {
                        const load = resourceLoads.find(l => l.resourceId === resource.id);

                        return (
                            <div key={resource.id} className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                {/* Resource Info Column */}
                                <div className="w-48 flex-shrink-0 p-3 border-r border-slate-200 bg-white sticky left-0 z-10 group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="font-medium text-slate-900 text-sm truncate">{resource.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <span>容量: {resource.totalQuantity}</span>
                                        {resource.skills?.[0] && (
                                            <span className="bg-slate-100 px-1.5 rounded text-[10px]">{resource.skills[0].name}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline Cells */}
                                <div className="flex flex-1 relative">
                                    {/* Background Grid & Conflict Indicators */}
                                    <div className="absolute inset-0 flex">
                                        {buckets.map((bucket, i) => {
                                            const bucketLoad = load?.allocations[bucket.label];
                                            const totalAllocated = bucketLoad?.total || 0;
                                            const isOverloaded = totalAllocated > resource.totalQuantity;
                                            const utilization = resource.totalQuantity > 0 ? (totalAllocated / resource.totalQuantity) * 100 : 0;

                                            return (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        "flex-shrink-0 border-r border-slate-100 h-full relative transition-colors",
                                                        isOverloaded ? "bg-red-50/50" : ""
                                                    )}
                                                    style={{ width: `${config.width}px` }}
                                                >
                                                    {isOverloaded && (
                                                        <div className="absolute top-1 right-1 z-0">
                                                            <AlertTriangle size={12} className="text-red-500 opacity-50" />
                                                        </div>
                                                    )}
                                                    {/* Utilization Bar at bottom */}
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
                                                        <div
                                                            className={clsx(
                                                                "h-full transition-all",
                                                                isOverloaded ? "bg-red-500" : utilization > 80 ? "bg-yellow-500" : "bg-green-500"
                                                            )}
                                                            style={{ width: `${Math.min(utilization, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Project Bars Layer */}
                                    <div className="relative w-full h-16 pointer-events-none">
                                        {projects.filter(p =>
                                            (p.resourceRequirements || []).some(r => r.resourceId === resource.id) &&
                                            (isProjectInBucket(p, buckets[0].date) || isProjectInBucket(p, buckets[buckets.length - 1].date) || (parseISO(p.startDate) >= buckets[0].date && parseISO(p.endDate) <= buckets[buckets.length - 1].date))
                                        ).map((project, idx) => {
                                            // Calculate position
                                            const pStart = parseISO(project.startDate);
                                            const pEnd = parseISO(project.endDate);
                                            const timelineStart = buckets[0].date;
                                            const timelineEnd = buckets[buckets.length - 1].date;

                                            // Simple linear interpolation for position
                                            // This is a bit rough for 'month' view due to varying days, but good enough for visual
                                            const totalDuration = timelineEnd.getTime() - timelineStart.getTime();

                                            let leftPercent = ((pStart.getTime() - timelineStart.getTime()) / totalDuration) * 100;
                                            let widthPercent = ((pEnd.getTime() - pStart.getTime()) / totalDuration) * 100;

                                            // Clamp
                                            if (leftPercent < 0) {
                                                widthPercent += leftPercent;
                                                leftPercent = 0;
                                            }
                                            if (leftPercent + widthPercent > 100) {
                                                widthPercent = 100 - leftPercent;
                                            }

                                            if (widthPercent <= 0) return null;

                                            return (
                                                <div
                                                    key={project.id}
                                                    className={clsx(
                                                        "absolute h-6 rounded border shadow-sm flex items-center px-2 pointer-events-auto cursor-pointer hover:brightness-95 hover:z-20 transition-all",
                                                        getStatusColor(project.status)
                                                    )}
                                                    style={{
                                                        left: `${leftPercent}%`,
                                                        width: `${widthPercent}%`,
                                                        top: `${4 + (idx % 2) * 28}px`, // Stagger bars to avoid overlap
                                                        zIndex: 5
                                                    }}
                                                    onClick={() => onProjectClick?.(project.id)}
                                                    title={`${project.name} (${project.status})\n${project.startDate} - ${project.endDate}`}
                                                >
                                                    <span className="text-xs font-bold text-white truncate">{project.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend / Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-6 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span>超额分配警告</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>进行中项目</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>计划中项目</span>
                </div>
            </div>
        </div>
    );
};

export default EnhancedResourceTimeline;
