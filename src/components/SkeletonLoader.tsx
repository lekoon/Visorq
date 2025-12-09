import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="animate-pulse space-y-6 p-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-10 flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
