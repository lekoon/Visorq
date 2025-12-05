import React, { useState, useMemo } from 'react';
import { Activity, Filter, User, FileText, DollarSign, AlertTriangle, CheckCircle, Edit, Trash, MessageCircle, UserPlus } from 'lucide-react';
import type { ActivityLog } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ActivityLogProps {
    logs: ActivityLog[];
    projectId?: string;
}

const ActivityLogComponent: React.FC<ActivityLogProps> = ({
    logs,
    projectId
}) => {
    const [actionFilter, setActionFilter] = useState<ActivityLog['action'] | 'all'>('all');
    const [entityFilter, setEntityFilter] = useState<ActivityLog['entityType'] | 'all'>('all');
    const [userFilter, setUserFilter] = useState<string>('all');

    // 过滤日志
    const filteredLogs = useMemo(() => {
        let filtered = logs;

        if (projectId) {
            filtered = filtered.filter(log => log.projectId === projectId);
        }

        if (actionFilter !== 'all') {
            filtered = filtered.filter(log => log.action === actionFilter);
        }

        if (entityFilter !== 'all') {
            filtered = filtered.filter(log => log.entityType === entityFilter);
        }

        if (userFilter !== 'all') {
            filtered = filtered.filter(log => log.userId === userFilter);
        }

        return filtered.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [logs, projectId, actionFilter, entityFilter, userFilter]);

    // 获取唯一用户列表
    const users = useMemo(() => {
        const userMap = new Map<string, string>();
        logs.forEach(log => {
            userMap.set(log.userId, log.userName);
        });
        return Array.from(userMap.entries());
    }, [logs]);

    const getActionIcon = (action: ActivityLog['action']) => {
        switch (action) {
            case 'created':
                return <CheckCircle size={16} />;
            case 'updated':
                return <Edit size={16} />;
            case 'deleted':
                return <Trash size={16} />;
            case 'commented':
                return <MessageCircle size={16} />;
            case 'assigned':
                return <UserPlus size={16} />;
            case 'completed':
                return <CheckCircle size={16} />;
            case 'status_changed':
                return <Activity size={16} />;
        }
    };

    const getActionColor = (action: ActivityLog['action']) => {
        switch (action) {
            case 'created':
                return 'bg-green-100 text-green-700';
            case 'updated':
                return 'bg-blue-100 text-blue-700';
            case 'deleted':
                return 'bg-red-100 text-red-700';
            case 'commented':
                return 'bg-yellow-100 text-yellow-700';
            case 'assigned':
                return 'bg-purple-100 text-purple-700';
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'status_changed':
                return 'bg-orange-100 text-orange-700';
        }
    };

    const getActionLabel = (action: ActivityLog['action']) => {
        switch (action) {
            case 'created':
                return '创建';
            case 'updated':
                return '更新';
            case 'deleted':
                return '删除';
            case 'commented':
                return '评论';
            case 'assigned':
                return '分配';
            case 'completed':
                return '完成';
            case 'status_changed':
                return '状态变更';
        }
    };

    const getEntityIcon = (entityType: ActivityLog['entityType']) => {
        switch (entityType) {
            case 'project':
                return <FileText size={14} />;
            case 'task':
                return <CheckCircle size={14} />;
            case 'resource':
                return <User size={14} />;
            case 'risk':
                return <AlertTriangle size={14} />;
            case 'cost':
                return <DollarSign size={14} />;
        }
    };

    const getEntityLabel = (entityType: ActivityLog['entityType']) => {
        switch (entityType) {
            case 'project':
                return '项目';
            case 'task':
                return '任务';
            case 'resource':
                return '资源';
            case 'risk':
                return '风险';
            case 'cost':
                return '成本';
        }
    };

    const formatTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 7) return `${days}天前`;
            return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
        } catch {
            return timestamp;
        }
    };

    // 按日期分组
    const groupedLogs = useMemo(() => {
        const groups = new Map<string, ActivityLog[]>();

        filteredLogs.forEach(log => {
            try {
                const date = format(new Date(log.timestamp), 'yyyy-MM-dd', { locale: zhCN });
                if (!groups.has(date)) {
                    groups.set(date, []);
                }
                groups.get(date)!.push(log);
            } catch {
                // 忽略无效日期
            }
        });

        return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filteredLogs]);

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Activity size={20} className="text-blue-600" />
                        <h3 className="font-semibold text-slate-900">活动日志</h3>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                            {filteredLogs.length}
                        </span>
                    </div>
                </div>

                {/* 过滤器 */}
                <div className="grid grid-cols-3 gap-2">
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value as any)}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="all">所有操作</option>
                        <option value="created">创建</option>
                        <option value="updated">更新</option>
                        <option value="deleted">删除</option>
                        <option value="commented">评论</option>
                        <option value="assigned">分配</option>
                        <option value="completed">完成</option>
                        <option value="status_changed">状态变更</option>
                    </select>

                    <select
                        value={entityFilter}
                        onChange={(e) => setEntityFilter(e.target.value as any)}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="all">所有类型</option>
                        <option value="project">项目</option>
                        <option value="task">任务</option>
                        <option value="resource">资源</option>
                        <option value="risk">风险</option>
                        <option value="cost">成本</option>
                    </select>

                    <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="all">所有用户</option>
                        {users.map(([userId, userName]) => (
                            <option key={userId} value={userId}>{userName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 日志列表 */}
            <div className="max-h-[600px] overflow-y-auto">
                {groupedLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Activity size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">暂无活动记录</p>
                    </div>
                ) : (
                    groupedLogs.map(([date, dayLogs]) => (
                        <div key={date}>
                            {/* 日期分隔 */}
                            <div className="sticky top-0 px-4 py-2 bg-slate-100 border-b border-slate-200 text-sm font-medium text-slate-700 z-10">
                                {date === format(new Date(), 'yyyy-MM-dd', { locale: zhCN }) ? '今天' :
                                    date === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd', { locale: zhCN }) ? '昨天' :
                                        date}
                            </div>

                            {/* 当天的日志 */}
                            <div className="divide-y divide-slate-100">
                                {dayLogs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex gap-3">
                                            {/* 用户头像 */}
                                            <div className="flex-shrink-0">
                                                {log.userAvatar ? (
                                                    <img
                                                        src={log.userAvatar}
                                                        alt={log.userName}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                                        {log.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* 操作描述 */}
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-medium text-slate-900 text-sm">
                                                        {log.userName}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getActionColor(log.action)}`}>
                                                        {getActionIcon(log.action)}
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                    <span className="text-slate-500 text-xs flex items-center gap-1">
                                                        {getEntityIcon(log.entityType)}
                                                        {getEntityLabel(log.entityType)}
                                                    </span>
                                                    <span className="font-medium text-slate-900 text-sm">
                                                        {log.entityName}
                                                    </span>
                                                </div>

                                                {/* 详细描述 */}
                                                <p className="text-sm text-slate-600 mb-1">
                                                    {log.description}
                                                </p>

                                                {/* 时间 */}
                                                <span className="text-xs text-slate-400">
                                                    {formatTime(log.timestamp)}
                                                </span>

                                                {/* 元数据 */}
                                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                    <details className="mt-2 group">
                                                        <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-700">
                                                            查看详情
                                                        </summary>
                                                        <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                                                            <pre className="text-slate-600 overflow-x-auto">
                                                                {JSON.stringify(log.metadata, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityLogComponent;
