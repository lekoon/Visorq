import { differenceInDays } from 'date-fns';
import type {
    Project,
    RAGStatus,
    ProjectHealthIndicators,
    PortfolioMetrics
} from '../types';

/**
 * Calculate RAG (Red-Amber-Green) status for schedule health
 */
export function calculateScheduleHealth(project: Project): RAGStatus {
    if (!project.endDate) return 'amber';

    const today = new Date();
    const endDate = new Date(project.endDate);
    const startDate = new Date(project.startDate);
    const totalDuration = differenceInDays(endDate, startDate);
    const elapsed = differenceInDays(today, startDate);
    const progress = project.progress || 0;

    // Calculate expected progress
    const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
    const variance = progress - expectedProgress;

    // RAG thresholds
    if (variance >= -5) return 'green';  // On track or ahead
    if (variance >= -15) return 'amber'; // Slightly behind
    return 'red';  // Significantly behind
}

/**
 * Calculate RAG status for budget health
 */
export function calculateBudgetHealth(project: Project): RAGStatus {
    const budget = project.budget || project.totalBudget || 0;
    const spent = project.actualCost || project.budgetUsed || 0;
    const progress = project.progress || 0;

    if (budget === 0) return 'amber';

    // Expected spend based on progress
    const expectedSpend = (progress / 100) * budget;
    const variance = ((spent - expectedSpend) / budget) * 100;

    // RAG thresholds
    if (variance <= 5) return 'green';   // Under or on budget
    if (variance <= 15) return 'amber';  // Slightly over budget
    return 'red';  // Significantly over budget
}

/**
 * Calculate RAG status for risk health
 */
export function calculateRiskHealth(project: Project): RAGStatus {
    const risks = project.risks || [];
    const activeRisks = risks.filter(r => r.status !== 'resolved' && r.status !== 'accepted');

    if (activeRisks.length === 0) return 'green';

    const criticalRisks = activeRisks.filter(r => r.priority === 'critical').length;
    const highRisks = activeRisks.filter(r => r.priority === 'high').length;

    // RAG thresholds
    if (criticalRisks > 0) return 'red';
    if (highRisks > 2) return 'amber';
    if (activeRisks.length > 5) return 'amber';
    return 'green';
}

/**
 * Calculate RAG status for scope health
 */
export function calculateScopeHealth(project: Project): RAGStatus {
    // For now, use task completion rate as a proxy
    const tasks = project.tasks || [];
    if (tasks.length === 0) return 'amber';

    const completedTasks = tasks.filter(t => t.progress === 100).length;
    const completionRate = (completedTasks / tasks.length) * 100;
    const projectProgress = project.progress || 0;

    // Check if task completion aligns with project progress
    const variance = Math.abs(completionRate - projectProgress);

    if (variance <= 10) return 'green';
    if (variance <= 25) return 'amber';
    return 'red';
}

/**
 * Calculate RAG status for quality health
 */
export function calculateQualityHealth(project: Project): RAGStatus {
    // Quality can be inferred from various factors
    // For now, use a combination of schedule and scope health
    const scheduleHealth = calculateScheduleHealth(project);
    const scopeHealth = calculateScopeHealth(project);

    if (scheduleHealth === 'green' && scopeHealth === 'green') return 'green';
    if (scheduleHealth === 'red' || scopeHealth === 'red') return 'red';
    return 'amber';
}

/**
 * Calculate overall project health
 */
export function calculateOverallHealth(indicators: Omit<ProjectHealthIndicators, 'overallHealth' | 'trend'>): RAGStatus {
    const healths = [
        indicators.scheduleHealth,
        indicators.budgetHealth,
        indicators.scopeHealth,
        indicators.qualityHealth,
        indicators.riskHealth
    ];

    const redCount = healths.filter(h => h === 'red').length;
    const amberCount = healths.filter(h => h === 'amber').length;

    // If any critical area is red, overall is red
    if (redCount > 0) return 'red';
    // If more than 2 areas are amber, overall is amber
    if (amberCount > 2) return 'amber';
    // If any area is amber, overall is amber
    if (amberCount > 0) return 'amber';
    return 'green';
}

/**
 * Get complete health indicators for a project
 */
export function getProjectHealthIndicators(project: Project): ProjectHealthIndicators {
    const scheduleHealth = calculateScheduleHealth(project);
    const budgetHealth = calculateBudgetHealth(project);
    const scopeHealth = calculateScopeHealth(project);
    const qualityHealth = calculateQualityHealth(project);
    const riskHealth = calculateRiskHealth(project);

    const overallHealth = calculateOverallHealth({
        projectId: project.id,
        projectName: project.name,
        scheduleHealth,
        budgetHealth,
        scopeHealth,
        qualityHealth,
        riskHealth
    });

    return {
        projectId: project.id,
        projectName: project.name,
        scheduleHealth,
        budgetHealth,
        scopeHealth,
        qualityHealth,
        riskHealth,
        overallHealth,
        trend: 'stable' // TODO: Calculate based on historical data
    };
}

/**
 * Calculate portfolio-wide metrics
 */
export function calculatePortfolioMetrics(projects: Project[]): PortfolioMetrics {
    const activeProjects = projects.filter(p => p.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const onHoldProjects = projects.filter(p => p.status === 'on-hold');

    // Financial metrics
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || p.totalBudget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.actualCost || p.budgetUsed || 0), 0);
    const totalValue = projects.reduce((sum, p) => sum + ((p.score || 0) * 100000), 0); // Arbitrary value calculation

    // Health distribution
    const healthIndicators = activeProjects.map(getProjectHealthIndicators);
    const greenCount = healthIndicators.filter(h => h.overallHealth === 'green').length;
    const amberCount = healthIndicators.filter(h => h.overallHealth === 'amber').length;
    const redCount = healthIndicators.filter(h => h.overallHealth === 'red').length;

    // Risk metrics
    const allRisks = projects.flatMap(p => p.risks || []);
    const activeRisks = allRisks.filter(r => r.status !== 'resolved' && r.status !== 'accepted');
    const totalRiskExposure = activeRisks.reduce((sum, r) => sum + (r.estimatedCostImpact || 0), 0);
    const criticalRisks = activeRisks.filter(r => r.priority === 'critical').length;

    // Resource metrics
    const totalResourcesAllocated = projects.reduce((sum, p) => {
        const requirements = p.resourceRequirements || [];
        return sum + requirements.reduce((reqSum, req) => reqSum + req.count, 0);
    }, 0);

    // Simple utilization calculation (would need more data in real scenario)
    const resourceUtilizationRate = totalResourcesAllocated > 0 ? 75 : 0; // Placeholder

    return {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        onHoldProjects: onHoldProjects.length,
        totalBudget,
        totalSpent,
        totalValue,
        healthDistribution: {
            green: greenCount,
            amber: amberCount,
            red: redCount
        },
        totalRiskExposure,
        criticalRisks,
        totalResourcesAllocated,
        resourceUtilizationRate
    };
}

/**
 * Get RAG color class for styling
 */
export function getRAGColorClass(status: RAGStatus, variant: 'bg' | 'text' | 'border' = 'bg'): string {
    const colors = {
        green: {
            bg: 'bg-green-100 dark:bg-green-900/20',
            text: 'text-green-700 dark:text-green-400',
            border: 'border-green-500'
        },
        amber: {
            bg: 'bg-orange-100 dark:bg-orange-900/20',
            text: 'text-orange-700 dark:text-orange-400',
            border: 'border-orange-500'
        },
        red: {
            bg: 'bg-red-100 dark:bg-red-900/20',
            text: 'text-red-700 dark:text-red-400',
            border: 'border-red-500'
        }
    };

    return colors[status][variant];
}
