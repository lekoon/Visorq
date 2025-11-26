import type { Project, ResourcePoolItem } from '../types';
import { eachMonthOfInterval, format, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns';

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

export const generateTimeBuckets = (projects: Project[], months = 12): TimeBucket[] => {
    let start = startOfMonth(new Date());
    let end = addMonths(start, months);

    // If projects exist, try to fit them in, but ensure at least 'months' duration or cover the project range
    if (projects.length > 0) {
        const startDates = projects.map(p => p.startDate ? parseISO(p.startDate).getTime() : Infinity).filter(t => t !== Infinity);
        const endDates = projects.map(p => p.endDate ? parseISO(p.endDate).getTime() : -Infinity).filter(t => t !== -Infinity);

        if (startDates.length > 0) {
            const minDate = startOfMonth(new Date(Math.min(...startDates)));
            if (minDate < start) start = minDate;
        }

        if (endDates.length > 0) {
            const maxDate = endOfMonth(new Date(Math.max(...endDates)));
            if (maxDate > end) end = maxDate;
        }
    }

    return eachMonthOfInterval({ start, end }).map(date => ({
        label: format(date, 'MMM yyyy'),
        date
    }));
};

export const calculateResourceLoad = (
    projects: Project[],
    resources: ResourcePoolItem[],
    buckets: TimeBucket[]
): ResourceLoad[] => {
    return resources.map(res => {
        const allocations: ResourceLoad['allocations'] = {};

        buckets.forEach(bucket => {
            const bucketStart = startOfMonth(bucket.date);
            const bucketEnd = endOfMonth(bucket.date);

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
