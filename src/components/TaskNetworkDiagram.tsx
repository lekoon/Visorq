import React, { useMemo, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';
import type { Task } from '../types';
import { calculateCriticalPath } from '../utils/taskDependency';

interface TaskNetworkDiagramProps {
    tasks: Task[];
}

interface Node {
    id: string;
    task: Task;
    x: number;
    y: number;
    width: number;
    height: number;
    level: number;
    isCritical: boolean;
}

interface Edge {
    from: string;
    to: string;
    isCritical: boolean;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const LEVEL_SPACING = 250;
const VERTICAL_SPACING = 120;

const TaskNetworkDiagram: React.FC<TaskNetworkDiagramProps> = ({ tasks }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 50, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // 计算布局
    const { nodes, edges, width, height } = useMemo(() => {
        const criticalPathData = calculateCriticalPath(tasks);
        const nodesMap = new Map<string, Node>();
        const levels = new Map<number, Node[]>();

        // 1. 计算层级 (最长路径层级)
        const getLevel = (taskId: string, visited = new Set<string>()): number => {
            if (visited.has(taskId)) return 0; // 循环依赖保护
            visited.add(taskId);

            const task = tasks.find(t => t.id === taskId);
            if (!task) return 0;

            const dependencies = task.dependencies || [];
            if (dependencies.length === 0) return 0;

            let maxDepLevel = -1;
            dependencies.forEach(depId => {
                maxDepLevel = Math.max(maxDepLevel, getLevel(depId, new Set(visited)));
            });

            return maxDepLevel + 1;
        };

        // 2. 创建节点并分配层级
        tasks.forEach(task => {
            const level = getLevel(task.id);
            const isCritical = criticalPathData.criticalPath.includes(task.id);

            const node: Node = {
                id: task.id,
                task,
                x: 0, // 稍后计算
                y: 0,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                level,
                isCritical
            };

            nodesMap.set(task.id, node);

            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level)!.push(node);
        });

        // 3. 计算坐标
        let maxLevel = 0;
        let maxY = 0;

        levels.forEach((levelNodes, level) => {
            maxLevel = Math.max(maxLevel, level);
            // 简单的垂直排列，可以优化为居中对齐
            levelNodes.sort((a, b) => a.task.startDate.localeCompare(b.task.startDate));

            const levelHeight = levelNodes.length * VERTICAL_SPACING;
            const startY = 50; // 顶部边距

            levelNodes.forEach((node, index) => {
                node.x = level * LEVEL_SPACING;
                node.y = startY + index * VERTICAL_SPACING;
                maxY = Math.max(maxY, node.y + NODE_HEIGHT);
            });
        });

        // 4. 创建连线
        const edgesList: Edge[] = [];
        tasks.forEach(task => {
            if (task.dependencies) {
                task.dependencies.forEach(depId => {
                    if (nodesMap.has(depId)) {
                        const isCritical =
                            criticalPathData.criticalPath.includes(task.id) &&
                            criticalPathData.criticalPath.includes(depId);

                        edgesList.push({
                            from: depId,
                            to: task.id,
                            isCritical
                        });
                    }
                });
            }
        });

        return {
            nodes: Array.from(nodesMap.values()),
            edges: edgesList,
            width: (maxLevel + 1) * LEVEL_SPACING + 100,
            height: maxY + 100
        };
    }, [tasks]);

    // 拖拽处理
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(s => Math.min(2, Math.max(0.2, s * delta)));
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-[600px]">
            {/* 工具栏 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Maximize size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">任务网络图 (PERT)</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScale(s => Math.max(0.2, s - 0.1))}
                        className="p-2 hover:bg-slate-200 rounded text-slate-600"
                        title="缩小"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-sm text-slate-500 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(2, s + 0.1))}
                        className="p-2 hover:bg-slate-200 rounded text-slate-600"
                        title="放大"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <button
                        onClick={() => { setScale(1); setOffset({ x: 50, y: 50 }); }}
                        className="p-2 hover:bg-slate-200 rounded text-slate-600"
                        title="重置视图"
                    >
                        <Move size={18} />
                    </button>
                </div>
            </div>

            {/* 绘图区域 */}
            <div
                className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-slate-50"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <div
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <svg width={width} height={height} className="pointer-events-none">
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                            </marker>
                            <marker
                                id="arrowhead-critical"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                            </marker>
                        </defs>

                        {/* 连线 */}
                        {edges.map((edge, i) => {
                            const fromNode = nodes.find(n => n.id === edge.from)!;
                            const toNode = nodes.find(n => n.id === edge.to)!;

                            // 贝塞尔曲线连接
                            const startX = fromNode.x + NODE_WIDTH;
                            const startY = fromNode.y + NODE_HEIGHT / 2;
                            const endX = toNode.x;
                            const endY = toNode.y + NODE_HEIGHT / 2;

                            const controlPoint1X = startX + (endX - startX) / 2;
                            const controlPoint1Y = startY;
                            const controlPoint2X = startX + (endX - startX) / 2;
                            const controlPoint2Y = endY;

                            const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

                            return (
                                <path
                                    key={i}
                                    d={path}
                                    stroke={edge.isCritical ? '#ef4444' : '#94a3b8'}
                                    strokeWidth={edge.isCritical ? 3 : 2}
                                    fill="none"
                                    markerEnd={edge.isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                                    strokeDasharray={edge.isCritical ? 'none' : '5,5'}
                                />
                            );
                        })}
                    </svg>

                    {/* 节点 */}
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            className={`absolute rounded-lg border-2 shadow-sm p-3 flex flex-col justify-between transition-colors hover:shadow-md pointer-events-auto ${node.isCritical
                                    ? 'bg-red-50 border-red-500'
                                    : 'bg-white border-slate-300 hover:border-blue-400'
                                }`}
                            style={{
                                left: node.x,
                                top: node.y,
                                width: node.width,
                                height: node.height
                            }}
                        >
                            <div className="font-medium text-sm text-slate-900 truncate" title={node.task.name}>
                                {node.task.name}
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{node.task.startDate}</span>
                                <span>{node.task.estimatedDays}天</span>
                            </div>
                            {node.isCritical && (
                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" title="关键路径"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 图例 */}
            <div className="p-2 bg-white border-t border-slate-200 flex gap-4 text-xs justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white border-2 border-slate-300 rounded"></div>
                    <span>普通任务</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-50 border-2 border-red-500 rounded"></div>
                    <span>关键路径任务</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-slate-400 border-t border-dashed"></div>
                    <span>依赖关系</span>
                </div>
            </div>
        </div>
    );
};

export default TaskNetworkDiagram;
