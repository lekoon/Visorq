import type { Project, ResourcePoolItem, ResourceConflict } from '../types';
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, addMonths } from 'date-fns';

/**
 * 检测资源冲突
 * 分析所有项目的资源需求，识别超额分配的资源
 */
export const detectResourceConflicts = (
    projects: Project[],
    resources: ResourcePoolItem[]
): ResourceConflict[] => {
    const conflicts: ResourceConflict[] = [];

    // 生成时间范围（未来12个月）
    const now = new Date();
    const start = startOfMonth(now);
    const end = addMonths(start, 12);
    const months = eachMonthOfInterval({ start, end });

    // 对每个资源和每个月进行检查
    resources.forEach(resource => {
        months.forEach(monthDate => {
            const monthLabel = format(monthDate, 'yyyy-MM');

            // 计算该月该资源的分配情况
            const allocations: { projectId: string; projectName: string; allocation: number }[] = [];
            let totalAllocated = 0;

            projects.forEach(project => {
                if (!project.startDate || !project.endDate || project.status === 'completed') return;

                const projectStart = parseISO(project.startDate);
                const projectEnd = parseISO(project.endDate);

                // 检查项目是否在该月内
                const overlaps = isWithinInterval(monthDate, { start: projectStart, end: projectEnd });
                if (!overlaps) return;

                // 查找该资源的需求
                const requirement = project.resourceRequirements.find(req => req.resourceId === resource.id);
                if (!requirement) return;

                // 计算该资源在该月的分配量
                const allocation = requirement.count;

                // 考虑资源的持续时间
                let durationInMonths = requirement.duration;
                if (requirement.unit === 'day') durationInMonths = requirement.duration / 30;
                if (requirement.unit === 'year') durationInMonths = requirement.duration * 12;

                const reqEnd = addMonths(projectStart, durationInMonths);

                // 只有在资源需求期间内才计入
                if (isWithinInterval(monthDate, { start: projectStart, end: reqEnd })) {
                    allocations.push({
                        projectId: project.id,
                        projectName: project.name,
                        allocation
                    });
                    totalAllocated += allocation;
                }
            });

            // 检查是否超额分配
            if (totalAllocated > resource.totalQuantity) {
                conflicts.push({
                    resourceId: resource.id,
                    resourceName: resource.name,
                    period: monthLabel,
                    capacity: resource.totalQuantity,
                    allocated: totalAllocated,
                    overallocation: totalAllocated - resource.totalQuantity,
                    conflictingProjects: allocations
                });
            }
        });
    });

    return conflicts;
};

/**
 * 检查特定项目的资源需求是否会导致冲突
 */
export const checkProjectResourceConflicts = (
    newProject: Partial<Project>,
    existingProjects: Project[],
    resources: ResourcePoolItem[]
): ResourceConflict[] => {
    // 创建临时项目列表包含新项目
    const tempProjects = [
        ...existingProjects,
        {
            ...newProject,
            id: 'temp-project',
            name: newProject.name || 'New Project',
            status: newProject.status || 'planning'
        } as Project
    ];

    return detectResourceConflicts(tempProjects, resources);
};

/**
 * 获取资源在特定时间段的可用容量
 */
export const getResourceAvailability = (
    resourceId: string,
    startDate: string,
    endDate: string,
    projects: Project[],
    resources: ResourcePoolItem[]
): { month: string; available: number; capacity: number }[] => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return [];

    const start = startOfMonth(parseISO(startDate));
    const end = endOfMonth(parseISO(endDate));
    const months = eachMonthOfInterval({ start, end });

    return months.map(monthDate => {
        const monthLabel = format(monthDate, 'yyyy-MM');
        let allocated = 0;

        projects.forEach(project => {
            if (!project.startDate || !project.endDate || project.status === 'completed') return;

            const projectStart = parseISO(project.startDate);
            const projectEnd = parseISO(project.endDate);

            if (isWithinInterval(monthDate, { start: projectStart, end: projectEnd })) {
                const requirement = project.resourceRequirements.find(req => req.resourceId === resourceId);
                if (requirement) {
                    let durationInMonths = requirement.duration;
                    if (requirement.unit === 'day') durationInMonths = requirement.duration / 30;
                    if (requirement.unit === 'year') durationInMonths = requirement.duration * 12;

                    const reqEnd = addMonths(projectStart, durationInMonths);
                    if (isWithinInterval(monthDate, { start: projectStart, end: reqEnd })) {
                        allocated += requirement.count;
                    }
                }
            }
        });

        return {
            month: monthLabel,
            available: resource.totalQuantity - allocated,
            capacity: resource.totalQuantity
        };
    });
};
