/**
 * Smart Dashboard Builder
 * 智能仪表板构建器 - 拖拽式自定义布局
 */

import React, { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
    LayoutGrid,
    Plus,
    Settings,
    Save,
    Download,
    Eye,
    EyeOff,
    Trash2,
    GripVertical,
} from 'lucide-react';

interface DashboardWidget {
    id: string;
    type: 'chart' | 'metric' | 'table' | 'text';
    title: string;
    config: any;
    visible: boolean;
    size: 'small' | 'medium' | 'large' | 'full';
}

interface Props {
    onSave?: (widgets: DashboardWidget[]) => void;
    onExport?: () => void;
}

const SmartDashboardBuilder: React.FC<Props> = ({ onSave, onExport }) => {
    const [widgets, setWidgets] = useState<DashboardWidget[]>([
        {
            id: '1',
            type: 'metric',
            title: '项目总数',
            config: { value: 24, trend: 'up' },
            visible: true,
            size: 'small',
        },
        {
            id: '2',
            type: 'chart',
            title: '项目健康度',
            config: { chartType: 'radar' },
            visible: true,
            size: 'medium',
        },
        {
            id: '3',
            type: 'chart',
            title: '成本趋势',
            config: { chartType: 'line' },
            visible: true,
            size: 'large',
        },
    ]);

    const [editMode, setEditMode] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

    // 可用的组件库
    const widgetLibrary = [
        { type: 'metric', icon: '📊', label: '指标卡片' },
        { type: 'chart', icon: '📈', label: '图表' },
        { type: 'table', icon: '📋', label: '表格' },
        { type: 'text', icon: '📝', label: '文本' },
    ];

    // 添加组件
    const addWidget = (type: DashboardWidget['type']) => {
        const newWidget: DashboardWidget = {
            id: Date.now().toString(),
            type,
            title: `新${widgetLibrary.find(w => w.type === type)?.label}`,
            config: {},
            visible: true,
            size: 'medium',
        };
        setWidgets([...widgets, newWidget]);
    };

    // 删除组件
    const removeWidget = (id: string) => {
        setWidgets(widgets.filter(w => w.id !== id));
    };

    // 切换可见性
    const toggleVisibility = (id: string) => {
        setWidgets(widgets.map(w =>
            w.id === id ? { ...w, visible: !w.visible } : w
        ));
    };

    // 更新组件大小
    const updateSize = (id: string, size: DashboardWidget['size']) => {
        setWidgets(widgets.map(w =>
            w.id === id ? { ...w, size } : w
        ));
    };

    // 保存布局
    const handleSave = () => {
        if (onSave) {
            onSave(widgets);
        }
        setEditMode(false);
    };

    // 获取组件尺寸类名
    const getSizeClass = (size: DashboardWidget['size']) => {
        switch (size) {
            case 'small':
                return 'col-span-1';
            case 'medium':
                return 'col-span-2';
            case 'large':
                return 'col-span-3';
            case 'full':
                return 'col-span-4';
            default:
                return 'col-span-2';
        }
    };

    // 渲染组件内容
    const renderWidgetContent = (widget: DashboardWidget) => {
        switch (widget.type) {
            case 'metric':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-4xl font-bold text-blue-600">
                            {widget.config.value || 0}
                        </div>
                        <div className="text-sm text-slate-600 mt-2">{widget.title}</div>
                    </div>
                );
            case 'chart':
                return (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center">
                            <div className="text-6xl mb-2">📈</div>
                            <div className="text-sm">{widget.config.chartType || '图表'}</div>
                        </div>
                    </div>
                );
            case 'table':
                return (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center">
                            <div className="text-6xl mb-2">📋</div>
                            <div className="text-sm">数据表格</div>
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div className="p-4">
                        <p className="text-slate-600">文本内容区域...</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* 工具栏 */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LayoutGrid className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">仪表板构建器</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${editMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            {editMode ? '完成编辑' : '编辑布局'}
                        </button>

                        {editMode && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                保存
                            </motion.button>
                        )}

                        <button
                            onClick={onExport}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                            <Download size={18} />
                            导出
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* 组件库侧边栏 */}
                {editMode && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className="w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto"
                    >
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">组件库</h3>
                        <div className="space-y-2">
                            {widgetLibrary.map((item) => (
                                <motion.button
                                    key={item.type}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => addWidget(item.type as DashboardWidget['type'])}
                                    className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-300"
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-slate-900">{item.label}</div>
                                    </div>
                                    <Plus size={18} className="text-slate-400" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 主画布 */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <Reorder.Group
                        axis="y"
                        values={widgets}
                        onReorder={setWidgets}
                        className="grid grid-cols-4 gap-4 auto-rows-fr"
                    >
                        {widgets.map((widget) => (
                            <Reorder.Item
                                key={widget.id}
                                value={widget}
                                className={`${getSizeClass(widget.size)} ${!widget.visible && 'opacity-50'}`}
                            >
                                <motion.div
                                    layout
                                    className={`bg-white rounded-xl shadow-sm border-2 transition-all h-full min-h-[200px] ${selectedWidget === widget.id
                                            ? 'border-blue-500'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    onClick={() => setSelectedWidget(widget.id)}
                                >
                                    {/* 组件头部 */}
                                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                                        <div className="flex items-center gap-2">
                                            {editMode && (
                                                <GripVertical
                                                    size={18}
                                                    className="text-slate-400 cursor-move"
                                                />
                                            )}
                                            <h4 className="font-semibold text-slate-900">{widget.title}</h4>
                                        </div>

                                        {editMode && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleVisibility(widget.id);
                                                    }}
                                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                                >
                                                    {widget.visible ? (
                                                        <Eye size={16} className="text-slate-600" />
                                                    ) : (
                                                        <EyeOff size={16} className="text-slate-400" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedWidget(widget.id);
                                                    }}
                                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                                >
                                                    <Settings size={16} className="text-slate-600" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeWidget(widget.id);
                                                    }}
                                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 组件内容 */}
                                    <div className="p-4 h-[calc(100%-60px)]">
                                        {renderWidgetContent(widget)}
                                    </div>
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {widgets.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-slate-400">
                                <LayoutGrid size={64} className="mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">仪表板为空</p>
                                <p className="text-sm mt-2">从左侧组件库添加组件开始构建</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 配置面板 */}
                {editMode && selectedWidget && (
                    <motion.div
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        exit={{ x: 300 }}
                        className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto"
                    >
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">组件配置</h3>

                        {(() => {
                            const widget = widgets.find(w => w.id === selectedWidget);
                            if (!widget) return null;

                            return (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            标题
                                        </label>
                                        <input
                                            type="text"
                                            value={widget.title}
                                            onChange={(e) => {
                                                setWidgets(widgets.map(w =>
                                                    w.id === selectedWidget
                                                        ? { ...w, title: e.target.value }
                                                        : w
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            尺寸
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['small', 'medium', 'large', 'full'] as const).map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => updateSize(selectedWidget, size)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${widget.size === size
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {size === 'small' && '小'}
                                                    {size === 'medium' && '中'}
                                                    {size === 'large' && '大'}
                                                    {size === 'full' && '全宽'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SmartDashboardBuilder;
