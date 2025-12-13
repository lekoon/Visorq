import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

/**
 * 标准按钮组件
 * 提供统一的按钮样式、尺寸和变体
 */
const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    disabled = false,
    className = '',
    type = 'button'
}) => {
    const baseClasses = 'flex items-center gap-2 rounded-lg transition-colors font-medium';

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
        secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:bg-slate-50',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
        success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300',
        ghost: 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:text-slate-300'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const iconSize = {
        sm: 16,
        md: 18,
        lg: 20
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {Icon && iconPosition === 'left' && <Icon size={iconSize[size]} />}
            <span>{children}</span>
            {Icon && iconPosition === 'right' && <Icon size={iconSize[size]} />}
        </button>
    );
};

export default Button;
