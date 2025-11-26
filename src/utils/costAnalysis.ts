import type { Project, ResourcePoolItem, CostBreakdown, ResourceRequirement } from '../types';

/**
 * 计算单个资源需求的成本
 */
export const calculateResourceCost = (
    requirement: ResourceRequirement,
    resource: ResourcePoolItem
): number => {
    if (!resource.costPerUnit && !resource.hourlyRate) return 0;

    let cost = 0;
    const { count, duration, unit } = requirement;

    if (resource.hourlyRate) {
        // 使用小时费率计算
        let hours = 0;
        switch (unit) {
            case 'day':
                hours = duration * 8; // 假设每天8小时
                break;
            case 'month':
                hours = duration * 160; // 假设每月160小时
                break;
            case 'year':
                hours = duration * 1920; // 假设每年1920小时
                break;
        }
        cost = count * hours * resource.hourlyRate;
    } else if (resource.costPerUnit) {
        // 使用单位成本计算
        let multiplier = duration;
        if (unit === 'day') multiplier = duration / 30; // 转换为月
        if (unit === 'year') multiplier = duration * 12; // 转换为月

        cost = count * multiplier * resource.costPerUnit;
    }

    return cost;
};

/**
 * 计算项目总成本
 */
export const calculateProjectCost = (
    project: Project,
    resources: ResourcePoolItem[]
): CostBreakdown => {
    const resourceCosts = project.resourceRequirements.map(req => {
        const resource = resources.find(r => r.id === req.resourceId);
        if (!resource) {
            return {
                resourceId: req.resourceId,
                resourceName: 'Unknown Resource',
                quantity: req.count,
                duration: req.duration,
                unit: req.unit,
                unitCost: 0,
                totalCost: 0
            };
        }

        const totalCost = calculateResourceCost(req, resource);
        const unitCost = resource.costPerUnit || resource.hourlyRate || 0;

        return {
            resourceId: resource.id,
            resourceName: resource.name,
            quantity: req.count,
            duration: req.duration,
            unit: req.unit,
            unitCost,
            totalCost
        };
    });

    const totalCost = resourceCosts.reduce((sum, rc) => sum + rc.totalCost, 0);

    return {
        projectId: project.id,
        projectName: project.name,
        totalCost,
        resourceCosts
    };
};

/**
 * 批量计算所有项目成本
 */
export const calculatePortfolioCost = (
    projects: Project[],
    resources: ResourcePoolItem[]
): {
    totalCost: number;
    projectCosts: CostBreakdown[];
    resourceUtilizationCost: {
        resourceId: string;
        resourceName: string;
        totalAllocated: number;
        totalCost: number;
        projects: { projectId: string; projectName: string; cost: number }[];
    }[];
} => {
    const projectCosts = projects.map(p => calculateProjectCost(p, resources));
    const totalCost = projectCosts.reduce((sum, pc) => sum + pc.totalCost, 0);

    // 按资源汇总成本
    const resourceCostMap = new Map<string, {
        resourceName: string;
        totalAllocated: number;
        totalCost: number;
        projects: { projectId: string; projectName: string; cost: number }[];
    }>();

    projectCosts.forEach(pc => {
        pc.resourceCosts.forEach(rc => {
            const existing = resourceCostMap.get(rc.resourceId) || {
                resourceName: rc.resourceName,
                totalAllocated: 0,
                totalCost: 0,
                projects: []
            };

            resourceCostMap.set(rc.resourceId, {
                resourceName: rc.resourceName,
                totalAllocated: existing.totalAllocated + rc.quantity,
                totalCost: existing.totalCost + rc.totalCost,
                projects: [
                    ...existing.projects,
                    {
                        projectId: pc.projectId,
                        projectName: pc.projectName,
                        cost: rc.totalCost
                    }
                ]
            });
        });
    });

    const resourceUtilizationCost = Array.from(resourceCostMap.entries()).map(([resourceId, data]) => ({
        resourceId,
        ...data
    }));

    return {
        totalCost,
        projectCosts,
        resourceUtilizationCost
    };
};

/**
 * 预算分析
 */
export interface BudgetAnalysis {
    totalBudget: number;
    totalCost: number;
    remaining: number;
    utilizationRate: number;
    status: 'under' | 'on-track' | 'over';
    projectsOverBudget: {
        projectId: string;
        projectName: string;
        budget: number;
        actualCost: number;
        variance: number;
    }[];
    recommendations: string[];
}

export const analyzeBudget = (
    projects: (Project & { budget?: number })[],
    resources: ResourcePoolItem[],
    totalBudget?: number
): BudgetAnalysis => {
    const portfolioCost = calculatePortfolioCost(projects, resources);
    const totalCost = portfolioCost.totalCost;

    const budget = totalBudget || projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const remaining = budget - totalCost;
    const utilizationRate = budget > 0 ? (totalCost / budget) * 100 : 0;

    let status: 'under' | 'on-track' | 'over' = 'on-track';
    if (utilizationRate > 100) status = 'over';
    else if (utilizationRate < 70) status = 'under';

    // 识别超预算项目
    const projectsOverBudget = projects
        .map(p => {
            const costBreakdown = portfolioCost.projectCosts.find(pc => pc.projectId === p.id);
            const actualCost = costBreakdown?.totalCost || 0;
            const projectBudget = p.budget || 0;

            if (projectBudget > 0 && actualCost > projectBudget) {
                return {
                    projectId: p.id,
                    projectName: p.name,
                    budget: projectBudget,
                    actualCost,
                    variance: actualCost - projectBudget
                };
            }
            return null;
        })
        .filter(Boolean) as BudgetAnalysis['projectsOverBudget'];

    // 生成建议
    const recommendations: string[] = [];

    if (status === 'over') {
        recommendations.push(
            `Portfolio is ${(utilizationRate - 100).toFixed(1)}% over budget. Consider reducing scope or reallocating resources.`
        );
    } else if (status === 'under') {
        recommendations.push(
            `Only ${utilizationRate.toFixed(1)}% of budget utilized. Consider taking on additional projects.`
        );
    }

    if (projectsOverBudget.length > 0) {
        recommendations.push(
            `${projectsOverBudget.length} project(s) are over budget. Review resource allocation for: ${projectsOverBudget.map(p => p.projectName).join(', ')}`
        );
    }

    const topCostResource = portfolioCost.resourceUtilizationCost
        .sort((a, b) => b.totalCost - a.totalCost)[0];

    if (topCostResource) {
        recommendations.push(
            `Highest cost resource: ${topCostResource.resourceName} ($${topCostResource.totalCost.toLocaleString()}). Monitor utilization closely.`
        );
    }

    return {
        totalBudget: budget,
        totalCost,
        remaining,
        utilizationRate,
        status,
        projectsOverBudget,
        recommendations
    };
};

/**
 * 成本优化建议
 */
export const generateCostOptimizationSuggestions = (
    projects: Project[],
    resources: ResourcePoolItem[]
): string[] => {
    const suggestions: string[] = [];
    const portfolioCost = calculatePortfolioCost(projects, resources);

    // 识别高成本资源
    const highCostResources = portfolioCost.resourceUtilizationCost
        .filter(r => r.totalCost > portfolioCost.totalCost * 0.3)
        .sort((a, b) => b.totalCost - a.totalCost);

    if (highCostResources.length > 0) {
        suggestions.push(
            `${highCostResources[0].resourceName} accounts for ${((highCostResources[0].totalCost / portfolioCost.totalCost) * 100).toFixed(1)}% of total cost. Consider optimizing allocation.`
        );
    }

    // 识别低效率项目（高成本低评分）
    const inefficientProjects = projects
        .map(p => {
            const cost = portfolioCost.projectCosts.find(pc => pc.projectId === p.id)?.totalCost || 0;
            return { ...p, cost, efficiency: p.score / (cost || 1) };
        })
        .filter(p => p.cost > 0)
        .sort((a, b) => a.efficiency - b.efficiency)
        .slice(0, 3);

    if (inefficientProjects.length > 0 && inefficientProjects[0].efficiency < 0.01) {
        suggestions.push(
            `Project "${inefficientProjects[0].name}" has low ROI (score ${inefficientProjects[0].score.toFixed(1)} vs cost $${inefficientProjects[0].cost.toLocaleString()}). Review justification.`
        );
    }

    return suggestions;
};
