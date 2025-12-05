import type { Task } from '../types';

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependency {
    fromTaskId: string;
    toTaskId: string;
    type: DependencyType;
    lag?: number; // 延迟天数，可为负数
}

/**
 * 检测任务依赖中的循环引用
 */
export const detectCircularDependency = (
    tasks: Task[],
    fromTaskId: string,
    toTaskId: string
): boolean => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
        if (recursionStack.has(taskId)) return true;
        if (visited.has(taskId)) return false;

        visited.add(taskId);
        recursionStack.add(taskId);

        const task = tasks.find(t => t.id === taskId);
        if (task?.dependencies) {
            for (const depId of task.dependencies) {
                if (hasCycle(depId)) return true;
            }
        }

        recursionStack.delete(taskId);
        return false;
    };

    // 临时添加新依赖来检测
    const tempTask = tasks.find(t => t.id === toTaskId);
    if (!tempTask) return false;

    const originalDeps = tempTask.dependencies || [];
    tempTask.dependencies = [...originalDeps, fromTaskId];

    const result = hasCycle(toTaskId);

    // 恢复原始依赖
    tempTask.dependencies = originalDeps;

    return result;
};

/**
 * 计算任务的拓扑排序（用于确定任务执行顺序）
 */
export const topologicalSort = (tasks: Task[]): Task[] => {
    const sorted: Task[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (taskId: string): boolean => {
        if (temp.has(taskId)) return false; // 检测到循环
        if (visited.has(taskId)) return true;

        temp.add(taskId);

        const task = tasks.find(t => t.id === taskId);
        if (task?.dependencies) {
            for (const depId of task.dependencies) {
                if (!visit(depId)) return false;
            }
        }

        temp.delete(taskId);
        visited.add(taskId);
        if (task) sorted.push(task);

        return true;
    };

    for (const task of tasks) {
        if (!visited.has(task.id)) {
            if (!visit(task.id)) {
                console.error('Circular dependency detected');
                return tasks; // 返回原始顺序
            }
        }
    }

    return sorted.reverse();
};

/**
 * 计算关键路径（CPM - Critical Path Method）
 */
export const calculateCriticalPath = (tasks: Task[]): {
    criticalPath: string[];
    earliestStart: Record<string, Date>;
    latestStart: Record<string, Date>;
    slack: Record<string, number>;
} => {
    const earliestStart: Record<string, Date> = {};
    const earliestFinish: Record<string, Date> = {};
    const latestStart: Record<string, Date> = {};
    const latestFinish: Record<string, Date> = {};
    const slack: Record<string, number> = {};

    // 前向计算（最早开始时间）
    const sortedTasks = topologicalSort(tasks);

    for (const task of sortedTasks) {
        const taskStart = task.startDate ? new Date(task.startDate) : new Date();
        const taskEnd = task.endDate ? new Date(task.endDate) : new Date();
        const duration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));

        if (!task.dependencies || task.dependencies.length === 0) {
            earliestStart[task.id] = taskStart;
        } else {
            let maxFinish = taskStart;
            for (const depId of task.dependencies) {
                const depFinish = earliestFinish[depId];
                if (depFinish && depFinish > maxFinish) {
                    maxFinish = depFinish;
                }
            }
            earliestStart[task.id] = maxFinish;
        }

        earliestFinish[task.id] = new Date(earliestStart[task.id].getTime() + duration * 24 * 60 * 60 * 1000);
    }

    // 反向计算（最晚开始时间）
    const projectEnd = new Date(Math.max(...Object.values(earliestFinish).map(d => d.getTime())));

    for (let i = sortedTasks.length - 1; i >= 0; i--) {
        const task = sortedTasks[i];
        const taskStart = task.startDate ? new Date(task.startDate) : new Date();
        const taskEnd = task.endDate ? new Date(task.endDate) : new Date();
        const duration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));

        // 找到所有依赖此任务的任务
        const dependents = sortedTasks.filter(t => t.dependencies?.includes(task.id));

        if (dependents.length === 0) {
            latestFinish[task.id] = projectEnd;
        } else {
            let minStart = projectEnd;
            for (const dep of dependents) {
                const depStart = latestStart[dep.id];
                if (depStart && depStart < minStart) {
                    minStart = depStart;
                }
            }
            latestFinish[task.id] = minStart;
        }

        latestStart[task.id] = new Date(latestFinish[task.id].getTime() - duration * 24 * 60 * 60 * 1000);
        slack[task.id] = Math.ceil((latestStart[task.id].getTime() - earliestStart[task.id].getTime()) / (1000 * 60 * 60 * 24));
    }

    // 找出关键路径（slack = 0 的任务）
    const criticalPath = sortedTasks
        .filter(task => slack[task.id] === 0)
        .map(task => task.id);

    return {
        criticalPath,
        earliestStart,
        latestStart,
        slack
    };
};

/**
 * 根据依赖关系自动调整任务日期
 */
export const adjustTaskDates = (tasks: Task[]): Task[] => {
    const { earliestStart } = calculateCriticalPath(tasks);

    return tasks.map(task => {
        const newStart = earliestStart[task.id];
        if (!newStart || !task.startDate || !task.endDate) return task;

        const originalStart = new Date(task.startDate);
        const originalEnd = new Date(task.endDate);
        const duration = originalEnd.getTime() - originalStart.getTime();

        return {
            ...task,
            startDate: newStart.toISOString().split('T')[0],
            endDate: new Date(newStart.getTime() + duration).toISOString().split('T')[0]
        };
    });
};

/**
 * 获取任务的所有前置任务（递归）
 */
export const getAllPredecessors = (taskId: string, tasks: Task[]): string[] => {
    const task = tasks.find(t => t.id === taskId);
    if (!task?.dependencies) return [];

    const predecessors = new Set<string>(task.dependencies);

    for (const depId of task.dependencies) {
        const subPredecessors = getAllPredecessors(depId, tasks);
        subPredecessors.forEach(id => predecessors.add(id));
    }

    return Array.from(predecessors);
};

/**
 * 获取任务的所有后续任务（递归）
 */
export const getAllSuccessors = (taskId: string, tasks: Task[]): string[] => {
    const successors = new Set<string>();

    const findSuccessors = (id: string) => {
        const dependents = tasks.filter(t => t.dependencies?.includes(id));
        for (const dep of dependents) {
            if (!successors.has(dep.id)) {
                successors.add(dep.id);
                findSuccessors(dep.id);
            }
        }
    };

    findSuccessors(taskId);
    return Array.from(successors);
};
