import React from 'react';
import { ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectProgressCardsProps {
    projects: Project[];
}

const ProjectProgressCards: React.FC<ProjectProgressCardsProps> = ({ projects }) => {
    // 模拟计算资源缺口状态
    const getResourceStatus = (_project: Project) => {
        // 这里应该根据实际分配 vs 需求计算
        const random = Math.random();
        if (random > 0.7) return 'shortage';
        if (random > 0.4) return 'balanced';
        return 'surplus';
    };

    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
                {projects.map(project => {
                    const status = getResourceStatus(project);
                    return (
                        <div key={project.id} className="w-72 bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${project.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                    project.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {project.priority || 'P2'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                    project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>

                            <h4 className="font-bold text-slate-900 mb-1 truncate" title={project.name}>
                                {project.name}
                            </h4>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2 h-8">
                                {project.description}
                            </p>

                            <div className="mt-auto">
                                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                                    <span>Resource Status:</span>
                                    {status === 'shortage' && (
                                        <span className="flex items-center gap-1 text-red-600 font-bold">
                                            <AlertCircle size={12} /> Shortage
                                        </span>
                                    )}
                                    {status === 'balanced' && (
                                        <span className="flex items-center gap-1 text-green-600 font-bold">
                                            <CheckCircle size={12} /> Balanced
                                        </span>
                                    )}
                                    {status === 'surplus' && (
                                        <span className="flex items-center gap-1 text-blue-600 font-bold">
                                            <Clock size={12} /> Pending
                                        </span>
                                    )}
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                                    <div
                                        className={`h-1.5 rounded-full ${status === 'shortage' ? 'bg-red-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${Math.random() * 100}%` }}
                                    ></div>
                                </div>

                                <button className="w-full py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                                    View Details <ChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectProgressCards;
