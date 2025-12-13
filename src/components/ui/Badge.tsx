import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
    rounded?: 'default' | 'full';
    className?: string;
}

/**
 * 标准徽章组件
 * 用于显示状态、标签和分类
 */
const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    size = 'md',
    rounded = 'default',
    className = ''
}) => {
    const variantClasses = {
        primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
        neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base'
    };

    const roundedClasses = {
        default: 'rounded',
        full: 'rounded-full'
    };

    return (
        <span
            className={`inline-flex items-center font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClasses[rounded]} ${className}`}
        >
            {children}
        </span>
    );
};

export default Badge;
