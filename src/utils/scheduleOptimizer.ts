import { addDays, differenceInDays, parseISO, format } from 'date-fns';
import type { Task, Project, ResourcePoolItem } from '../types';
import { calculateCriticalPath } from './taskDependency';

interface OptimizationResult {
    optimizedTasks: Task[];
    changes: {
        taskId: string;
        taskName: string;
        originalStart: string;
        newStart: string;
        delay: number;
        reason: string;
    }[];
    metrics: {
        originalDuration: number;
        newDuration: number;
        conflictsResolved: number;
        resourcePeakReduced: number;
    };
}

/**
 * 检查特定日期的资源使用情况
 */
const checkResourceUsage = (
    date: Date,
    tasks: Task[],
    resourceId: string
): number => {
    let usage = 0;
    const dateStr = format(date, 'yyyy-MM-dd');

    tasks.forEach(task => {
        // 简化的资源分配检查：假设 assignee 就是 resourceId
        // 实际项目中可能需要更复杂的 ResourceRequirement 匹配
        if (task.assignee === resourceId && task.startDate <= dateStr && task.endDate >= dateStr) {
            usage += 1; // 假设每个任务占用1个单位资源
        }
    });

    return usage;
};

/**
 * 智能调度优化器
 */
export const optimizeSchedule = (
    project: Project,
    tasks: Task[],
    resourcePool: ResourcePoolItem[],
    strategy: 'smoothing' | 'leveling' = 'smoothing'
): OptimizationResult => {
    // 1. 深度克隆任务以避免直接修改
    let currentTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
    const originalTasksMap = new Map(tasks.map(t => [t.id, t]));
    const changes: OptimizationResult['changes'] = [];

    // 2. 计算初始关键路径和浮动时间
    const initialCriticalPath = calculateCriticalPath(currentTasks);
    const projectStartDate = new Date(Math.min(...currentTasks.map(t => new Date(t.startDate).getTime())));
    const originalEndDate = new Date(Math.max(...currentTasks.map(t => new Date(t.endDate).getTime())));
    const originalDuration = differenceInDays(originalEndDate, projectStartDate);

    let conflictsResolved = 0;
    let maxPeakReduction = 0;

    // 3. 按时间顺序和优先级排序任务
    // 拓扑排序已经在 calculateCriticalPath 中隐式处理，这里我们按开始时间排序
    currentTasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // 4. 遍历每一天，检查资源冲突
    const processedTasks = new Set<string>();
    let currentProjectEndDate = originalEndDate;

    // 模拟的时间范围：从项目开始到当前预计结束时间（可能会延长）
    let currentDate = new Date(projectStartDate);

    // 为了防止无限循环，设置一个最大迭代天数
    const maxDays = originalDuration * 2 + 365;
    let dayCount = 0;

    while (dayCount < maxDays) {
        if (currentDate > currentProjectEndDate && strategy === 'smoothing') break;
        if (processedTasks.size === currentTasks.length && currentDate > currentProjectEndDate) break;

        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // 检查每个资源
        resourcePool.forEach(resource => {
            const capacity = resource.totalQuantity;

            // 找出当天使用该资源的所有任务
            const activeTasks = currentTasks.filter(t =>
                t.assignee === resource.id &&
                t.startDate <= dateStr &&
                t.endDate >= dateStr
            );

            if (activeTasks.length > capacity) {
                // 发现冲突！
                const overload = activeTasks.length - capacity;
                maxPeakReduction = Math.max(maxPeakReduction, overload);

                // 策略：优先移动非关键路径任务，或优先级低的任务
                // 排序：非关键 > 关键，低优先级 > 高优先级，工期短 > 工期长
                activeTasks.sort((a, b) => {
                    const aIsCritical = initialCriticalPath.criticalPath.includes(a.id);
                    const bIsCritical = initialCriticalPath.criticalPath.includes(b.id);

                    if (aIsCritical !== bIsCritical) return aIsCritical ? 1 : -1; // 非关键排前面

                    // 优先级比较 (P0 > P1 > P2)
                    const priorityScore = { P0: 3, P1: 2, P2: 1 };
                    const pA = priorityScore[a.priority] || 0;
                    const pB = priorityScore[b.priority] || 0;
                    if (pA !== pB) return pA - pB; // 低优先级排前面

                    return 0;
                });

                // 尝试移动任务
                let resolvedCount = 0;
                for (const task of activeTasks) {
                    if (resolvedCount >= overload) break;

                    const slack = initialCriticalPath.slack[task.id] || 0;
                    const isCritical = initialCriticalPath.criticalPath.includes(task.id);

                    // 资源平滑：只利用浮动时间，不推迟项目结束
                    if (strategy === 'smoothing') {
                        if (slack > 0) {
                            // 尝试推迟 1 天
                            const newStart = addDays(parseISO(task.startDate), 1);
                            const newEnd = addDays(parseISO(task.endDate), 1);

                            // 更新任务时间
                            task.startDate = format(newStart, 'yyyy-MM-dd');
                            task.endDate = format(newEnd, 'yyyy-MM-dd');

                            // 记录变更
                            // 注意：这里简化了，实际上需要递归更新所有后置任务
                            // 在完整实现中，需要调用 updateSuccessors

                            resolvedCount++;
                            conflictsResolved++;
                        }
                    }
                    // 资源平衡：可以推迟任务，甚至延长项目
                    else if (strategy === 'leveling') {
                        // 强制推迟 1 天
                        const newStart = addDays(parseISO(task.startDate), 1);
                        const newEnd = addDays(parseISO(task.endDate), 1);

                        task.startDate = format(newStart, 'yyyy-MM-dd');
                        task.endDate = format(newEnd, 'yyyy-MM-dd');

                        // 如果推迟了关键任务，项目结束时间也会推迟
                        if (newEnd > currentProjectEndDate) {
                            currentProjectEndDate = newEnd;
                        }

                        resolvedCount++;
                        conflictsResolved++;
                    }
                }
            }
        });

        currentDate = addDays(currentDate, 1);
        dayCount++;
    }

    // 5. 整理变更记录
    currentTasks.forEach(newTask => {
        const original = originalTasksMap.get(newTask.id);
        if (original && original.startDate !== newTask.startDate) {
            const delay = differenceInDays(parseISO(newTask.startDate), parseISO(original.startDate));
            changes.push({
                taskId: newTask.id,
                taskName: newTask.name,
                originalStart: original.startDate,
                newStart: newTask.startDate,
                delay,
                reason: strategy === 'smoothing' ? '资源平滑（利用浮动时间）' : '资源平衡（解决冲突）'
            });
        }
    });

    const newDuration = differenceInDays(currentProjectEndDate, projectStartDate);

    return {
        optimizedTasks: currentTasks,
        changes,
        metrics: {
            originalDuration,
            newDuration,
            conflictsResolved,
            resourcePeakReduced: maxPeakReduction
        }
    };
};
