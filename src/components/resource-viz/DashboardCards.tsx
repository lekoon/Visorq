import React from 'react';
import { Users, AlertTriangle, Zap, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardCardsProps {
    totalProjects: number;
    overloadedCount: number;
    p0SatisfactionRate: number;
    totalManDays: number;
}

const DashboardCards: React.FC<DashboardCardsProps> = ({
    totalProjects,
    overloadedCount,
    p0SatisfactionRate,
    totalManDays
}) => {
    const { t } = useTranslation();

    const cards = [
        {
            title: t('dashboard.totalProjects'),
            value: totalProjects,
            icon: Zap,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: t('dashboard.overloadedCount'),
            value: overloadedCount,
            icon: AlertTriangle,
            color: 'bg-red-500',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            warning: overloadedCount > 0
        },
        {
            title: t('dashboard.p0Satisfaction'),
            value: `${p0SatisfactionRate}%`,
            icon: Users,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: t('dashboard.totalManDays'),
            value: totalManDays,
            icon: Clock,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.bgColor}`}>
                                <Icon className={card.textColor} size={24} />
                            </div>
                            {card.warning && (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium mb-1">{card.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DashboardCards;
