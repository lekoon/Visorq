import React, { useState, useMemo } from 'react';
import { Bell, Check, Trash2, Filter, MessageCircle, UserPlus, Calendar, AlertCircle, Info, X } from 'lucide-react';
import type { NotificationItem } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NotificationCenterProps {
    notifications: NotificationItem[];
    onMarkAsRead: (notificationId: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (notificationId: string) => void;
    onClearAll: () => void;
    onNotificationClick?: (notification: NotificationItem) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClearAll,
    onNotificationClick
}) => {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [typeFilter, setTypeFilter] = useState<NotificationItem['type'] | 'all'>('all');

    // 过滤通知
    const filteredNotifications = useMemo(() => {
        let filtered = notifications;

        if (filter === 'unread') {
            filtered = filtered.filter(n => !n.read);
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(n => n.type === typeFilter);
        }

        return filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [notifications, filter, typeFilter]);

    // 未读数量
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    const getTypeIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'mention':
                return <MessageCircle size={16} />;
            case 'assignment':
                return <UserPlus size={16} />;
            case 'deadline':
                return <Calendar size={16} />;
            case 'status_change':
                return <AlertCircle size={16} />;
            case 'comment':
                return <MessageCircle size={16} />;
            case 'system':
                return <Info size={16} />;
        }
    };

    const getTypeColor = (type: NotificationItem['type']) => {
        switch (type) {
            case 'mention':
                return 'bg-blue-100 text-blue-700';
            case 'assignment':
                return 'bg-purple-100 text-purple-700';
            case 'deadline':
                return 'bg-red-100 text-red-700';
            case 'status_change':
                return 'bg-green-100 text-green-700';
            case 'comment':
                return 'bg-yellow-100 text-yellow-700';
            case 'system':
                return 'bg-slate-100 text-slate-700';
        }
    };

    const getTypeLabel = (type: NotificationItem['type']) => {
        switch (type) {
            case 'mention':
                return '@提及';
            case 'assignment':
                return '任务分配';
            case 'deadline':
                return '截止提醒';
            case 'status_change':
                return '状态变更';
            case 'comment':
                return '评论';
            case 'system':
                return '系统';
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 7) return `${days}天前`;
            return format(date, 'MM-dd HH:mm', { locale: zhCN });
        } catch {
            return dateString;
        }
    };

    const handleNotificationClick = (notification: NotificationItem) => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        if (onNotificationClick) {
            onNotificationClick(notification);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-blue-600" />
                        <h3 className="font-semibold text-slate-900">通知中心</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                全部已读
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={onClearAll}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                清空全部
                            </button>
                        )}
                    </div>
                </div>

                {/* 过滤器 */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        全部 ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'unread'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        未读 ({unreadCount})
                    </button>

                    <div className="flex-1"></div>

                    {/* 类型过滤 */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="all">所有类型</option>
                        <option value="mention">@提及</option>
                        <option value="assignment">任务分配</option>
                        <option value="deadline">截止提醒</option>
                        <option value="status_change">状态变更</option>
                        <option value="comment">评论</option>
                        <option value="system">系统</option>
                    </select>
                </div>
            </div>

            {/* 通知列表 */}
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Bell size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                            {filter === 'unread' ? '没有未读通知' : '暂无通知'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''
                                }`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex gap-3">
                                {/* 类型图标 */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}>
                                    {getTypeIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* 标题和时间 */}
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-medium text-sm ${!notification.read ? 'text-slate-900' : 'text-slate-700'
                                                    }`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                )}
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(notification.type)}`}>
                                                {getTypeLabel(notification.type)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                                            {formatTime(notification.createdAt)}
                                        </span>
                                    </div>

                                    {/* 消息内容 */}
                                    <p className="text-sm text-slate-600 mb-2">
                                        {notification.message}
                                    </p>

                                    {/* 操作按钮 */}
                                    <div className="flex items-center gap-2">
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMarkAsRead(notification.id);
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Check size={12} />
                                                标为已读
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(notification.id);
                                            }}
                                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                                        >
                                            <Trash2 size={12} />
                                            删除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
