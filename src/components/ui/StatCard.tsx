import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Card from './Card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

/**
 * 标准统计卡片组件
 * 用于显示关键指标和统计数据
 */
const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    iconColor = 'blue',
    trend,
    className = ''
}) => {
    const iconColorClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
    };

    return (
        <Card className={className} padding="md">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {value}
                    </p>
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${iconColorClasses[iconColor]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </Card>
    );
};

export default StatCard;
