import type { Project, ResourcePoolItem } from '../types';
import {
    eachDayOfInterval,
    startOfDay,
    endOfDay,
    addDays,
    eachMonthOfInterval,
    eachWeekOfInterval,
    eachQuarterOfInterval,
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    addMonths,
    startOfWeek,
    endOfWeek,
    addWeeks,
    startOfQuarter,
    endOfQuarter,
    addQuarters
} from 'date-fns';

export type TimeBucket = {
    label: string;
    date: Date;
};

export type ResourceLoad = {
    resourceId: string;
    resourceName: string;
    capacity: number;
    allocations: Record<string, {
        active: number;
        planning: number;
        total: number;
        projects: { id: string; name: string; amount: number; status: string }[];
    }>;
};

export const generateTimeBuckets = (
    projects: Project[],
    count = 12,
    interval: 'day' | 'week' | 'month' | 'quarter' = 'month'
): TimeBucket[] => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (interval === 'day') {
        start = startOfDay(now);
        end = addDays(start, count);
    } else if (interval === 'week') {
        start = startOfWeek(now);
        end = addWeeks(start, count);
    } else if (interval === 'quarter') {
        start = startOfQuarter(now);
        end = addQuarters(start, count);
    } else {
        start = startOfMonth(now);
        end = addMonths(start, count);
    }

    // If projects exist, extend range if needed, but respect the requested granularity
    if (projects.length > 0) {
        const startDates = projects.map(p => p.startDate ? parseISO(p.startDate).getTime() : Infinity).filter(t => t !== Infinity);
        const endDates = projects.map(p => p.endDate ? parseISO(p.endDate).getTime() : -Infinity).filter(t => t !== -Infinity);

        if (startDates.length > 0) {
            const minDate = new Date(Math.min(...startDates));
            let adjustedMin: Date;
            if (interval === 'day') adjustedMin = startOfDay(minDate);
            else if (interval === 'week') adjustedMin = startOfWeek(minDate);
            else if (interval === 'quarter') adjustedMin = startOfQuarter(minDate);
            else adjustedMin = startOfMonth(minDate);

            if (adjustedMin < start) start = adjustedMin;
        }

        if (endDates.length > 0) {
            const maxDate = new Date(Math.max(...endDates));
            let adjustedMax: Date;
            if (interval === 'day') adjustedMax = endOfDay(maxDate);
            else if (interval === 'week') adjustedMax = endOfWeek(maxDate);
            else if (interval === 'quarter') adjustedMax = endOfQuarter(maxDate);
            else adjustedMax = endOfMonth(maxDate);

            if (adjustedMax > end) end = adjustedMax;
        }
    }

    let dates: Date[];
    let dateFormat: string;

    if (interval === 'day') {
        dates = eachDayOfInterval({ start, end });
        dateFormat = 'MM-dd';
    } else if (interval === 'week') {
        dates = eachWeekOfInterval({ start, end });
        dateFormat = "'W'w yyyy"; // e.g., W42 2023
    } else if (interval === 'quarter') {
        dates = eachQuarterOfInterval({ start, end });
        dateFormat = "'Q'Q yyyy"; // e.g., Q4 2023
    } else {
        dates = eachMonthOfInterval({ start, end });
        dateFormat = 'MMM yyyy';
    }

    return dates.slice(0, count).map(date => ({
        label: format(date, dateFormat),
        date
    }));
};

export const calculateResourceLoad = (
    projects: Project[],
    resources: ResourcePoolItem[],
    buckets: TimeBucket[],
    interval: 'day' | 'week' | 'month' | 'quarter' = 'month'
): ResourceLoad[] => {
    return resources.map(res => {
        const allocations: ResourceLoad['allocations'] = {};

        buckets.forEach(bucket => {
            let bucketStart: Date;
            let bucketEnd: Date;

            if (interval === 'day') {
                bucketStart = startOfDay(bucket.date);
                bucketEnd = endOfDay(bucket.date);
            } else if (interval === 'week') {
                bucketStart = startOfWeek(bucket.date);
                bucketEnd = endOfWeek(bucket.date);
            } else if (interval === 'quarter') {
                bucketStart = startOfQuarter(bucket.date);
                bucketEnd = endOfQuarter(bucket.date);
            } else {
                bucketStart = startOfMonth(bucket.date);
                bucketEnd = endOfMonth(bucket.date);
            }

            let activeLoad = 0;
            let planningLoad = 0;
            const contributingProjects: { id: string; name: string; amount: number; status: string }[] = [];

            projects.forEach(p => {
                if (!p.startDate || !p.endDate) return;

                // Check if project overlaps with this bucket
                const pStart = parseISO(p.startDate);

                const req = p.resourceRequirements.find(r => r.resourceId === res.id);
                if (req) {
                    // Calculate resource specific end date
                    let durationInMonths = req.duration;
                    if (req.unit === 'day') durationInMonths = req.duration / 30;
                    if (req.unit === 'year') durationInMonths = req.duration * 12;

                    const reqEnd = addMonths(pStart, durationInMonths);

                    // Check overlap with specific resource duration
                    const overlaps = (pStart <= bucketEnd && reqEnd >= bucketStart);

                    if (overlaps) {
                        if (p.status === 'active') {
                            activeLoad += req.count;
                        } else if (p.status === 'planning') {
                            planningLoad += req.count;
                        }
                        contributingProjects.push({
                            id: p.id,
                            name: p.name,
                            amount: req.count,
                            status: p.status
                        });
                    }
                }
            });

            allocations[bucket.label] = {
                active: activeLoad,
                planning: planningLoad,
                total: activeLoad + planningLoad,
                projects: contributingProjects
            };
        });

        return {
            resourceId: res.id,
            resourceName: res.name,
            capacity: res.totalQuantity,
            allocations
        };
    });
};

/**
 * Detect resource conflicts based on calculated load
 */
export const detectResourceConflicts = (
    resourceLoads: ResourceLoad[]
): import('../types').ResourceConflict[] => {
    const conflicts: import('../types').ResourceConflict[] = [];

    resourceLoads.forEach(load => {
        Object.entries(load.allocations).forEach(([period, data]) => {
            if (data.total > load.capacity) {
                conflicts.push({
                    resourceId: load.resourceId,
                    resourceName: load.resourceName,
                    period,
                    capacity: load.capacity,
                    allocated: data.total,
                    overallocation: data.total - load.capacity,
                    conflictingProjects: data.projects.map(p => ({
                        projectId: p.id,
                        projectName: p.name,
                        allocation: p.amount
                    }))
                });
            }
        });
    });

    return conflicts.sort((a, b) => b.overallocation - a.overallocation);
};

/**
 * Calculate skill match score between requirement and resource
 */
export const calculateSkillMatchScore = (
    requiredSkills: string[],
    resourceSkills: import('../types').Skill[] = []
): { score: number; matched: string[]; missing: string[] } => {
    if (!requiredSkills || requiredSkills.length === 0) {
        return { score: 100, matched: [], missing: [] };
    }

    if (!resourceSkills || resourceSkills.length === 0) {
        return { score: 0, matched: [], missing: requiredSkills };
    }

    const matched: string[] = [];
    const missing: string[] = [];

    requiredSkills.forEach(reqSkillId => {
        const hasSkill = resourceSkills.some(s => s.id === reqSkillId);
        if (hasSkill) {
            matched.push(reqSkillId);
        } else {
            missing.push(reqSkillId);
        }
    });

    const score = (matched.length / requiredSkills.length) * 100;

    return { score, matched, missing };
};

/**
 * Find best matching resources for a requirement
 */
export const findBestMatchingResources = (
    requirement: import('../types').ResourceRequirement,
    resources: ResourcePoolItem[]
): { resource: ResourcePoolItem; match: ReturnType<typeof calculateSkillMatchScore> }[] => {
    return resources
        .map(resource => ({
            resource,
            match: calculateSkillMatchScore(requirement.requiredSkills || [], resource.skills)
        }))
        .sort((a, b) => b.match.score - a.match.score);
};
