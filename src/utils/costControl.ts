import type { Project, Task } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export interface EVMMetrics {
    pv: number; // 计划价值 (Planned Value)
    ev: number; // 挣值 (Earned Value)
    ac: number; // 实际成本 (Actual Cost)
    sv: number; // 进度偏差 (Schedule Variance) = EV - PV
    cv: number; // 成本偏差 (Cost Variance) = EV - AC
    spi: number; // 进度绩效指数 (Schedule Performance Index) = EV / PV
    cpi: number; // 成本绩效指数 (Cost Performance Index) = EV / AC
    bac: number; // 完工预算 (Budget at Completion)
    eac: number; // 完工估算 (Estimate at Completion)
    etc: number; // 完工尚需估算 (Estimate to Complete)
    vac: number; // 完工偏差 (Variance at Completion) = BAC - EAC
    status: {
        schedule: 'ahead' | 'on_track' | 'behind';
        cost: 'under_budget' | 'on_track' | 'over_budget';
    };
}

/**
 * 计算项目的挣值管理指标
 */
export const calculateEVM = (project: Project, tasks: Task[]): EVMMetrics => {
    const now = new Date();
    const bac = project.totalBudget;
    const ac = project.actualCost || project.budgetUsed || 0;

    let pv = 0;
    let ev = 0;

    // 如果没有任务或预算，返回默认值
    if (tasks.length === 0 || bac === 0) {
        return {
            pv: 0, ev: 0, ac, sv: 0, cv: 0, spi: 1, cpi: 1,
            bac, eac: bac, etc: 0, vac: 0,
            status: { schedule: 'on_track', cost: 'on_track' }
        };
    }

    // 计算 PV 和 EV
    // 假设预算是均匀分配到每个任务的工期上的（简化模型）
    // 更精确的模型应该基于每个任务的独立预算
    const totalDuration = tasks.reduce((sum, t) => {
        const start = parseISO(t.startDate);
        const end = parseISO(t.endDate);
        return sum + Math.max(1, differenceInDays(end, start));
    }, 0);

    const costPerDay = totalDuration > 0 ? bac / totalDuration : 0;

    tasks.forEach(task => {
        const start = parseISO(task.startDate);
        const end = parseISO(task.endDate);
        const duration = Math.max(1, differenceInDays(end, start));
        const taskBudget = duration * costPerDay;

        // 计算 PV: 到目前为止应该完成的工作量价值
        if (now >= start) {
            const daysElapsed = Math.min(duration, Math.max(0, differenceInDays(now, start)));
            const plannedPercent = daysElapsed / duration;
            pv += taskBudget * plannedPercent;
        }

        // 计算 EV: 实际完成的工作量价值
        const progress = task.progress || 0;
        ev += taskBudget * (progress / 100);
    });

    // 计算偏差
    const sv = ev - pv;
    const cv = ev - ac;

    // 计算指数 (避免除以零)
    const spi = pv > 0 ? ev / pv : 1;
    const cpi = ac > 0 ? ev / ac : 1;

    // 预测未来
    // EAC = AC + (BAC - EV) / CPI (典型偏差计算法)
    // 如果 CPI 为 0 或异常，回退到 EAC = AC + (BAC - EV)
    const eac = cpi > 0.1 ? ac + (bac - ev) / cpi : ac + (bac - ev);
    const etc = eac - ac;
    const vac = bac - eac;

    // 确定状态
    const scheduleStatus = spi >= 1 ? 'ahead' : spi >= 0.9 ? 'on_track' : 'behind';
    const costStatus = cpi >= 1 ? 'under_budget' : cpi >= 0.9 ? 'on_track' : 'over_budget';

    return {
        pv, ev, ac,
        sv, cv,
        spi, cpi,
        bac, eac, etc, vac,
        status: {
            schedule: scheduleStatus,
            cost: costStatus
        }
    };
};

/**
 * 生成成本预测趋势数据（用于图表）
 * 模拟过去的数据点和未来的预测线
 */
export const generateCostTrend = (metrics: EVMMetrics, months: number = 6) => {
    const data = [];
    const today = new Date();

    // 过去 3 个月的数据（模拟）
    for (let i = 3; i > 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const factor = 1 - (i * 0.1); // 模拟增长
        data.push({
            date: format(date, 'yyyy-MM'),
            ac: metrics.ac * factor,
            ev: metrics.ev * factor,
            pv: metrics.pv * factor,
            type: 'history'
        });
    }

    // 当前点
    data.push({
        date: format(today, 'yyyy-MM'),
        ac: metrics.ac,
        ev: metrics.ev,
        pv: metrics.pv,
        type: 'current'
    });

    // 未来预测（基于 EAC 线性推演）
    const remainingMonths = months;
    const monthlyBurnRate = metrics.etc / remainingMonths;

    for (let i = 1; i <= remainingMonths; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        data.push({
            date: format(date, 'yyyy-MM'),
            ac: metrics.ac + (monthlyBurnRate * i), // 预测的 AC 走向 EAC
            bac: metrics.bac, // 预算基准线
            type: 'forecast'
        });
    }

    return data;
};

import { format } from 'date-fns';
