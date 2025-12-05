import type { Project, ResourcePoolItem } from '../types';
import { parseISO, addMonths, format, differenceInMonths } from 'date-fns';

export interface ResourceLoadPrediction {
    resourceId: string;
    resourceName: string;
    predictions: {
        month: string;
        predicted: number;
        actual?: number;
        confidence: number;
    }[];
    trend: 'increasing' | 'decreasing' | 'stable';
    peakMonth: string;
    peakLoad: number;
}

/**
 * 简单移动平均预测
 */
const simpleMovingAverage = (data: number[], window: number = 3): number => {
    if (data.length === 0) return 0;
    if (data.length < window) window = data.length;

    const recent = data.slice(-window);
    return recent.reduce((sum, val) => sum + val, 0) / recent.length;
};

/**
 * 线性回归预测
 */
const linearRegression = (data: number[]): { slope: number; intercept: number } => {
    const n = data.length;
    if (n === 0) return { slope: 0, intercept: 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

/**
 * 计算历史资源负载
 */
const calculateHistoricalLoad = (
    resource: ResourcePoolItem,
    projects: Project[],
    months: number = 12
): { month: string; load: number }[] => {
    const now = new Date();
    const history: { month: string; load: number }[] = [];

    for (let i = months; i > 0; i--) {
        const targetMonth = addMonths(now, -i);
        const monthStr = format(targetMonth, 'yyyy-MM');

        let load = 0;

        for (const project of projects) {
            if (!project.startDate || !project.endDate) continue;

            const projectStart = parseISO(project.startDate);
            const projectEnd = parseISO(project.endDate);

            // 检查项目是否在该月活跃
            const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
            const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

            if (projectStart <= monthEnd && projectEnd >= monthStart) {
                const req = project.resourceRequirements?.find(r => r.resourceId === resource.id);
                if (req) {
                    load += req.count;
                }
            }
        }

        history.push({ month: monthStr, load });
    }

    return history;
};

/**
 * 预测未来资源负载
 */
export const predictResourceLoad = (
    resource: ResourcePoolItem,
    historicalProjects: Project[],
    futureMonths: number = 6,
    method: 'sma' | 'linear' = 'sma'
): ResourceLoadPrediction => {
    // 获取历史数据
    const history = calculateHistoricalLoad(resource, historicalProjects, 12);
    const historicalLoads = history.map(h => h.load);

    // 计算趋势
    const { slope } = linearRegression(historicalLoads);
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (slope > 0.5) trend = 'increasing';
    else if (slope < -0.5) trend = 'decreasing';

    // 预测未来
    const predictions: ResourceLoadPrediction['predictions'] = [];
    const now = new Date();

    for (let i = 1; i <= futureMonths; i++) {
        const targetMonth = addMonths(now, i);
        const monthStr = format(targetMonth, 'yyyy-MM');

        let predicted = 0;
        let confidence = 100;

        if (method === 'sma') {
            predicted = simpleMovingAverage(historicalLoads, 3);
            confidence = Math.max(50, 100 - i * 10); // 越远越不确定
        } else {
            const { slope: s, intercept } = linearRegression(historicalLoads);
            predicted = s * (historicalLoads.length + i) + intercept;
            confidence = Math.max(40, 100 - i * 12);
        }

        // 确保预测值合理
        predicted = Math.max(0, Math.round(predicted));
        predicted = Math.min(resource.totalQuantity * 1.5, predicted); // 最多超载 50%

        predictions.push({
            month: monthStr,
            predicted,
            confidence
        });
    }

    // 找出峰值
    const allLoads = [...historicalLoads, ...predictions.map(p => p.predicted)];
    const peakLoad = Math.max(...allLoads);
    const peakIndex = allLoads.indexOf(peakLoad);
    const peakMonth = peakIndex < historicalLoads.length
        ? history[peakIndex].month
        : predictions[peakIndex - historicalLoads.length].month;

    return {
        resourceId: resource.id,
        resourceName: resource.name,
        predictions,
        trend,
        peakMonth,
        peakLoad
    };
};

/**
 * 预测所有资源的负载
 */
export const predictAllResourceLoads = (
    resourcePool: ResourcePoolItem[],
    historicalProjects: Project[],
    futureMonths: number = 6
): ResourceLoadPrediction[] => {
    return resourcePool.map(resource =>
        predictResourceLoad(resource, historicalProjects, futureMonths)
    );
};

/**
 * 分析预测结果并生成警告
 */
export const analyzePredictions = (
    predictions: ResourceLoadPrediction[],
    resourcePool: ResourcePoolItem[]
): {
    warnings: string[];
    opportunities: string[];
    summary: string;
} => {
    const warnings: string[] = [];
    const opportunities: string[] = [];

    for (const pred of predictions) {
        const resource = resourcePool.find(r => r.id === pred.resourceId);
        if (!resource) continue;

        // 检查是否会超载
        const overloadMonths = pred.predictions.filter(
            p => p.predicted > resource.totalQuantity
        );

        if (overloadMonths.length > 0) {
            warnings.push(
                `${pred.resourceName} 预计在 ${overloadMonths[0].month} 开始超载，` +
                `峰值 ${pred.peakLoad}/${resource.totalQuantity}`
            );
        }

        // 检查是否利用率过低
        const underutilizedMonths = pred.predictions.filter(
            p => p.predicted < resource.totalQuantity * 0.3
        );

        if (underutilizedMonths.length >= 3) {
            opportunities.push(
                `${pred.resourceName} 未来 ${underutilizedMonths.length} 个月利用率较低，` +
                `可承接新项目`
            );
        }

        // 趋势警告
        if (pred.trend === 'increasing') {
            const lastPrediction = pred.predictions[pred.predictions.length - 1];
            if (lastPrediction.predicted > resource.totalQuantity * 0.8) {
                warnings.push(
                    `${pred.resourceName} 需求呈上升趋势，建议提前规划扩充`
                );
            }
        }
    }

    // 生成总结
    let summary = '';
    if (warnings.length > 0) {
        summary += `发现 ${warnings.length} 个潜在风险。`;
    }
    if (opportunities.length > 0) {
        summary += `发现 ${opportunities.length} 个优化机会。`;
    }
    if (warnings.length === 0 && opportunities.length === 0) {
        summary = '资源负载预测正常，无明显风险。';
    }

    return { warnings, opportunities, summary };
};

/**
 * 计算预测准确度（如果有实际数据）
 */
export const calculatePredictionAccuracy = (
    predictions: ResourceLoadPrediction['predictions'],
    actualLoads: { month: string; load: number }[]
): number => {
    let totalError = 0;
    let count = 0;

    for (const pred of predictions) {
        const actual = actualLoads.find(a => a.month === pred.month);
        if (actual) {
            const error = Math.abs(pred.predicted - actual.load);
            totalError += error;
            count++;
        }
    }

    if (count === 0) return 0;

    const avgError = totalError / count;
    // 转换为准确度百分比（假设最大误差为 10）
    const accuracy = Math.max(0, 100 - (avgError / 10) * 100);

    return accuracy;
};
