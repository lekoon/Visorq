import React, { useState } from 'react';
import { MessageCircle, Send, Reply, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import type { Comment } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskCommentsProps {
    taskId: string;
    comments: Comment[];
    currentUserId: string;
    currentUserName: string;
    currentUserAvatar?: string;
    onAddComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
    onDeleteComment: (commentId: string) => void;
    onUpdateComment?: (commentId: string, content: string) => void;
}

const TaskComments: React.FC<TaskCommentsProps> = ({
    taskId,
    comments,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    onAddComment,
    onDeleteComment,
    onUpdateComment
}) => {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // 检测@提及
        const mentions = newComment.match(/@(\w+)/g)?.map(m => m.substring(1)) || [];

        onAddComment({
            taskId,
            authorId: currentUserId,
            authorName: currentUserName,
            authorAvatar: currentUserAvatar,
            content: newComment,
            mentions
        });

        setNewComment('');
        setReplyingTo(null);
    };

    const handleEdit = (commentId: string) => {
        if (!editContent.trim() || !onUpdateComment) return;
        onUpdateComment(commentId, editContent);
        setEditingId(null);
        setEditContent('');
    };

    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
        } catch {
            return dateString;
        }
    };

    // 渲染评论内容，高亮@提及
    const renderContent = (content: string) => {
        const parts = content.split(/(@\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                return (
                    <span key={index} className="text-blue-600 font-medium">
                        {part}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircle size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">评论</h3>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                        {comments.length}
                    </span>
                </div>
            </div>

            {/* 评论列表 */}
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">还没有评论，来发表第一条吧</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex gap-3">
                                {/* 头像 */}
                                <div className="flex-shrink-0">
                                    {comment.authorAvatar ? (
                                        <img
                                            src={comment.authorAvatar}
                                            alt={comment.authorName}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                            {comment.authorName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* 作者和时间 */}
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900 text-sm">
                                                {comment.authorName}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatTime(comment.createdAt)}
                                            </span>
                                            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                                <span className="text-xs text-slate-400">(已编辑)</span>
                                            )}
                                        </div>

                                        {/* 操作菜单 */}
                                        {comment.authorId === currentUserId && (
                                            <div className="relative group">
                                                <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                                                    <MoreVertical size={14} className="text-slate-400" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-10 min-w-[100px]">
                                                    {onUpdateComment && (
                                                        <button
                                                            onClick={() => startEdit(comment)}
                                                            className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Edit2 size={14} />
                                                            编辑
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => onDeleteComment(comment.id)}
                                                        className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} />
                                                        删除
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 评论内容 */}
                                    {editingId === comment.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                rows={3}
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(comment.id)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                                >
                                                    保存
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditContent('');
                                                    }}
                                                    className="px-3 py-1 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {renderContent(comment.content)}
                                        </div>
                                    )}

                                    {/* 回复按钮 */}
                                    {editingId !== comment.id && (
                                        <button
                                            onClick={() => {
                                                setReplyingTo(comment.id);
                                                setNewComment(`@${comment.authorName} `);
                                            }}
                                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                        >
                                            <Reply size={12} />
                                            回复
                                        </button>
                                    )}

                                    {/* 回复列表 */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3 pl-4 border-l-2 border-slate-200 space-y-3">
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="flex gap-2">
                                                    <div className="flex-shrink-0">
                                                        {reply.authorAvatar ? (
                                                            <img
                                                                src={reply.authorAvatar}
                                                                alt={reply.authorName}
                                                                className="w-6 h-6 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                                                {reply.authorName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-slate-900 text-xs">
                                                                {reply.authorName}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                {formatTime(reply.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-700">
                                                            {renderContent(reply.content)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 输入框 */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-3">
                    {/* 当前用户头像 */}
                    <div className="flex-shrink-0">
                        {currentUserAvatar ? (
                            <img
                                src={currentUserAvatar}
                                alt={currentUserName}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                {currentUserName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* 输入区域 */}
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="写下你的评论... (使用 @ 提及其他人)"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">
                                支持 @提及 功能
                            </span>
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Send size={14} />
                                发送
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default TaskComments;
