import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * 标准页面容器组件
 * 提供统一的页面背景、内边距和最小高度
 */
const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 p-6 ${className}`}>
            {children}
        </div>
    );
};

export default PageContainer;
