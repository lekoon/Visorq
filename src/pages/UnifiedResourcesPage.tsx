/**
 * Unified Resources Page
 * Combines dashboard, heatmap, and detailed views
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
} from 'lucide-react';
import EnhancedResourcesDashboard from './EnhancedResourcesDashboard';
import ResourceAllocationHeatmap from '../components/ResourceAllocationHeatmap';
import ResourceGanttChart from '../components/ResourceGanttChart';
import ResourceConflictDetector from '../components/ResourceConflictDetector';
import CostAnalysis from '../components/CostAnalysis';
import SkillMatchingAnalysis from '../components/SkillMatchingAnalysis';
import { generateTimeBuckets, calculateResourceLoad } from '../utils/resourcePlanning';

type ViewTab = 'dashboard' | 'heatmap' | 'gantt' | 'conflicts' | 'costs' | 'skills';

const UnifiedResourcesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
    const projects = useProjects();
    const resourcePool = useResourcePool();

    // Calculate resource data
    const buckets = useMemo(() => generateTimeBuckets(projects, 12), [projects]);
    const resourceLoads = useMemo(
        () => calculateResourceLoad(projects, resourcePool, buckets),
        [projects, resourcePool, buckets]
    );

    const tabs = [
        { id: 'dashboard' as const, label: '总览', icon: LayoutDashboard, color: 'blue' },
        { id: 'heatmap' as const, label: '热力图', icon: Table, color: 'purple' },
        { id: 'gantt' as const, label: '甘特图', icon: Calendar, color: 'green' },
        { id: 'conflicts' as const, label: '冲突检测', icon: AlertCircle, color: 'red' },
        { id: 'costs' as const, label: '成本分析', icon: DollarSign, color: 'yellow' },
        { id: 'skills' as const, label: '技能匹配', icon: Target, color: 'indigo' },
    ];

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
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18} />
                            <span>添加资源</span>
                        </button>
                    </div>

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
                    <ResourceAllocationHeatmap resourceLoads={resourceLoads} buckets={buckets} />
                )}

                {activeTab === 'gantt' && <ResourceGanttChart />}

                {activeTab === 'conflicts' && <ResourceConflictDetector />}

                {activeTab === 'costs' && <CostAnalysis />}

                {activeTab === 'skills' && <SkillMatchingAnalysis />}
            </div>
        </div>
    );
};

export default UnifiedResourcesPage;
