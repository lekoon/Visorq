/**
 * Task Card Component for Canvas Diagram
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import React, { memo } from 'react';
import { Calendar, Link } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Task } from '../types';

interface TaskCardProps {
    task: Task;
    x: number;
    y: number;
    width: number;
    height: number;
    isHovered: boolean;
    isSelected: boolean;
    isConnecting: boolean;
    isSource: boolean;
    onMouseDown: (e: React.MouseEvent, mode: 'drag' | 'resize-w' | 'resize-h') => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDoubleClick: () => void;
    onStartConnection: (e: React.MouseEvent) => void;
}

const TaskCard: React.FC<TaskCardProps> = memo(({
    task,
    x,
    y,
    width,
    height,
    isHovered,
    isSelected,
    isConnecting,
    isSource,
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onContextMenu,
    onDoubleClick,
    onStartConnection,
}) => {
    return (
        <div
            className={`absolute rounded-lg shadow-sm border bg-white transition-shadow group
        ${isHovered ? 'z-20 ring-2 ring-blue-400 shadow-xl' : 'z-10'}
        ${isConnecting && !isSource ? 'cursor-crosshair hover:ring-green-500 hover:bg-green-50' : ''}
        ${isSource ? 'ring-2 ring-blue-500' : ''}
      `}
            style={{
                left: x,
                top: y,
                width,
                height,
                borderColor: task.color || '#e2e8f0'
            }}
            onMouseDown={(e) => onMouseDown(e, 'drag')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
        >
            {/* Color Strip */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
                style={{ backgroundColor: task.color || '#3B82F6' }}
            />

            {/* Content */}
            <div className="pl-3 p-2 h-full flex flex-col overflow-hidden">
                <div className="font-bold text-slate-800 text-sm truncate">{task.name}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar size={12} />
                    <span>
                        {format(parseISO(task.startDate), 'MM/dd')} - {format(parseISO(task.endDate), 'MM/dd')}
                    </span>
                </div>
            </div>

            {/* Resize Handles */}
            {!isConnecting && (
                <>
                    {/* Width Resize (Right) */}
                    <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => onMouseDown(e, 'resize-w')}
                    />
                    {/* Height Resize (Bottom) */}
                    <div
                        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => onMouseDown(e, 'resize-h')}
                    />
                    {/* Corner Resize Indicator */}
                    <div className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize opacity-0 group-hover:opacity-100">
                        <svg viewBox="0 0 10 10" className="fill-slate-400">
                            <path d="M 10 0 L 10 10 L 0 10 Z" />
                        </svg>
                    </div>
                </>
            )}

            {/* Connection Point */}
            {!isConnecting && (
                <button
                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow border border-slate-200 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    onMouseDown={onStartConnection}
                    title="建立依赖"
                >
                    <Link size={12} />
                </button>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
        prevProps.task.id === nextProps.task.id &&
        prevProps.task.name === nextProps.task.name &&
        prevProps.task.startDate === nextProps.task.startDate &&
        prevProps.task.endDate === nextProps.task.endDate &&
        prevProps.task.color === nextProps.task.color &&
        prevProps.x === nextProps.x &&
        prevProps.y === nextProps.y &&
        prevProps.width === nextProps.width &&
        prevProps.height === nextProps.height &&
        prevProps.isHovered === nextProps.isHovered &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isConnecting === nextProps.isConnecting &&
        prevProps.isSource === nextProps.isSource
    );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
