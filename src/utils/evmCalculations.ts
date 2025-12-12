import { differenceInDays } from 'date-fns';
import type { Project, Task, EVMMetrics } from '../types';

/**
 * Calculate Earned Value Management (EVM) metrics for a project
 */
export function calculateEVM(project: Project): EVMMetrics {
    const today = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    // Calculate time-based progress
    const totalDuration = differenceInDays(endDate, startDate);
    const elapsedDuration = differenceInDays(today, startDate);
    const timeProgress = Math.min(Math.max(elapsedDuration / totalDuration, 0), 1);

    // Budget values
    const budget = project.budget || project.totalBudget || 0;
    const actualCost = project.actualCost || project.budgetUsed || 0;

    // Planned Value (PV) - What we planned to accomplish by now
    const plannedValue = budget * timeProgress;

    // Earned Value (EV) - What we actually accomplished (based on progress)
    const progress = (project.progress || 0) / 100;
    const earnedValue = budget * progress;

    // Actual Cost (AC) - What we actually spent
    const actualCostValue = actualCost;

    // Schedule Performance Index (SPI) = EV / PV
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;

    // Cost Performance Index (CPI) = EV / AC
    const costPerformanceIndex = actualCostValue > 0 ? earnedValue / actualCostValue : 1;

    // Schedule Variance (SV) = EV - PV
    const scheduleVariance = earnedValue - plannedValue;

    // Cost Variance (CV) = EV - AC
    const costVariance = earnedValue - actualCostValue;

    // Estimate at Completion (EAC)
    // Using formula: EAC = BAC / CPI (assumes current performance continues)
    const estimateAtCompletion = costPerformanceIndex > 0
        ? budget / costPerformanceIndex
        : budget;

    // Estimate to Complete (ETC) = EAC - AC
    const estimateToComplete = estimateAtCompletion - actualCostValue;

    // Variance at Completion (VAC) = BAC - EAC
    const varianceAtCompletion = budget - estimateAtCompletion;

    // To-Complete Performance Index (TCPI)
    // TCPI = (BAC - EV) / (BAC - AC)
    const remainingWork = budget - earnedValue;
    const remainingBudget = budget - actualCostValue;
    const toCompletePerformanceIndex = remainingBudget > 0
        ? remainingWork / remainingBudget
        : 1;

    return {
        projectId: project.id,
        asOfDate: today.toISOString(),
        plannedValue,
        earnedValue,
        actualCost: actualCostValue,
        schedulePerformanceIndex,
        costPerformanceIndex,
        scheduleVariance,
        costVariance,
        estimateAtCompletion,
        estimateToComplete,
        varianceAtCompletion,
        toCompletePerformanceIndex
    };
}

/**
 * Generate EVM data points for S-Curve visualization
 */
export function generateEVMTimeSeries(project: Project, dataPoints: number = 10): {
    date: string;
    pv: number;
    ev: number;
    ac: number;
}[] {
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const today = new Date();

    const totalDuration = differenceInDays(endDate, startDate);
    const budget = project.budget || project.totalBudget || 0;
    const currentProgress = (project.progress || 0) / 100;
    const actualCost = project.actualCost || project.budgetUsed || 0;

    const series: { date: string; pv: number; ev: number; ac: number }[] = [];

    // Generate data points from start to end
    for (let i = 0; i <= dataPoints; i++) {
        const ratio = i / dataPoints;
        const daysFromStart = Math.floor(totalDuration * ratio);
        const pointDate = new Date(startDate);
        pointDate.setDate(pointDate.getDate() + daysFromStart);

        // Only include points up to today for actual values
        const isInPast = pointDate <= today;

        // Planned Value (linear progression)
        const pv = budget * ratio;

        // Earned Value (S-curve approximation based on current progress)
        let ev = 0;
        if (isInPast) {
            // Use S-curve formula: EV = BAC * (1 - e^(-k*t))
            // Simplified: assume linear for now, but scaled by current progress
            const progressAtPoint = Math.min(ratio / (differenceInDays(today, startDate) / totalDuration) * currentProgress, currentProgress);
            ev = budget * progressAtPoint;
        }

        // Actual Cost (assume proportional to EV with some variance)
        let ac = 0;
        if (isInPast) {
            const costRatio = ev / (budget * currentProgress || 1);
            ac = actualCost * costRatio;
        }

        series.push({
            date: pointDate.toISOString().split('T')[0],
            pv: Math.round(pv),
            ev: Math.round(ev),
            ac: Math.round(ac)
        });
    }

    return series;
}

/**
 * Get EVM performance status
 */
export function getEVMStatus(metrics: EVMMetrics): {
    scheduleStatus: 'ahead' | 'on-track' | 'behind';
    costStatus: 'under-budget' | 'on-budget' | 'over-budget';
    overallHealth: 'good' | 'warning' | 'critical';
} {
    // Schedule Status (based on SPI)
    let scheduleStatus: 'ahead' | 'on-track' | 'behind';
    if (metrics.schedulePerformanceIndex >= 1.05) scheduleStatus = 'ahead';
    else if (metrics.schedulePerformanceIndex >= 0.95) scheduleStatus = 'on-track';
    else scheduleStatus = 'behind';

    // Cost Status (based on CPI)
    let costStatus: 'under-budget' | 'on-budget' | 'over-budget';
    if (metrics.costPerformanceIndex >= 1.05) costStatus = 'under-budget';
    else if (metrics.costPerformanceIndex >= 0.95) costStatus = 'on-budget';
    else costStatus = 'over-budget';

    // Overall Health
    let overallHealth: 'good' | 'warning' | 'critical';
    if (metrics.schedulePerformanceIndex >= 0.95 && metrics.costPerformanceIndex >= 0.95) {
        overallHealth = 'good';
    } else if (metrics.schedulePerformanceIndex >= 0.85 && metrics.costPerformanceIndex >= 0.85) {
        overallHealth = 'warning';
    } else {
        overallHealth = 'critical';
    }

    return { scheduleStatus, costStatus, overallHealth };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
    if (value >= 10000) {
        return `¥${(value / 10000).toFixed(1)}万`;
    }
    return `¥${value.toLocaleString()}`;
}

/**
 * Format performance index for display
 */
export function formatPerformanceIndex(value: number): string {
    return value.toFixed(2);
}

/**
 * Get performance index color
 */
export function getPerformanceIndexColor(value: number): string {
    if (value >= 1.05) return 'text-green-600 dark:text-green-400';
    if (value >= 0.95) return 'text-blue-600 dark:text-blue-400';
    if (value >= 0.85) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}
