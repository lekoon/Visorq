import type { Project, Task, ResourcePoolItem } from '../types';
import { parseISO, differenceInDays, addDays } from 'date-fns';

export type WarningLevel = 'info' | 'warning' | 'critical';
export type WarningCategory = 'schedule' | 'cost' | 'resource' | 'quality' | 'team';

export interface RiskWarning {
    id: string;
    category: WarningCategory;
    level: WarningLevel;
    title: string;
    description: string;
    impact: string;
    suggestions: string[];
    metrics?: Record<string, number | string>;
    createdAt: string;
    entityId?: string;
    entityType?: 'project' | 'task' | 'resource';
}

/**
 * 检测进度风险
 */
const detectScheduleRisks = (project: Project, tasks: Task[]): RiskWarning[] => {
    const warnings: RiskWarning[] = [];
    const now = new Date();

    // 1. 检测逾期任务
    const overdueTasks = tasks.filter(task => {
        const endDate = parseISO(task.endDate);
        return endDate < now && (task.progress || 0) < 100;
    });

    if (overdueTasks.length > 0) {
        warnings.push({
            id: `schedule-overdue-${Date.now()}`,
            category: 'schedule',
            level: overdueTasks.length > 3 ? 'critical' : 'warning',
            title: '任务逾期警告',
            description: `${overdueTasks.length} 个任务已超过截止日期但未完成`,
            impact: '可能导致项目整体进度延误',
            suggestions: [
                '立即检查逾期任务的阻塞原因',
                '考虑增加资源或调整优先级',
                '评估是否需要调整项目时间线'
            ],
            metrics: {
                overdueCount: overdueTasks.length,
                avgDelay: Math.round(overdueTasks.reduce((sum, t) =>
                    sum + differenceInDays(now, parseISO(t.endDate)), 0) / overdueTasks.length)
            },
            createdAt: new Date().toISOString()
        });
    }

    // 2. 检测即将到期的里程碑
    const upcomingMilestones = tasks.filter(task => {
        if (task.type !== 'milestone') return false;
        const endDate = parseISO(task.endDate);
        const daysUntil = differenceInDays(endDate, now);
        return daysUntil > 0 && daysUntil <= 7 && (task.progress || 0) < 100;
    });

    if (upcomingMilestones.length > 0) {
        warnings.push({
            id: `schedule-milestone-${Date.now()}`,
            category: 'schedule',
            level: 'warning',
            title: '里程碑临近',
            description: `${upcomingMilestones.length} 个里程碑将在 7 天内到期`,
            impact: '里程碑延误可能影响项目交付承诺',
            suggestions: [
                '确认里程碑前置任务的完成状态',
                '准备好里程碑评审材料',
                '提前沟通可能的风险'
            ],
            metrics: {
                count: upcomingMilestones.length
            },
            createdAt: new Date().toISOString()
        });
    }

    // 3. 检测关键路径任务延期风险
    const criticalTasks = tasks.filter(task => {
        const startDate = parseISO(task.startDate);
        const endDate = parseISO(task.endDate);
        const totalDays = differenceInDays(endDate, startDate);
        const elapsed = differenceInDays(now, startDate);
        const expectedProgress = Math.min(100, (elapsed / totalDays) * 100);
        const actualProgress = task.progress || 0;

        return actualProgress < expectedProgress - 20 && task.priority === 'P0';
    });

    if (criticalTasks.length > 0) {
        warnings.push({
            id: `schedule-critical-${Date.now()}`,
            category: 'schedule',
            level: 'critical',
            title: '关键任务进度落后',
            description: `${criticalTasks.length} 个高优先级任务进度严重落后`,
            impact: '可能导致项目关键路径延误',
            suggestions: [
                '立即分析任务延误原因',
                '考虑资源重新分配',
                '评估是否需要任务拆分或并行处理'
            ],
            createdAt: new Date().toISOString()
        });
    }

    return warnings;
};

/**
 * 检测成本风险
 */
const detectCostRisks = (project: Project): RiskWarning[] => {
    const warnings: RiskWarning[] = [];

    const budgetUsed = project.budgetUsed || 0;
    const totalBudget = project.totalBudget || 0;
    const progress = project.progress || 0;

    if (totalBudget === 0) return warnings;

    const budgetUsageRate = (budgetUsed / totalBudget) * 100;

    // 1. 检测预算超支风险
    if (budgetUsageRate > progress + 15) {
        warnings.push({
            id: `cost-overrun-${Date.now()}`,
            category: 'cost',
            level: budgetUsageRate > progress + 25 ? 'critical' : 'warning',
            title: '预算超支风险',
            description: `预算使用率(${budgetUsageRate.toFixed(0)}%)明显高于项目进度(${progress.toFixed(0)}%)`,
            impact: '项目可能在完成前耗尽预算',
            suggestions: [
                '审查近期支出明细',
                '识别超支的主要原因',
                '考虑削减非必要开支',
                '评估是否需要申请追加预算'
            ],
            metrics: {
                budgetUsed: budgetUsed,
                totalBudget: totalBudget,
                usageRate: budgetUsageRate,
                progress: progress
            },
            createdAt: new Date().toISOString()
        });
    }

    // 2. 检测预算即将耗尽
    if (budgetUsageRate > 85 && progress < 80) {
        warnings.push({
            id: `cost-depleting-${Date.now()}`,
            category: 'cost',
            level: 'critical',
            title: '预算即将耗尽',
            description: `已使用 ${budgetUsageRate.toFixed(0)}% 预算，但项目仅完成 ${progress.toFixed(0)}%`,
            impact: '项目可能无法完成',
            suggestions: [
                '立即冻结非必要支出',
                '重新评估剩余工作量',
                '准备预算追加申请'
            ],
            createdAt: new Date().toISOString()
        });
    }

    return warnings;
};

/**
 * 检测资源风险
 */
const detectResourceRisks = (
    project: Project,
    allProjects: Project[],
    resourcePool: ResourcePoolItem[]
): RiskWarning[] => {
    const warnings: RiskWarning[] = [];

    const requirements = project.resourceRequirements || [];

    // 1. 检测资源过载
    const overloadedResources: string[] = [];

    for (const resource of resourcePool) {
        let totalAllocated = 0;

        for (const proj of allProjects) {
            if (proj.status === 'completed') continue;
            const req = proj.resourceRequirements?.find(r => r.resourceId === resource.id);
            if (req) {
                totalAllocated += req.count;
            }
        }

        if (totalAllocated > resource.totalQuantity) {
            overloadedResources.push(resource.name);
        }
    }

    if (overloadedResources.length > 0) {
        warnings.push({
            id: `resource-overload-${Date.now()}`,
            category: 'resource',
            level: 'warning',
            title: '资源过载',
            description: `${overloadedResources.length} 个资源组超出容量限制`,
            impact: '可能导致工作质量下降或进度延误',
            suggestions: [
                '重新平衡资源分配',
                '考虑外包或临时增援',
                '调整项目优先级以缓解压力'
            ],
            metrics: {
                overloadedCount: overloadedResources.length,
                resources: overloadedResources.join(', ')
            },
            createdAt: new Date().toISOString()
        });
    }

    // 2. 检测技能缺口
    const unmetSkills: string[] = [];

    for (const req of requirements) {
        const requiredSkills = req.requiredSkills || [];
        for (const skill of requiredSkills) {
            const hasSkill = resourcePool.some(r =>
                r.skills?.some(s => s.name.toLowerCase() === skill.toLowerCase())
            );
            if (!hasSkill && !unmetSkills.includes(skill)) {
                unmetSkills.push(skill);
            }
        }
    }

    if (unmetSkills.length > 0) {
        warnings.push({
            id: `resource-skill-gap-${Date.now()}`,
            category: 'resource',
            level: 'warning',
            title: '技能缺口',
            description: `项目需要的 ${unmetSkills.length} 项技能在团队中不存在`,
            impact: '可能导致任务质量问题或需要外部支持',
            suggestions: [
                '评估是否需要招聘或外包',
                '考虑安排相关培训',
                '寻找具备相关技能的合作伙伴'
            ],
            metrics: {
                missingSkills: unmetSkills.join(', ')
            },
            createdAt: new Date().toISOString()
        });
    }

    return warnings;
};

/**
 * 检测团队风险
 */
const detectTeamRisks = (project: Project, tasks: Task[]): RiskWarning[] => {
    const warnings: RiskWarning[] = [];

    // 1. 检测任务分配不均
    const assignmentCount = new Map<string, number>();

    tasks.forEach(task => {
        if (task.assignee) {
            assignmentCount.set(task.assignee, (assignmentCount.get(task.assignee) || 0) + 1);
        }
    });

    if (assignmentCount.size > 1) {
        const counts = Array.from(assignmentCount.values());
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const max = Math.max(...counts);
        const min = Math.min(...counts);

        if (max > avg * 2 || min < avg * 0.3) {
            warnings.push({
                id: `team-imbalance-${Date.now()}`,
                category: 'team',
                level: 'info',
                title: '任务分配不均',
                description: '团队成员之间的工作量存在明显差异',
                impact: '可能导致部分成员过载，影响士气和效率',
                suggestions: [
                    '重新评估任务分配',
                    '考虑技能和经验因素',
                    '与团队沟通工作量问题'
                ],
                metrics: {
                    maxTasks: max,
                    minTasks: min,
                    avgTasks: Math.round(avg)
                },
                createdAt: new Date().toISOString()
            });
        }
    }

    // 2. 检测无人负责的任务
    const unassignedTasks = tasks.filter(t => !t.assignee && t.status !== 'completed');

    if (unassignedTasks.length > 0) {
        warnings.push({
            id: `team-unassigned-${Date.now()}`,
            category: 'team',
            level: unassignedTasks.length > 5 ? 'warning' : 'info',
            title: '未分配任务',
            description: `${unassignedTasks.length} 个任务尚未分配负责人`,
            impact: '任务可能被遗漏或延误',
            suggestions: [
                '尽快为未分配任务指定负责人',
                '评估是否有资源可以承接',
                '考虑任务优先级进行分配'
            ],
            createdAt: new Date().toISOString()
        });
    }

    return warnings;
};

/**
 * 生成项目风险预警
 */
export const generateRiskWarnings = (
    project: Project,
    tasks: Task[],
    allProjects: Project[] = [],
    resourcePool: ResourcePoolItem[] = []
): RiskWarning[] => {
    const warnings: RiskWarning[] = [];

    // 收集所有类别的风险
    warnings.push(...detectScheduleRisks(project, tasks));
    warnings.push(...detectCostRisks(project));
    warnings.push(...detectResourceRisks(project, allProjects, resourcePool));
    warnings.push(...detectTeamRisks(project, tasks));

    // 按严重程度排序
    const levelOrder = { critical: 0, warning: 1, info: 2 };
    warnings.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    return warnings;
};

/**
 * 获取风险摘要统计
 */
export const getRiskSummary = (warnings: RiskWarning[]): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    byCategory: Record<WarningCategory, number>;
} => {
    const byCategory: Record<WarningCategory, number> = {
        schedule: 0,
        cost: 0,
        resource: 0,
        quality: 0,
        team: 0
    };

    warnings.forEach(w => {
        byCategory[w.category]++;
    });

    return {
        total: warnings.length,
        critical: warnings.filter(w => w.level === 'critical').length,
        warning: warnings.filter(w => w.level === 'warning').length,
        info: warnings.filter(w => w.level === 'info').length,
        byCategory
    };
};
