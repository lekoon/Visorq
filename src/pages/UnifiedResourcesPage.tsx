/**
 * Unified Resources Page - Phase 3 Enhanced
 * Complete resource management with export, filter, and interactive features
 */

import React, { useState, useMemo } from 'react';
import { useProjects, useResourcePool } from '../store/useStore';
import {
    LayoutDashboard,
    Table,
    Calendar,
    AlertCircle,
    DollarSign,
    Target,
    Plus,
    Download,
    Filter,
    X,
    Brain,
} from 'lucide-react';
import EnhancedResourcesDashboard from './EnhancedResourcesDashboard';
import ResourceAllocationHeatmap from '../components/ResourceAllocationHeatmap';
import ResourceGanttChart from '../components/ResourceGanttChart';
import ResourceConflictDetector from '../components/ResourceConflictDetector';
import CostAnalysis from '../components/CostAnalysis';
import SkillMatchingAnalysis from '../components/SkillMatchingAnalysis';
import { generateTimeBuckets, calculateResourceLoad } from '../utils/resourcePlanning';
import { exportResourcesToCSV, exportResourcePoolToCSV, exportToJSON } from '../utils/resourceExport';
import AddResourceModal from '../components/AddResourceModal';
import AIDecisionDashboard from './AIDecisionDashboard';

type ViewTab = 'dashboard' | 'heatmap' | 'gantt' | 'conflicts' | 'costs' | 'skills' | 'decision';

const UnifiedResourcesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [utilizationFilter, setUtilizationFilter] = useState<'all' | 'low' | 'normal' | 'high' | 'over'>('all');

    const projects = useProjects();
    const resourcePool = useResourcePool();

    // Calculate resource data
    const buckets = useMemo(() => generateTimeBuckets(projects, 12), [projects]);
    const resourceLoads = useMemo(
        () => calculateResourceLoad(projects, resourcePool, buckets),
        [projects, resourcePool, buckets]
    );

    // Filter resource loads based on utilization
    const filteredResourceLoads = useMemo(() => {
        if (utilizationFilter === 'all') return resourceLoads;

        return resourceLoads.filter(load => {
            const currentMonth = buckets[0]?.label;
            const alloc = load.allocations[currentMonth];
            const used = alloc ? alloc.total : 0;
            const utilization = load.capacity > 0 ? (used / load.capacity) * 100 : 0;

            switch (utilizationFilter) {
                case 'low':
                    return utilization < 50;
                case 'normal':
                    return utilization >= 50 && utilization <= 80;
                case 'high':
                    return utilization > 80 && utilization <= 100;
                case 'over':
                    return utilization > 100;
                default:
                    return true;
            }
        });
    }, [resourceLoads, utilizationFilter, buckets]);

    const tabs = [
        { id: 'dashboard' as const, label: '总览', icon: LayoutDashboard, color: 'blue' },
        { id: 'heatmap' as const, label: '热力图', icon: Table, color: 'purple' },
        { id: 'gantt' as const, label: '甘特图', icon: Calendar, color: 'green' },
        { id: 'conflicts' as const, label: '冲突检测', icon: AlertCircle, color: 'red' },
        { id: 'costs' as const, label: '成本分析', icon: DollarSign, color: 'yellow' },
        { id: 'skills' as const, label: '技能匹配', icon: Target, color: 'indigo' },
        { id: 'decision' as const, label: '决策支持', icon: Brain, color: 'rose' },
    ];

    const handleExport = (format: 'csv' | 'json') => {
        if (format === 'csv') {
            if (activeTab === 'heatmap' || activeTab === 'dashboard') {
                exportResourcesToCSV(filteredResourceLoads, buckets);
            } else {
                exportResourcePoolToCSV(resourcePool);
            }
        } else {
            exportToJSON(
                {
                    resourceLoads: filteredResourceLoads,
                    resourcePool,
                    exportDate: new Date().toISOString(),
                },
                '资源数据'
            );
        }
        setShowExportMenu(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header with Tabs */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">资源管理</h1>
                            <p className="text-sm text-slate-600 mt-1">全方位资源监控与分析</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Filter Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFilters(!showFilters);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters || utilizationFilter !== 'all'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                <Filter size={18} />
                                <span>筛选</span>
                                {utilizationFilter !== 'all' && (
                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">1</span>
                                )}
                            </button>

                            {/* Export Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <Download size={18} />
                                    <span>导出</span>
                                </button>

                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                                        <button
                                            onClick={() => handleExport('csv')}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                                        >
                                            导出为 CSV
                                        </button>
                                        <button
                                            onClick={() => handleExport('json')}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                                        >
                                            导出为 JSON
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.print();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                                        >
                                            打印报表
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Add Resource Button */}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                <span>添加资源</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-slate-900">筛选条件</h3>
                                <button
                                    onClick={() => {
                                        setUtilizationFilter('all');
                                        setShowFilters(false);
                                    }}
                                    className="text-sm text-slate-600 hover:text-slate-900"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    利用率范围
                                </label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'all' as const, label: '全部' },
                                        { value: 'low' as const, label: '低负载 (<50%)' },
                                        { value: 'normal' as const, label: '正常 (50-80%)' },
                                        { value: 'high' as const, label: '高负载 (80-100%)' },
                                        { value: 'over' as const, label: '超额 (>100%)' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUtilizationFilter(option.value);
                                            }}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${utilizationFilter === option.value
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${isActive
                                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'dashboard' && <EnhancedResourcesDashboard />}

                {activeTab === 'heatmap' && (
                    <ResourceAllocationHeatmap resourceLoads={filteredResourceLoads} buckets={buckets} />
                )}

                {activeTab === 'gantt' && <ResourceGanttChart projects={projects} resources={resourcePool} />}

                {activeTab === 'conflicts' && <ResourceConflictDetector />}

                {activeTab === 'costs' && <CostAnalysis />}

                {activeTab === 'skills' && <SkillMatchingAnalysis />}

                {activeTab === 'decision' && <AIDecisionDashboard />}
            </div>

            {/* Click outside to close menus */}
            {(showExportMenu || showFilters) && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setShowExportMenu(false);
                    }}
                />
            )}

            {/* Add Resource Modal */}
            <AddResourceModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </div>
    );
};

export default UnifiedResourcesPage;
