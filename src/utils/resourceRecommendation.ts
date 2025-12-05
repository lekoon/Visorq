import type { ResourcePoolItem, ResourceRequirement, Project, Skill } from '../types';
import { calculateSkillMatchScore } from './resourcePlanning';

export interface ResourceRecommendation {
    resource: ResourcePoolItem;
    score: number;
    matchRate: number;
    availability: number;
    costEfficiency: number;
    reasons: string[];
    warnings: string[];
}

/**
 * 计算资源可用性（0-100）
 */
const calculateAvailability = (
    resource: ResourcePoolItem,
    requirement: ResourceRequirement,
    allProjects: Project[]
): number => {
    // 计算该资源在所有项目中的总分配
    let totalAllocated = 0;

    for (const project of allProjects) {
        const req = project.resourceRequirements?.find(r => r.resourceId === resource.id);
        if (req) {
            totalAllocated += req.count;
        }
    }

    const available = resource.totalQuantity - totalAllocated;
    const needed = requirement.count;

    if (available >= needed) return 100;
    if (available <= 0) return 0;

    return (available / needed) * 100;
};

/**
 * 计算成本效率（分数越高越好）
 */
const calculateCostEfficiency = (
    resource: ResourcePoolItem,
    requirement: ResourceRequirement
): number => {
    const hourlyRate = resource.hourlyRate || resource.costPerUnit || 0;

    if (hourlyRate === 0) return 100; // 无成本数据，给满分

    // 假设市场平均时薪为 200
    const marketAverage = 200;
    const efficiency = (marketAverage / hourlyRate) * 100;

    return Math.min(100, Math.max(0, efficiency));
};

/**
 * 计算历史项目表现评分
 */
const calculateHistoricalPerformance = (
    resource: ResourcePoolItem,
    allProjects: Project[]
): number => {
    // 简化版：统计该资源参与的已完成项目数量
    const completedProjects = allProjects.filter(p =>
        p.status === 'completed' &&
        p.resourceRequirements?.some(r => r.resourceId === resource.id)
    );

    // 基础分 60，每个完成项目加 5 分，最高 100
    return Math.min(100, 60 + completedProjects.length * 5);
};

/**
 * 推荐最合适的资源
 */
export const recommendResources = (
    requirement: ResourceRequirement,
    resourcePool: ResourcePoolItem[],
    allProjects: Project[] = [],
    options: {
        prioritizeSkills?: boolean;
        prioritizeCost?: boolean;
        prioritizeAvailability?: boolean;
    } = {}
): ResourceRecommendation[] => {
    const {
        prioritizeSkills = true,
        prioritizeCost = false,
        prioritizeAvailability = true
    } = options;

    const recommendations: ResourceRecommendation[] = [];

    for (const resource of resourcePool) {
        const reasons: string[] = [];
        const warnings: string[] = [];

        // 1. 技能匹配度
        const skillMatch = calculateSkillMatchScore(
            requirement.requiredSkills || [],
            resource.skills || []
        );
        const matchRate = skillMatch.score;

        if (matchRate === 100) {
            reasons.push('完全匹配所需技能');
        } else if (matchRate >= 80) {
            reasons.push('高度匹配所需技能');
        } else if (matchRate >= 50) {
            reasons.push('部分匹配所需技能');
            warnings.push(`缺少技能: ${skillMatch.missing.join(', ')}`);
        } else {
            warnings.push('技能匹配度较低');
        }

        // 2. 可用性
        const availability = calculateAvailability(resource, requirement, allProjects);

        if (availability === 100) {
            reasons.push('资源充足可用');
        } else if (availability >= 50) {
            reasons.push('资源部分可用');
            warnings.push(`仅有 ${availability.toFixed(0)}% 的需求量可用`);
        } else if (availability > 0) {
            warnings.push('资源严重不足');
        } else {
            warnings.push('资源已完全分配');
        }

        // 3. 成本效率
        const costEfficiency = calculateCostEfficiency(resource, requirement);

        if (costEfficiency >= 80) {
            reasons.push('成本效益高');
        } else if (costEfficiency >= 50) {
            reasons.push('成本适中');
        } else {
            warnings.push('成本较高');
        }

        // 4. 历史表现
        const performance = calculateHistoricalPerformance(resource, allProjects);

        if (performance >= 80) {
            reasons.push('历史表现优秀');
        } else if (performance >= 60) {
            reasons.push('历史表现良好');
        }

        // 计算综合评分
        let score = 0;
        let totalWeight = 0;

        if (prioritizeSkills) {
            score += matchRate * 0.4;
            totalWeight += 0.4;
        } else {
            score += matchRate * 0.2;
            totalWeight += 0.2;
        }

        if (prioritizeAvailability) {
            score += availability * 0.3;
            totalWeight += 0.3;
        } else {
            score += availability * 0.2;
            totalWeight += 0.2;
        }

        if (prioritizeCost) {
            score += costEfficiency * 0.3;
            totalWeight += 0.3;
        } else {
            score += costEfficiency * 0.1;
            totalWeight += 0.1;
        }

        score += performance * 0.2;
        totalWeight += 0.2;

        // 归一化
        score = (score / totalWeight);

        recommendations.push({
            resource,
            score,
            matchRate,
            availability,
            costEfficiency,
            reasons,
            warnings
        });
    }

    // 按评分排序
    return recommendations.sort((a, b) => b.score - a.score);
};

/**
 * 为项目推荐完整的资源配置方案
 */
export const recommendResourcePlan = (
    requirements: ResourceRequirement[],
    resourcePool: ResourcePoolItem[],
    allProjects: Project[] = []
): {
    assignments: Map<string, ResourcePoolItem>;
    totalScore: number;
    totalCost: number;
    conflicts: string[];
} => {
    const assignments = new Map<string, ResourcePoolItem>();
    const conflicts: string[] = [];
    let totalScore = 0;
    let totalCost = 0;

    for (const req of requirements) {
        const recommendations = recommendResources(req, resourcePool, allProjects);

        if (recommendations.length === 0) {
            conflicts.push(`无法为需求 ${req.resourceId} 找到合适资源`);
            continue;
        }

        const best = recommendations[0];

        if (best.score < 50) {
            conflicts.push(`需求 ${req.resourceId} 的最佳匹配评分较低 (${best.score.toFixed(0)})`);
        }

        if (best.availability < 100) {
            conflicts.push(`资源 ${best.resource.name} 可能存在分配冲突`);
        }

        assignments.set(req.resourceId, best.resource);
        totalScore += best.score;

        // 计算成本
        const hourlyRate = best.resource.hourlyRate || best.resource.costPerUnit || 0;
        const workDays = req.unit === 'day' ? req.duration :
            req.unit === 'month' ? req.duration * 22 :
                req.unit === 'year' ? req.duration * 260 : 0;
        totalCost += hourlyRate * workDays * 8 * req.count;
    }

    totalScore = requirements.length > 0 ? totalScore / requirements.length : 0;

    return {
        assignments,
        totalScore,
        totalCost,
        conflicts
    };
};

/**
 * 分析资源池的整体健康度
 */
export const analyzeResourcePoolHealth = (
    resourcePool: ResourcePoolItem[],
    allProjects: Project[]
): {
    overloadedResources: ResourcePoolItem[];
    underutilizedResources: ResourcePoolItem[];
    balancedResources: ResourcePoolItem[];
    averageUtilization: number;
    recommendations: string[];
} => {
    const overloaded: ResourcePoolItem[] = [];
    const underutilized: ResourcePoolItem[] = [];
    const balanced: ResourcePoolItem[] = [];
    const recommendations: string[] = [];

    let totalUtilization = 0;

    for (const resource of resourcePool) {
        let allocated = 0;

        for (const project of allProjects) {
            if (project.status === 'completed') continue;

            const req = project.resourceRequirements?.find(r => r.resourceId === resource.id);
            if (req) {
                allocated += req.count;
            }
        }

        const utilization = (allocated / resource.totalQuantity) * 100;
        totalUtilization += utilization;

        if (utilization > 100) {
            overloaded.push(resource);
            recommendations.push(`${resource.name} 超载 ${(utilization - 100).toFixed(0)}%，建议增加人员或重新分配任务`);
        } else if (utilization < 30) {
            underutilized.push(resource);
            recommendations.push(`${resource.name} 利用率仅 ${utilization.toFixed(0)}%，可承接更多项目`);
        } else {
            balanced.push(resource);
        }
    }

    const averageUtilization = resourcePool.length > 0 ? totalUtilization / resourcePool.length : 0;

    if (overloaded.length > resourcePool.length * 0.3) {
        recommendations.push('整体资源紧张，建议扩充团队或延期部分项目');
    }

    if (underutilized.length > resourcePool.length * 0.5) {
        recommendations.push('整体资源利用率偏低，可以承接更多项目');
    }

    return {
        overloadedResources: overloaded,
        underutilizedResources: underutilized,
        balancedResources: balanced,
        averageUtilization,
        recommendations
    };
};
