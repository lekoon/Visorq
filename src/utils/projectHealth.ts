import type { Project, Task, ResourceRequirement } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export interface ProjectHealthMetrics {
    overall: number; // 0-100 综合健康度
    schedule: {
        score: number;
        spi: number; // Schedule Performance Index
        status: 'excellent' | 'good' | 'warning' | 'critical';
        issues: string[];
    };
    cost: {
        score: number;
        cpi: number; // Cost Performance Index
        status: 'excellent' | 'good' | 'warning' | 'critical';
        issues: string[];
    };
    resources: {
        score: number;
        utilization: number;
        conflicts: number;
        status: 'excellent' | 'good' | 'warning' | 'critical';
        issues: string[];
    };
    risks: {
        score: number;
        total: number;
        critical: number;
        status: 'excellent' | 'good' | 'warning' | 'critical';
        issues: string[];
    };
    quality: {
        score: number;
        defectRate: number;
        status: 'excellent' | 'good' | 'warning' | 'critical';
        issues: string[];
    };
    team: {
        score: number;
        morale: number;
        velocity: number;
        status: 'excellent' | 'good' | 'warning' | 'critical';
        issues: string[];
    };
}

/**
 * 计算进度绩效指标（SPI）
 */
const calculateSPI = (project: Project, tasks: Task[]): number => {
    if (!tasks.length) return 1.0;

    const now = new Date();
    let plannedValue = 0;
    let earnedValue = 0;

    tasks.forEach(task => {
        const taskStart = parseISO(task.startDate);
        const taskEnd = parseISO(task.endDate);
        const totalDuration = differenceInDays(taskEnd, taskStart);

        if (totalDuration <= 0) return;

        // 计算计划值（应该完成的工作）
        const daysFromStart = differenceInDays(now, taskStart);
        const plannedProgress = Math.min(100, Math.max(0, (daysFromStart / totalDuration) * 100));
        plannedValue += plannedProgress;

        // 计算挣值（实际完成的工作）
        earnedValue += task.progress || 0;
    });

    if (plannedValue === 0) return 1.0;
    return earnedValue / plannedValue;
};

/**
 * 计算成本绩效指标（CPI）
 */
const calculateCPI = (project: Project): number => {
    const actualCost = project.actualCost || project.budgetUsed || 0;
    const budget = project.totalBudget || 0;

    if (actualCost === 0) return 1.0;
    if (budget === 0) return 1.0;

    // 基于预算使用比例的简化CPI
    const progress = project.progress || 0;
    const plannedCost = budget * (progress / 100);

    if (plannedCost === 0) return 1.0;
    return plannedCost / actualCost;
};

/**
 * 评估进度健康度
 */
const evaluateScheduleHealth = (project: Project, tasks: Task[]) => {
    const spi = calculateSPI(project, tasks);
    const issues: string[] = [];
    let score = 100;

    // SPI 评分
    if (spi >= 0.95) {
        score = 100;
    } else if (spi >= 0.85) {
        score = 80;
        issues.push(`进度稍慢，SPI=${spi.toFixed(2)}`);
    } else if (spi >= 0.75) {
        score = 60;
        issues.push(`进度明显落后，SPI=${spi.toFixed(2)}`);
    } else {
        score = 40;
        issues.push(`进度严重滞后，SPI=${spi.toFixed(2)}`);
    }

    // 检查逾期任务
    const now = new Date();
    const overdueTasks = tasks.filter(t => {
        const endDate = parseISO(t.endDate);
        return endDate < now && (t.progress || 0) < 100;
    });

    if (overdueTasks.length > 0) {
        score -= overdueTasks.length * 5;
        issues.push(`${overdueTasks.length} 个任务已逾期`);
    }

    // 检查里程碑
    const upcomingMilestones = tasks.filter(t => {
        if (t.type !== 'milestone') return false;
        const endDate = parseISO(t.endDate);
        const daysUntil = differenceInDays(endDate, now);
        return daysUntil > 0 && daysUntil <= 7 && (t.progress || 0) < 100;
    });

    if (upcomingMilestones.length > 0) {
        issues.push(`${upcomingMilestones.length} 个里程碑即将到期`);
    }

    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical';

    return {
        score: Math.max(0, Math.min(100, score)),
        spi,
        status,
        issues
    };
};

/**
 * 评估成本健康度
 */
const evaluateCostHealth = (project: Project) => {
    const cpi = calculateCPI(project);
    const issues: string[] = [];
    let score = 100;

    // CPI 评分
    if (cpi >= 0.95) {
        score = 100;
    } else if (cpi >= 0.85) {
        score = 80;
        issues.push(`成本稍微超支，CPI=${cpi.toFixed(2)}`);
    } else if (cpi >= 0.75) {
        score = 60;
        issues.push(`成本明显超支，CPI=${cpi.toFixed(2)}`);
    } else {
        score = 40;
        issues.push(`成本严重超支，CPI=${cpi.toFixed(2)}`);
    }

    // 检查预算使用率
    const budgetUsed = project.budgetUsed || 0;
    const totalBudget = project.totalBudget || 0;
    const progress = project.progress || 0;

    if (totalBudget > 0) {
        const budgetUsageRate = (budgetUsed / totalBudget) * 100;

        if (budgetUsageRate > progress + 10) {
            score -= 10;
            issues.push(`预算使用率(${budgetUsageRate.toFixed(0)}%)超过进度(${progress.toFixed(0)}%)`);
        }

        if (budgetUsageRate > 90) {
            issues.push('预算即将耗尽');
        }
    }

    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical';

    return {
        score: Math.max(0, Math.min(100, score)),
        cpi,
        status,
        issues
    };
};

/**
 * 评估资源健康度
 */
const evaluateResourceHealth = (project: Project, allProjects: Project[]) => {
    const issues: string[] = [];
    let score = 100;
    let conflicts = 0;

    const resourceReqs = project.resourceRequirements || [];

    // 计算资源利用率（简化版）
    let totalRequired = 0;
    let totalAllocated = 0;

    resourceReqs.forEach(req => {
        totalRequired += req.count;
        // 这里假设已分配 = 需求量（实际应该从资源池查询）
        totalAllocated += req.count;
    });

    const utilization = totalRequired > 0 ? (totalAllocated / totalRequired) * 100 : 100;

    if (utilization < 70) {
        score -= 15;
        issues.push(`资源利用率偏低(${utilization.toFixed(0)}%)`);
    } else if (utilization > 110) {
        score -= 20;
        issues.push(`资源过度分配(${utilization.toFixed(0)}%)`);
        conflicts++;
    }

    // 检查技能匹配度
    const unmatchedSkills = resourceReqs.filter(req => {
        const requiredSkills = req.requiredSkills || [];
        return requiredSkills.length > 0 && !req.resourceId; // 需要技能但未分配资源
    });

    if (unmatchedSkills.length > 0) {
        score -= unmatchedSkills.length * 5;
        issues.push(`${unmatchedSkills.length} 个资源需求未匹配合适技能`);
    }

    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical';

    return {
        score: Math.max(0, Math.min(100, score)),
        utilization,
        conflicts,
        status,
        issues
    };
};

/**
 * 评估风险健康度
 */
const evaluateRiskHealth = (project: Project) => {
    const issues: string[] = [];
    const risks = project.risks || [];
    let score = 100;

    const criticalRisks = risks.filter(r => r.impact === 'critical' || r.impact === 'high');
    const total = risks.length;

    if (total === 0) {
        return {
            score: 100,
            total: 0,
            critical: 0,
            status: 'excellent' as const,
            issues: []
        };
    }

    // 根据风险数量和严重程度评分
    score -= criticalRisks.length * 15;
    score -= (total - criticalRisks.length) * 5;

    if (criticalRisks.length > 0) {
        issues.push(`存在 ${criticalRisks.length} 个高危风险`);
    }

    if (total > 10) {
        issues.push(`风险数量较多(${total}个)`);
    }

    // 检查未处理的风险
    const unmitigatedRisks = risks.filter(r => !r.mitigationPlan || r.mitigationPlan.trim() === '');
    if (unmitigatedRisks.length > 0) {
        score -= unmitigatedRisks.length * 3;
        issues.push(`${unmitigatedRisks.length} 个风险缺少应对措施`);
    }

    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical';

    return {
        score: Math.max(0, Math.min(100, score)),
        total,
        critical: criticalRisks.length,
        status,
        issues
    };
};

/**
 * 评估质量健康度
 */
const evaluateQualityHealth = (project: Project, tasks: Task[]) => {
    const issues: string[] = [];
    let score = 100;

    // 简化的质量评估（实际应该有缺陷跟踪系统）
    const completedTasks = tasks.filter(t => (t.progress || 0) === 100);
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
        return {
            score: 100,
            defectRate: 0,
            status: 'excellent' as const,
            issues: []
        };
    }

    // 假设的缺陷率（实际应该从质量管理系统获取）
    const defectRate = 0; // 占位

    // 检查重新打开的任务（需要返工）
    const reworkTasks = tasks.filter(t => {
        return t.status === 'active' && (t.progress || 0) > 50; // 之前做过现在又在做
    });

    if (reworkTasks.length > 0) {
        const reworkRate = (reworkTasks.length / totalTasks) * 100;
        score -= reworkRate;
        issues.push(`${reworkTasks.length} 个任务需要返工`);
    }

    // 检查测试覆盖（如果有相关数据）
    // 这里简化处理

    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical';

    return {
        score: Math.max(0, Math.min(100, score)),
        defectRate,
        status,
        issues
    };
};

/**
 * 评估团队健康度
 */
const evaluateTeamHealth = (project: Project, tasks: Task[]) => {
    const issues: string[] = [];
    let score = 100;

    // 计算团队速率（完成任务的速度）
    const completedTasks = tasks.filter(t => (t.progress || 0) === 100);
    const totalTasks = tasks.length;
    const velocity = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    if (velocity < 30) {
        score -= 20;
        issues.push(`团队速率较低(${velocity.toFixed(0)}%)`);
    }

    // 简化的士气评估（实际应该有团队调查数据）
    const morale = 75; // 占位

    if (morale < 60) {
        score -= 15;
        issues.push('团队士气偏低');
    }

    // 检查任务分配均衡性
    const taskAssignments = new Map<string, number>();
    tasks.forEach(task => {
        if (task.assignee) {
            taskAssignments.set(task.assignee, (taskAssignments.get(task.assignee) || 0) + 1);
        }
    });

    if (taskAssignments.size > 0) {
        const assignments = Array.from(taskAssignments.values());
        const avg = assignments.reduce((a, b) => a + b, 0) / assignments.length;
        const maxDeviation = Math.max(...assignments.map(a => Math.abs(a - avg)));

        if (maxDeviation > avg * 0.5) {
            score -= 10;
            issues.push('任务分配不均衡');
        }
    }

    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical';

    return {
        score: Math.max(0, Math.min(100, score)),
        morale,
        velocity,
        status,
        issues
    };
};

/**
 * 计算项目健康度
 */
export const calculateProjectHealth = (
    project: Project,
    tasks: Task[],
    allProjects: Project[] = []
): ProjectHealthMetrics => {
    const schedule = evaluateScheduleHealth(project, tasks);
    const cost = evaluateCostHealth(project);
    const resources = evaluateResourceHealth(project, allProjects);
    const risks = evaluateRiskHealth(project);
    const quality = evaluateQualityHealth(project, tasks);
    const team = evaluateTeamHealth(project, tasks);

    // 计算综合健康度（加权平均）
    const overall = (
        schedule.score * 0.25 +
        cost.score * 0.20 +
        resources.score * 0.20 +
        risks.score * 0.15 +
        quality.score * 0.10 +
        team.score * 0.10
    );

    return {
        overall: Math.round(overall),
        schedule,
        cost,
        resources,
        risks,
        quality,
        team
    };
};

/**
 * 获取健康度趋势（需要历史数据）
 */
export const getHealthTrend = (
    currentHealth: ProjectHealthMetrics,
    historicalHealth: ProjectHealthMetrics[]
): 'improving' | 'stable' | 'declining' => {
    if (historicalHealth.length < 2) return 'stable';

    const recentAvg = historicalHealth.slice(-3).reduce((sum, h) => sum + h.overall, 0) / 3;
    const diff = currentHealth.overall - recentAvg;

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
};
