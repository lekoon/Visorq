import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import type { ResourcePoolItem, Project } from '../types';
import { predictResourceLoad, analyzePredictions } from '../utils/resourcePrediction';

interface ResourceLoadForecastProps {
    resource: ResourcePoolItem;
    historicalProjects: Project[];
    futureMonths?: number;
}

const ResourceLoadForecast: React.FC<ResourceLoadForecastProps> = ({
    resource,
    historicalProjects,
    futureMonths = 6
}) => {
    // 获取预测数据
    const prediction = useMemo(() => {
        return predictResourceLoad(resource, historicalProjects, futureMonths);
    }, [resource, historicalProjects, futureMonths]);

    // 分析预测结果
    const analysis = useMemo(() => {
        return analyzePredictions([prediction], [resource]);
    }, [prediction, resource]);

    // 计算图表数据
    const chartData = useMemo(() => {
        const maxValue = Math.max(
            resource.totalQuantity,
            prediction.peakLoad,
            ...prediction.predictions.map(p => p.predicted)
        );
        const scale = 100 / (maxValue * 1.2); // 留20%余量

        return prediction.predictions.map(p => ({
            ...p,
            height: p.predicted * scale,
            isOverload: p.predicted > resource.totalQuantity,
            capacityHeight: resource.totalQuantity * scale
        }));
    }, [prediction, resource.totalQuantity]);

    const getTrendIcon = () => {
        switch (prediction.trend) {
            case 'increasing':
                return <TrendingUp size={16} className="text-red-600" />;
            case 'decreasing':
                return <TrendingDown size={16} className="text-green-600" />;
            default:
                return <Minus size={16} className="text-slate-600" />;
        }
    };

    const getTrendText = () => {
        switch (prediction.trend) {
            case 'increasing':
                return '上升趋势';
            case 'decreasing':
                return '下降趋势';
            default:
                return '稳定';
        }
    };

    const getTrendColor = () => {
        switch (prediction.trend) {
            case 'increasing':
                return 'text-red-600 bg-red-50';
            case 'decreasing':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{resource.name} - 负载预测</h3>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${getTrendColor()}`}>
                        {getTrendIcon()}
                        {getTrendText()}
                    </div>
                </div>
                <div className="text-sm text-slate-500">
                    容量: {resource.totalQuantity} 人 | 峰值预测: {prediction.peakLoad} 人 ({prediction.peakMonth})
                </div>
            </div>

            {/* 图表区域 */}
            <div className="p-6">
                {/* 图例 */}
                <div className="flex items-center gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-slate-600">预测负载</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-slate-600">超载</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-dashed border-green-500"></div>
                        <span className="text-slate-600">容量上限</span>
                    </div>
                </div>

                {/* 柱状图 */}
                <div className="relative h-64 flex items-end gap-2">
                    {chartData.map((data, index) => (
                        <div key={index} className="flex-1 relative group">
                            {/* 容量线 */}
                            <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-green-500 opacity-50"
                                style={{ bottom: `${data.capacityHeight}%` }}
                            />

                            {/* 柱子 */}
                            <div
                                className={`w-full rounded-t transition-all ${data.isOverload ? 'bg-red-500' : 'bg-blue-500'
                                    } hover:opacity-80 cursor-pointer relative`}
                                style={{ height: `${data.height}%` }}
                            >
                                {/* 悬浮提示 */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                    <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                        <div className="font-medium">{data.month}</div>
                                        <div>预测: {data.predicted} 人</div>
                                        <div>置信度: {data.confidence}%</div>
                                        {data.isOverload && (
                                            <div className="text-red-300">⚠️ 超载</div>
                                        )}
                                    </div>
                                    <div className="w-2 h-2 bg-slate-900 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                                </div>
                            </div>

                            {/* 月份标签 */}
                            <div className="text-xs text-slate-500 text-center mt-2 transform -rotate-45 origin-top-left">
                                {data.month.split('-')[1]}月
                            </div>

                            {/* 置信度指示器 */}
                            <div className="absolute -top-1 right-0 w-1 h-1 rounded-full"
                                style={{
                                    backgroundColor: data.confidence > 70 ? '#10B981' :
                                        data.confidence > 50 ? '#F59E0B' : '#EF4444'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Y轴标签 */}
                <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-slate-500 pr-2 text-right">
                    <span>{Math.round(resource.totalQuantity * 1.2)}</span>
                    <span>{Math.round(resource.totalQuantity * 0.9)}</span>
                    <span>{Math.round(resource.totalQuantity * 0.6)}</span>
                    <span>{Math.round(resource.totalQuantity * 0.3)}</span>
                    <span>0</span>
                </div>
            </div>

            {/* 分析和建议 */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                {/* 总结 */}
                <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700">
                        {analysis.summary}
                    </div>
                </div>

                {/* 警告 */}
                {analysis.warnings.length > 0 && (
                    <div className="space-y-2">
                        {analysis.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-slate-700">{warning}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 机会 */}
                {analysis.opportunities.length > 0 && (
                    <div className="space-y-2">
                        {analysis.opportunities.map((opportunity, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <TrendingUp size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-slate-700">{opportunity}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 详细数据表格 */}
            <div className="p-4 border-t border-slate-200">
                <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 flex items-center gap-2">
                        <span>查看详细数据</span>
                        <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-slate-600 font-medium">月份</th>
                                    <th className="px-3 py-2 text-right text-slate-600 font-medium">预测值</th>
                                    <th className="px-3 py-2 text-right text-slate-600 font-medium">置信度</th>
                                    <th className="px-3 py-2 text-right text-slate-600 font-medium">利用率</th>
                                    <th className="px-3 py-2 text-center text-slate-600 font-medium">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {prediction.predictions.map((pred, index) => {
                                    const utilization = (pred.predicted / resource.totalQuantity) * 100;
                                    return (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 text-slate-900">{pred.month}</td>
                                            <td className="px-3 py-2 text-right text-slate-900">{pred.predicted} 人</td>
                                            <td className="px-3 py-2 text-right">
                                                <span className={`${pred.confidence > 70 ? 'text-green-600' :
                                                        pred.confidence > 50 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {pred.confidence}%
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className={`${utilization > 100 ? 'text-red-600 font-semibold' :
                                                        utilization > 80 ? 'text-yellow-600' : 'text-green-600'
                                                    }`}>
                                                    {utilization.toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {utilization > 100 ? (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">超载</span>
                                                ) : utilization > 80 ? (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">高负载</span>
                                                ) : utilization > 30 ? (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">正常</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">空闲</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default ResourceLoadForecast;
