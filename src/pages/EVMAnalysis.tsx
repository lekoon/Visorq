import React, { useState } from 'react';
import { useProjects } from '../store/useStore';
import { Activity, TrendingUp, AlertCircle } from 'lucide-react';
import EVMCharts from '../components/EVMCharts';
import type { Project } from '../types';

const EVMAnalysis: React.FC = () => {
    const projects = useProjects();
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    const [selectedProjectId, setSelectedProjectId] = useState<string>(
        activeProjects.length > 0 ? activeProjects[0].id : ''
    );

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    if (activeProjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <AlertCircle size={64} className="text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    暂无活跃项目
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                    创建项目后即可查看挣值管理分析
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Activity className="text-blue-600 dark:text-blue-400" size={32} />
                        挣值管理分析
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Earned Value Management - 项目财务绩效可视化
                    </p>
                </div>
            </div>

            {/* Project Selector */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    选择项目
                </label>
                <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full md:w-96 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {activeProjects.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.name} - {project.manager || '未分配'}
                        </option>
                    ))}
                </select>
            </div>

            {/* EVM Charts */}
            {selectedProject && (
                <EVMCharts project={selectedProject} />
            )}

            {/* EVM Explanation */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                    EVM 指标说明
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">核心指标</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li><strong>PV (计划价值):</strong> 按计划应该完成的工作价值</li>
                            <li><strong>EV (挣值):</strong> 实际完成的工作价值</li>
                            <li><strong>AC (实际成本):</strong> 实际花费的成本</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">绩效指数</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li><strong>SPI (进度绩效指数):</strong> EV / PV，衡量进度效率</li>
                            <li><strong>CPI (成本绩效指数):</strong> EV / AC，衡量成本效率</li>
                            <li><strong>TCPI (完工尚需绩效指数):</strong> 剩余工作需要的效率</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">偏差指标</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li><strong>SV (进度偏差):</strong> EV - PV，正值表示进度超前</li>
                            <li><strong>CV (成本偏差):</strong> EV - AC，正值表示成本节约</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">预测指标</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li><strong>EAC (完工估算):</strong> 预计项目总成本</li>
                            <li><strong>ETC (完工尚需估算):</strong> 完成项目还需多少成本</li>
                            <li><strong>VAC (完工偏差):</strong> 预算 - EAC，预计的成本偏差</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EVMAnalysis;
