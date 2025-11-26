import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Skeleton Card for project lists
export const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
            <Skeleton width={200} height={24} />
            <Skeleton variant="circular" width={40} height={40} />
        </div>
        <Skeleton width="100%" height={16} className="mb-2" />
        <Skeleton width="80%" height={16} className="mb-4" />
        <div className="flex gap-2">
            <Skeleton width={80} height={24} />
            <Skeleton width={80} height={24} />
        </div>
    </div>
);

// Skeleton Table Row
export const SkeletonTableRow: React.FC = () => (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-700">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
            <Skeleton width={200} height={20} className="mb-2" />
            <Skeleton width={150} height={16} />
        </div>
        <Skeleton width={100} height={32} />
    </div>
);

// Skeleton Dashboard
export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <Skeleton width={120} height={16} className="mb-4" />
                    <Skeleton width={80} height={32} className="mb-2" />
                    <Skeleton width={100} height={14} />
                </div>
            ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <Skeleton width={200} height={24} className="mb-6" />
                    <Skeleton width="100%" height={300} />
                </div>
            ))}
        </div>
    </div>
);

export default Skeleton;
