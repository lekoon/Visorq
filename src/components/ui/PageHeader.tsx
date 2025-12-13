import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

/**
 * 标准页面头部组件
 * 提供统一的页面标题、描述和操作按钮布局
 */
const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    actions,
    className = ''
}) => {
    return (
        <div className={`mb-6 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
