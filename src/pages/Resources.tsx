import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { ResourcePoolItem } from '../types';
import { Plus, Trash2, Users } from 'lucide-react';
import { generateTimeBuckets, calculateResourceLoad } from '../utils/resourcePlanning';
import clsx from 'clsx';

const Resources: React.FC = () => {
    const { resourcePool, projects, addResource, updateResource, deleteResource } = useStore();
    const [viewMode, setViewMode] = useState<'pool' | 'capacity'>('capacity');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<ResourcePoolItem>>({ name: '', totalQuantity: 0 });

    // Capacity Planning Data
    const buckets = useMemo(() => generateTimeBuckets(projects, 12), [projects]);
    const resourceLoads = useMemo(() => calculateResourceLoad(projects, resourcePool, buckets), [projects, resourcePool, buckets]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.totalQuantity !== undefined) {
            addResource({
                id: `res-${Date.now()}`,
                name: formData.name,
                totalQuantity: formData.totalQuantity
            });
            setIsModalOpen(false);
            setFormData({ name: '', totalQuantity: 0 });
        }
    };

    const getCellColor = (used: number, capacity: number) => {
        if (capacity === 0) return 'bg-slate-100 text-slate-400';
        const ratio = used / capacity;
        if (ratio > 1) return 'bg-red-100 text-red-700 font-bold';
        if (ratio > 0.8) return 'bg-yellow-100 text-yellow-700';
        if (ratio > 0) return 'bg-green-100 text-green-700';
        return 'bg-slate-50 text-slate-400';
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-slate-900">Resources</h1>
                    <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setViewMode('pool')}
                            className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", viewMode === 'pool' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        >
                            Pool Management
                        </button>
                        <button
                            onClick={() => setViewMode('capacity')}
                            className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", viewMode === 'capacity' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        >
                            Capacity Planning
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} />
                    Add Resource
                </button>
            </div>

            {viewMode === 'pool' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resourcePool.map((resource) => (
                        <div key={resource.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Users size={24} />
                                </div>
                                <button
                                    onClick={() => deleteResource(resource.id)}
                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{resource.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-blue-600">{resource.totalQuantity}</span>
                                <span className="text-sm text-slate-500">units available</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Capacity</label>
                                <input
                                    type="number"
                                    className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                    value={resource.totalQuantity}
                                    onChange={(e) => updateResource(resource.id, { totalQuantity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Resource Capacity Timeline</h3>
                            <p className="text-sm text-slate-500">Monthly allocation vs. Total Capacity. Red indicates over-allocation.</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>Safe</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span>High Load</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span>Overbooked</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Resource</th>
                                    <th className="p-4 font-bold text-slate-700 w-32">Capacity</th>
                                    {buckets.map(bucket => (
                                        <th key={bucket.label} className="p-4 font-semibold text-slate-600 min-w-[100px] text-center whitespace-nowrap">
                                            {bucket.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {resourceLoads.map(load => (
                                    <tr key={load.resourceId} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-medium text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {load.resourceName}
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {load.capacity} units
                                        </td>
                                        {buckets.map(bucket => {
                                            const data = load.allocations[bucket.label];
                                            const used = data.total;
                                            const remaining = load.capacity - used;

                                            return (
                                                <td key={bucket.label} className="p-2 text-center">
                                                    <div className="group relative">
                                                        <div className={clsx("py-2 px-1 rounded-lg text-sm transition-colors cursor-default", getCellColor(used, load.capacity))}>
                                                            <span className="font-bold">{used}</span>
                                                            <span className="opacity-60 mx-1">/</span>
                                                            <span className="opacity-60">{load.capacity}</span>
                                                        </div>

                                                        {/* Tooltip */}
                                                        {data.projects.length > 0 && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                                                                <div className="font-bold mb-2 border-b border-slate-700 pb-1">Allocations ({bucket.label})</div>
                                                                <div className="space-y-1">
                                                                    {data.projects.map((p, i) => (
                                                                        <div key={i} className="flex justify-between">
                                                                            <span className="truncate max-w-[140px]">{p.name}</span>
                                                                            <span className={p.status === 'active' ? 'text-green-400' : 'text-blue-400'}>
                                                                                {p.amount} ({p.status[0].toUpperCase()})
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="mt-2 pt-1 border-t border-slate-700 text-right font-bold">
                                                                    Remaining: {remaining}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Resource</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Resource Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. UX Design Team"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Total Capacity</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.totalQuantity}
                                    onChange={e => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                                >
                                    Add Resource
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resources;
