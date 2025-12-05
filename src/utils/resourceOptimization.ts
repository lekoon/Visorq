import type { Project, ResourcePoolItem } from '../types';

export interface OptimizationSuggestion {
    type: 'reallocation' | 'hiring' | 'training' | 'schedule' | 'cost';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: {
        costSaving?: number;
        efficiencyGain?: number;
        riskReduction?: number;
    };
    actions: string[];
}

export interface ResourceOptimizationResult {
    currentState: {
        totalCost: number;
        averageUtilization: number;
        overloadedCount: number;
        underutilizedCount: number;
    };
    optimizedState: {
        totalCost: number;
        averageUtilization: number;
        overloadedCount: number;
        underutilizedCount: number;
    };
    suggestions: OptimizationSuggestion[];
    estimatedSavings: number;
    implementationComplexity: 'low' | 'medium' | 'high';
}

/**
 * 分析当前资源状态
 */
const analyzeCurrentState = (
    projects: Project[],
    resourcePool: ResourcePoolItem[]
): ResourceOptimizationResult['currentState'] => {
    let totalCost = 0;
    let totalUtilization = 0;
    let overloadedCount = 0;
    let underutilizedCount = 0;

    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    for (const resource of resourcePool) {
        let allocated = 0;
        let resourceCost = 0;

        for (const project of activeProjects) {
            const req = project.resourceRequirements?.find(r => r.resourceId === resource.id);
            if (req) {
                allocated += req.count;

                // 计算成本
                const hourlyRate = resource.hourlyRate || resource.costPerUnit || 0;
                const workDays = req.unit === 'day' ? req.duration :
                    req.unit === 'month' ? req.duration * 22 :
                        req.unit === 'year' ? req.duration * 260 : 0;
                resourceCost += hourlyRate * workDays * 8 * req.count;
            }
        }

        totalCost += resourceCost;

        const utilization = (allocated / resource.totalQuantity) * 100;
        totalUtilization += utilization;

        if (utilization > 100) overloadedCount++;
        else if (utilization < 30) underutilizedCount++;
    }

    return {
        totalCost,
        averageUtilization: resourcePool.length > 0 ? totalUtilization / resourcePool.length : 0,
        overloadedCount,
        underutilizedCount
    };
};

/**
 * 生成资源重新分配建议
 */
const generateReallocationSuggestions = (
    projects: Project[],
    resourcePool: ResourcePoolItem[]
): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    // 找出过载和空闲的资源
    const overloaded: { resource: ResourcePoolItem; excess: number }[] = [];
    const underutilized: { resource: ResourcePoolItem; available: number }[] = [];

    for (const resource of resourcePool) {
        let allocated = 0;

        for (const project of activeProjects) {
            const req = project.resourceRequirements?.find(r => r.resourceId === resource.id);
            if (req) allocated += req.count;
        }

        if (allocated > resource.totalQuantity) {
            overloaded.push({
                resource,
                excess: allocated - resource.totalQuantity
            });
        } else if (allocated < resource.totalQuantity * 0.5) {
            underutilized.push({
                resource,
                available: resource.totalQuantity - allocated
            });
        }
    }

    // 生成重新分配建议
    if (overloaded.length > 0 && underutilized.length > 0) {
        suggestions.push({
            type: 'reallocation',
            priority: 'high',
            title: '资源重新分配',
            description: `发现 ${overloaded.length} 个过载资源和 ${underutilized.length} 个空闲资源，建议重新分配`,
            impact: {
                efficiencyGain: 20,
                costSaving: 0
            },
            actions: [
                `将 ${overloaded[0].resource.name} 的部分任务转移到 ${underutilized[0].resource.name}`,
                '评估团队成员技能匹配度',
                '调整项目优先级和时间线'
            ]
        });
    }

    return suggestions;
};

/**
 * 生成招聘建议
 */
const generateHiringSuggestions = (
    projects: Project[],
    resourcePool: ResourcePoolItem[]
): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    // 计算长期过载的资源
    const chronicallyOverloaded: ResourcePoolItem[] = [];

    for (const resource of resourcePool) {
        let overloadedProjects = 0;

        for (const project of activeProjects) {
            const req = project.resourceRequirements?.find(r => r.resourceId === resource.id);
            if (req && req.count > resource.totalQuantity * 0.8) {
                overloadedProjects++;
            }
        }

        if (overloadedProjects >= 2) {
            chronicallyOverloaded.push(resource);
        }
    }

    if (chronicallyOverloaded.length > 0) {
        const resource = chronicallyOverloaded[0];
        const estimatedCost = (resource.hourlyRate || 200) * 8 * 22 * 6; // 6个月成本

        suggestions.push({
            type: 'hiring',
            priority: 'high',
            title: '扩充团队',
            description: `${resource.name} 长期处于高负载状态，建议招聘新成员`,
            impact: {
                riskReduction: 30,
                costSaving: -estimatedCost
            },
            actions: [
                `为 ${resource.name} 招聘 1-2 名新成员`,
                '制定招聘计划和预算',
                '准备培训和入职流程'
            ]
        });
    }

    return suggestions;
};

/**
 * 生成培训建议
 */
const generateTrainingSuggestions = (
    projects: Project[],
    resourcePool: ResourcePoolItem[]
): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // 分析技能缺口
    const requiredSkills = new Set<string>();
    const availableSkills = new Set<string>();

    for (const project of projects) {
        for (const req of project.resourceRequirements || []) {
            for (const skill of req.requiredSkills || []) {
                requiredSkills.add(skill);
            }
        }
    }

    for (const resource of resourcePool) {
        for (const skill of resource.skills || []) {
            availableSkills.add(skill.name);
        }
    }

    const missingSkills = Array.from(requiredSkills).filter(s => !availableSkills.has(s));

    if (missingSkills.length > 0) {
        suggestions.push({
            type: 'training',
            priority: 'medium',
            title: '技能培训',
            description: `发现 ${missingSkills.length} 项技能缺口，建议组织培训`,
            impact: {
                efficiencyGain: 15,
                costSaving: 5000
            },
            actions: [
                `组织 ${missingSkills.slice(0, 3).join(', ')} 等技能培训`,
                '制定培训计划和预算',
                '评估培训效果'
            ]
        });
    }

    return suggestions;
};

/**
 * 生成进度优化建议
 */
const generateScheduleSuggestions = (
    projects: Project[]
): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // 找出可以并行的项目
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    if (activeProjects.length >= 3) {
        suggestions.push({
            type: 'schedule',
            priority: 'medium',
            title: '优化项目排期',
            description: `当前有 ${activeProjects.length} 个活跃项目，建议优化排期以提高效率`,
            impact: {
                efficiencyGain: 10
            },
            actions: [
                '评估项目优先级',
                '识别可以延期的低优先级项目',
                '优化资源分配时间线'
            ]
        });
    }

    return suggestions;
};

/**
 * 生成成本优化建议
 */
const generateCostSuggestions = (
    projects: Project[],
    resourcePool: ResourcePoolItem[]
): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // 找出高成本低利用率的资源
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    for (const resource of resourcePool) {
        const hourlyRate = resource.hourlyRate || resource.costPerUnit || 0;
        if (hourlyRate === 0) continue;

        let allocated = 0;
        for (const project of activeProjects) {
            const req = project.resourceRequirements?.find(r => r.resourceId === resource.id);
            if (req) allocated += req.count;
        }

        const utilization = (allocated / resource.totalQuantity) * 100;

        // 高成本（>300/小时）且低利用率（<40%）
        if (hourlyRate > 300 && utilization < 40) {
            const potentialSaving = hourlyRate * 8 * 22 * (resource.totalQuantity - allocated);

            suggestions.push({
                type: 'cost',
                priority: 'medium',
                title: '优化高成本资源',
                description: `${resource.name} 成本较高但利用率仅 ${utilization.toFixed(0)}%`,
                impact: {
                    costSaving: potentialSaving * 0.3
                },
                actions: [
                    '考虑将部分高成本资源替换为性价比更高的选择',
                    '提高高成本资源的利用率',
                    '评估外包可行性'
                ]
            });
        }
    }

    return suggestions;
};

/**
 * 生成完整的资源优化建议
 */
export const generateOptimizationSuggestions = (
    projects: Project[],
    resourcePool: ResourcePoolItem[]
): ResourceOptimizationResult => {
    const currentState = analyzeCurrentState(projects, resourcePool);

    // 收集所有建议
    const allSuggestions: OptimizationSuggestion[] = [
        ...generateReallocationSuggestions(projects, resourcePool),
        ...generateHiringSuggestions(projects, resourcePool),
        ...generateTrainingSuggestions(projects, resourcePool),
        ...generateScheduleSuggestions(projects),
        ...generateCostSuggestions(projects, resourcePool)
    ];

    // 按优先级排序
    allSuggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 计算优化后的状态（估算）
    const estimatedSavings = allSuggestions.reduce(
        (sum, s) => sum + (s.impact.costSaving || 0),
        0
    );

    const efficiencyGain = allSuggestions.reduce(
        (sum, s) => sum + (s.impact.efficiencyGain || 0),
        0
    );

    const optimizedState = {
        totalCost: currentState.totalCost + estimatedSavings,
        averageUtilization: Math.min(100, currentState.averageUtilization + efficiencyGain),
        overloadedCount: Math.max(0, currentState.overloadedCount - 1),
        underutilizedCount: Math.max(0, currentState.underutilizedCount - 1)
    };

    // 评估实施复杂度
    let implementationComplexity: 'low' | 'medium' | 'high' = 'low';
    if (allSuggestions.some(s => s.type === 'hiring')) {
        implementationComplexity = 'high';
    } else if (allSuggestions.length > 3) {
        implementationComplexity = 'medium';
    }

    return {
        currentState,
        optimizedState,
        suggestions: allSuggestions,
        estimatedSavings: Math.abs(estimatedSavings),
        implementationComplexity
    };
};

/**
 * 模拟优化方案的效果
 */
export const simulateOptimization = (
    projects: Project[],
    resourcePool: ResourcePoolItem[],
    appliedSuggestions: OptimizationSuggestion[]
): {
    before: ResourceOptimizationResult['currentState'];
    after: ResourceOptimizationResult['currentState'];
    improvement: {
        costReduction: number;
        utilizationIncrease: number;
        riskReduction: number;
    };
} => {
    const before = analyzeCurrentState(projects, resourcePool);

    // 简化的模拟：应用建议的影响
    let costReduction = 0;
    let utilizationIncrease = 0;
    let riskReduction = 0;

    for (const suggestion of appliedSuggestions) {
        costReduction += suggestion.impact.costSaving || 0;
        utilizationIncrease += suggestion.impact.efficiencyGain || 0;
        riskReduction += suggestion.impact.riskReduction || 0;
    }

    const after = {
        totalCost: before.totalCost + costReduction,
        averageUtilization: Math.min(100, before.averageUtilization + utilizationIncrease),
        overloadedCount: Math.max(0, before.overloadedCount - Math.floor(riskReduction / 30)),
        underutilizedCount: Math.max(0, before.underutilizedCount - Math.floor(utilizationIncrease / 20))
    };

    return {
        before,
        after,
        improvement: {
            costReduction: Math.abs(costReduction),
            utilizationIncrease,
            riskReduction
        }
    };
};
