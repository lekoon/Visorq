import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Target, Activity, ArrowRight } from 'lucide-react';
import type { Project, Task } from '../types';
import { calculateEVM, generateCostTrend } from '../utils/costControl';

interface CostControlPanelProps {
    project: Project;
    tasks: Task[];
}

const CostControlPanel: React.FC<CostControlPanelProps> = ({ project, tasks }) => {
    const metrics = useMemo(() => calculateEVM(project, tasks), [project, tasks]);
    const trendData = useMemo(() => generateCostTrend(metrics), [metrics]);

    const formatCurrency = (val: number) => `¥${Math.round(val).toLocaleString()}`;

    return (
        <div className="space-y-6">
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CPI */}
                <div className={`p-4 rounded-lg border-2 ${metrics.cpi >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">成本绩效 (CPI)</span>
                        <Activity size={18} className={metrics.cpi >= 1 ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{metrics.cpi.toFixed(2)}</div>
                    <div className="text-xs mt-1 text-slate-500">
                        {metrics.cpi >= 1 ? '预算内' : `超支 ${((1 - metrics.cpi) * 100).toFixed(0)}%`}
                    </div>
                </div>

                {/* SPI */}
                <div className={`p-4 rounded-lg border-2 ${metrics.spi >= 1 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">进度绩效 (SPI)</span>
                        <Activity size={18} className={metrics.spi >= 1 ? 'text-green-600' : 'text-yellow-600'} />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{metrics.spi.toFixed(2)}</div>
                    <div className="text-xs mt-1 text-slate-500">
                        {metrics.spi >= 1 ? '提前' : `滞后 ${((1 - metrics.spi) * 100).toFixed(0)}%`}
                    </div>
                </div>

                {/* CV */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">成本偏差 (CV)</span>
                        <DollarSign size={18} className={metrics.cv >= 0 ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div className={`text-2xl font-bold ${metrics.cv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.cv >= 0 ? '+' : ''}{formatCurrency(metrics.cv)}
                    </div>
                    <div className="text-xs mt-1 text-slate-500">EV - AC</div>
                </div>

                {/* SV */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">进度偏差 (SV)</span>
                        <Target size={18} className={metrics.sv >= 0 ? 'text-green-600' : 'text-yellow-600'} />
                    </div>
                    <div className={`text-2xl font-bold ${metrics.sv >= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {metrics.sv >= 0 ? '+' : ''}{formatCurrency(metrics.sv)}
                    </div>
                    <div className="text-xs mt-1 text-slate-500">EV - PV</div>
                </div>
            </div>

            {/* 预测分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 预测详情 */}
                <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        完工预测 (EAC)
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">完工预算 (BAC)</span>
                                <span className="font-medium text-slate-900">{formatCurrency(metrics.bac)}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-slate-400 h-2 rounded-full w-full opacity-30"></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">完工估算 (EAC)</span>
                                <span className={`font-bold ${metrics.vac >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(metrics.eac)}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 relative">
                                {/* BAC 标记 */}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10" style={{ left: '80%' }} title="BAC"></div>
                                {/* EAC 进度 */}
                                <div
                                    className={`h-2 rounded-full ${metrics.vac >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, (metrics.eac / (metrics.bac * 1.2)) * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                预计{metrics.vac >= 0 ? '结余' : '超支'} {formatCurrency(Math.abs(metrics.vac))}
                            </p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 mb-2">完工尚需 (ETC)</div>
                            <div className="text-2xl font-bold text-blue-700">{formatCurrency(metrics.etc)}</div>
                            <p className="text-xs text-blue-600 mt-1">
                                还需要投入的资金以完成剩余工作
                            </p>
                        </div>
                    </div>
                </div>

                {/* 趋势图表 (模拟) */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 flex flex-col">
                    <h3 className="font-semibold text-slate-900 mb-4">成本趋势预测</h3>
                    <div className="flex-1 flex items-end gap-4 min-h-[200px] relative pt-8">
                        {/* 简单的柱状/折线图模拟 */}
                        {trendData.map((d, i) => {
                            const maxVal = Math.max(metrics.eac, metrics.bac) * 1.1;
                            const height = (d.ac || d.bac || 0) / maxVal * 100;

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group relative">
                                    {/* 柱子 */}
                                    <div
                                        className={`w-full max-w-[40px] rounded-t transition-all ${d.type === 'history' ? 'bg-slate-300' :
                                                d.type === 'current' ? 'bg-blue-600' :
                                                    'bg-blue-100 border-t-2 border-dashed border-blue-400'
                                            }`}
                                        style={{ height: `${height}%` }}
                                    ></div>

                                    {/* 标签 */}
                                    <div className="text-xs text-slate-500 mt-2 rotate-45 origin-top-left">
                                        {d.date}
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded z-10 whitespace-nowrap">
                                        <div>{d.date}</div>
                                        <div>{d.type === 'forecast' ? '预测' : '实际'}: {formatCurrency(d.ac || d.bac || 0)}</div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* BAC 参考线 */}
                        <div
                            className="absolute left-0 right-0 border-t-2 border-dashed border-slate-400 pointer-events-none flex items-center"
                            style={{ bottom: `${(metrics.bac / (Math.max(metrics.eac, metrics.bac) * 1.1)) * 100}%` }}
                        >
                            <span className="bg-white text-xs text-slate-500 px-1 ml-2">BAC (预算)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 建议行动 */}
            {metrics.vac < 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                        <h4 className="font-medium text-red-900 mb-1">成本超支预警</h4>
                        <p className="text-sm text-red-700 mb-2">
                            按照当前绩效 (CPI = {metrics.cpi.toFixed(2)})，项目预计将超支 {formatCurrency(Math.abs(metrics.vac))}。
                        </p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors">
                                查看详细支出
                            </button>
                            <button className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded text-xs font-medium hover:bg-red-50 transition-colors">
                                申请预算变更
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostControlPanel;
