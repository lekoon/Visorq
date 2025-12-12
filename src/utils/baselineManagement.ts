import { differenceInDays } from 'date-fns';
import type {
    Project,
    ProjectBaseline,
    VarianceMetrics,
    Task
} from '../types';

/**
 * Create a baseline snapshot of the current project state
 */
export function createBaseline(
    project: Project,
    name: string,
    description: string,
    userId: string,
    userName: string
): ProjectBaseline {
    return {
        id: `baseline-${Date.now()}`,
        name,
        description,
        createdDate: new Date().toISOString(),
        createdBy: userId,
        createdByName: userName,
        snapshot: {
            startDate: project.startDate,
            endDate: project.endDate,
            budget: project.budget || 0,
            tasks: project.tasks ? JSON.parse(JSON.stringify(project.tasks)) : [],
            milestones: project.milestones ? JSON.parse(JSON.stringify(project.milestones)) : [],
            resourceRequirements: project.resourceRequirements ? JSON.parse(JSON.stringify(project.resourceRequirements)) : [],
        }
    };
}

/**
 * Calculate variance metrics between current project state and a baseline
 */
export function calculateVariance(
    currentProject: Project,
    baseline: ProjectBaseline
): VarianceMetrics {
    const baselineSnapshot = baseline.snapshot;

    // Schedule Variance (in days)
    const startDateVariance = differenceInDays(
        new Date(currentProject.startDate),
        new Date(baselineSnapshot.startDate)
    );

    const endDateVariance = differenceInDays(
        new Date(currentProject.endDate),
        new Date(baselineSnapshot.endDate)
    );

    // Overall schedule variance (using end date as primary indicator)
    const scheduleVariance = endDateVariance;

    // Cost Variance
    const currentBudget = currentProject.budget || 0;
    const baselineBudget = baselineSnapshot.budget;
    const costVariance = currentBudget - baselineBudget;
    const budgetVariancePercent = baselineBudget > 0
        ? (costVariance / baselineBudget) * 100
        : 0;

    return {
        scheduleVariance,
        costVariance,
        startDateVariance,
        endDateVariance,
        budgetVariancePercent
    };
}

/**
 * Get variance status indicator
 */
export function getVarianceStatus(variance: number, threshold: number = 10): 'good' | 'warning' | 'critical' {
    const absVariance = Math.abs(variance);
    if (absVariance <= threshold * 0.5) return 'good';
    if (absVariance <= threshold) return 'warning';
    return 'critical';
}

/**
 * Format variance for display
 */
export function formatVariance(variance: number, unit: 'days' | 'currency' | 'percent'): string {
    const sign = variance > 0 ? '+' : '';

    switch (unit) {
        case 'days':
            return `${sign}${variance} 天`;
        case 'currency':
            return `${sign}¥${variance.toLocaleString()}`;
        case 'percent':
            return `${sign}${variance.toFixed(1)}%`;
        default:
            return `${sign}${variance}`;
    }
}

/**
 * Compare task lists between current and baseline
 */
export function compareTaskLists(
    currentTasks: Task[],
    baselineTasks: Task[]
): {
    added: Task[];
    removed: Task[];
    modified: Task[];
    unchanged: Task[];
} {
    const baselineTaskMap = new Map(baselineTasks.map(t => [t.id, t]));
    const currentTaskMap = new Map(currentTasks.map(t => [t.id, t]));

    const added: Task[] = [];
    const removed: Task[] = [];
    const modified: Task[] = [];
    const unchanged: Task[] = [];

    // Find added and modified tasks
    currentTasks.forEach(currentTask => {
        const baselineTask = baselineTaskMap.get(currentTask.id);
        if (!baselineTask) {
            added.push(currentTask);
        } else {
            // Check if task has been modified
            const isModified =
                currentTask.startDate !== baselineTask.startDate ||
                currentTask.endDate !== baselineTask.endDate ||
                currentTask.name !== baselineTask.name;

            if (isModified) {
                modified.push(currentTask);
            } else {
                unchanged.push(currentTask);
            }
        }
    });

    // Find removed tasks
    baselineTasks.forEach(baselineTask => {
        if (!currentTaskMap.has(baselineTask.id)) {
            removed.push(baselineTask);
        }
    });

    return { added, removed, modified, unchanged };
}

/**
 * Get the active baseline for a project
 */
export function getActiveBaseline(project: Project): ProjectBaseline | null {
    if (!project.baselines || project.baselines.length === 0) {
        return null;
    }

    if (project.activeBaselineId) {
        return project.baselines.find(b => b.id === project.activeBaselineId) || null;
    }

    // Return the most recent baseline if no active one is set
    return project.baselines[project.baselines.length - 1];
}
