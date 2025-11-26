import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User, Users } from 'lucide-react';
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import type { ResourcePoolItem, TeamMember } from '../../types';
import clsx from 'clsx';

interface ResourceHeatmapProps {
    resources: ResourcePoolItem[];
    startDate?: Date;
    weeksToShow?: number;
}

const ResourceHeatmap: React.FC<ResourceHeatmapProps> = ({
    resources,
    startDate = new Date(),
    weeksToShow = 4
}) => {
    const [expandedGroups, setExpandedGroups] = useState<string[]>(resources.map(r => r.id));
    const [viewMode, setViewMode] = useState<'member' | 'group'>('member');

    const start = startOfWeek(startDate, { weekStartsOn: 1 });
    const weeks = Array.from({ length: weeksToShow }).map((_, i) => {
        const weekStart = addWeeks(start, i);
        return {
            label: `Week ${format(weekStart, 'w')}`,
            date: weekStart,
            days: eachDayOfInterval({
                start: weekStart,
                end: endOfWeek(weekStart, { weekStartsOn: 1 })
            })
        };
    });

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    // 模拟计算负载颜色
    const getLoadColor = (load: number) => {
        if (load === 0) return 'bg-slate-50';
        if (load < 50) return 'bg-green-100 hover:bg-green-200';
        if (load < 80) return 'bg-blue-100 hover:bg-blue-200';
        if (load <= 100) return 'bg-indigo-100 hover:bg-indigo-200';
        return 'bg-red-100 hover:bg-red-200';
    };

    const getLoadText = (load: number) => {
        if (load === 0) return '-';
        return `${load}%`;
    };

    // 模拟获取某人某天的负载
    const getMemberLoad = (memberId: string, date: Date) => {
        // 这里应该从真实数据计算，现在用随机数模拟演示效果
        // 实际项目中需要根据 assignments 计算
        const day = date.getDay();
        if (day === 0 || day === 6) return 0; // 周末
        return Math.floor(Math.random() * 120);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Resource Heatmap</h3>
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    <button
                        onClick={() => setViewMode('member')}
                        className={clsx(
                            "px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
                            viewMode === 'member' ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <User size={16} /> Members
                    </button>
                    <button
                        onClick={() => setViewMode('group')}
                        className={clsx(
                            "px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
                            viewMode === 'group' ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Users size={16} /> Groups
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 text-left min-w-[200px] bg-slate-50 border-b border-r border-slate-200 sticky left-0 z-10">
                                Resource / Team
                            </th>
                            {weeks.map(week => (
                                <th key={week.label} colSpan={5} className="p-2 text-center bg-slate-50 border-b border-r border-slate-200 text-xs font-semibold text-slate-600">
                                    {week.label} <br />
                                    <span className="font-normal text-slate-400">{format(week.date, 'MMM d')}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map(resource => (
                            <React.Fragment key={resource.id}>
                                {/* Resource Group Header */}
                                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <td className="p-2 border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-10">
                                        <button
                                            onClick={() => toggleGroup(resource.id)}
                                            className="flex items-center gap-2 w-full text-left font-bold text-slate-700"
                                        >
                                            {expandedGroups.includes(resource.id) ? (
                                                <ChevronDown size={16} />
                                            ) : (
                                                <ChevronRight size={16} />
                                            )}
                                            {resource.name}
                                            <span className="text-xs font-normal text-slate-500 ml-auto">
                                                {resource.totalQuantity} members
                                            </span>
                                        </button>
                                    </td>
                                    {/* Group Summary Cells (Placeholder) */}
                                    {weeks.map((week, idx) => (
                                        <td key={idx} colSpan={5} className="border-b border-r border-slate-200 bg-slate-50/50"></td>
                                    ))}
                                </tr>

                                {/* Members Rows */}
                                {expandedGroups.includes(resource.id) && resource.members?.map(member => (
                                    <tr key={member.id} className="group">
                                        <td className="p-2 pl-8 border-b border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{member.name}</div>
                                                    <div className="text-xs text-slate-500">{member.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {weeks.map(week => (
                                            week.days.slice(0, 5).map(day => { // Show Mon-Fri
                                                const load = getMemberLoad(member.id, day);
                                                return (
                                                    <td
                                                        key={day.toISOString()}
                                                        className={clsx(
                                                            "border-b border-slate-100 text-center text-xs cursor-pointer transition-colors relative group/cell",
                                                            getLoadColor(load)
                                                        )}
                                                    >
                                                        <div className="h-8 flex items-center justify-center">
                                                            {load > 0 && (
                                                                <span className={load > 100 ? "text-red-700 font-bold" : "text-slate-600"}>
                                                                    {load}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Tooltip */}
                                                        {load > 0 && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50 w-48 bg-slate-900 text-white p-2 rounded-lg text-xs shadow-xl pointer-events-none">
                                                                <div className="font-bold mb-1">{format(day, 'EEE, MMM d')}</div>
                                                                <div className="flex justify-between">
                                                                    <span>Project A:</span>
                                                                    <span>4h</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Project B:</span>
                                                                    <span>4h</span>
                                                                </div>
                                                                <div className="border-t border-slate-700 mt-1 pt-1 flex justify-between font-bold">
                                                                    <span>Total:</span>
                                                                    <span>{load}%</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResourceHeatmap;
