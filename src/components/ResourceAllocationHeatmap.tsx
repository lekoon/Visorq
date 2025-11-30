/**
 * Resource Allocation Heatmap
 * Visual representation of resource allocation over time
 */

import React, { useMemo } from 'react';
import type { TimeBucket, ResourceLoad } from '../utils/resourcePlanning';

interface ResourceAllocationHeatmapProps {
    resourceLoads: ResourceLoad[];
    buckets: TimeBucket[];
}

const ResourceAllocationHeatmap: React.FC<ResourceAllocationHeatmapProps> = ({
    resourceLoads,
    buckets,
}) => {
    const heatmapData = useMemo(() => {
        return resourceLoads.map((load) => {
            const cells = buckets.map((bucket) => {
                const alloc = load.allocations[bucket.label];
                const used = alloc ? alloc.total : 0;
                const utilization = load.capacity > 0 ? (used / load.capacity) * 100 : 0;

                return {
                    month: bucket.label,
                    used,
                    capacity: load.capacity,
                    utilization,
                    projects: alloc ? alloc.projects : [],
                };
            });

            return {
                resourceName: load.resourceName,
                cells,
            };
        });
    }, [resourceLoads, buckets]);

    const getHeatColor = (utilization: number) => {
        if (utilization === 0) return 'bg-slate-50';
        if (utilization < 25) return 'bg-blue-100';
        if (utilization < 50) return 'bg-green-100';
        if (utilization < 75) return 'bg-yellow-100';
        if (utilization < 100) return 'bg-orange-100';
        return 'bg-red-200';
    };

    const getTextColor = (utilization: number) => {
        if (utilization === 0) return 'text-slate-400';
        if (utilization < 25) return 'text-blue-700';
        if (utilization < 50) return 'text-green-700';
        if (utilization < 75) return 'text-yellow-700';
        if (utilization < 100) return 'text-orange-700';
        return 'text-red-700';
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">资源分配热力图</h2>
                <p className="text-sm text-slate-600 mt-1">查看资源在不同时间段的分配情况</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-r border-slate-200">
                                资源
                            </th>
                            {buckets.map((bucket, index) => (
                                <th
                                    key={index}
                                    className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 min-w-[100px]"
                                >
                                    {bucket.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {heatmapData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                                <td className="sticky left-0 bg-white z-10 px-4 py-3 font-medium text-sm text-slate-900 border-r border-slate-200">
                                    {row.resourceName}
                                </td>
                                {row.cells.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`px-4 py-3 text-center border-r border-b border-slate-100 ${getHeatColor(
                                            cell.utilization
                                        )} transition-colors group relative`}
                                    >
                                        <div className={`text-sm font-semibold ${getTextColor(cell.utilization)}`}>
                                            {Math.round(cell.utilization)}%
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {cell.used}/{cell.capacity}
                                        </div>

                                        {/* Tooltip */}
                                        {cell.projects.length > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                                <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-[200px]">
                                                    <div className="font-semibold mb-2">分配到的项目:</div>
                                                    {cell.projects.map((proj, idx) => (
                                                        <div key={idx} className="flex justify-between items-center py-1">
                                                            <span className="truncate">{proj.name}</span>
                                                            <span className="ml-2 font-mono">{proj.amount}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6">
                <div className="text-xs text-slate-600">利用率:</div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
                    <span className="text-xs text-slate-600">0%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded"></div>
                    <span className="text-xs text-slate-600">1-25%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <span className="text-xs text-slate-600">26-50%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                    <span className="text-xs text-slate-600">51-75%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-100 rounded"></div>
                    <span className="text-xs text-slate-600">76-99%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 rounded"></div>
                    <span className="text-xs text-slate-600">≥100%</span>
                </div>
            </div>
        </div>
    );
};

export default ResourceAllocationHeatmap;
