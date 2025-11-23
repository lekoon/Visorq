import React from 'react';
import { useStore } from '../store/useStore';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';

const Analysis: React.FC = () => {
    const { projects, resourcePool, factorDefinitions } = useStore();

    // 1. Priority Matrix Data
    // Try to find specific factors for axes, otherwise use first available
    const riskFactor = factorDefinitions.find(f => f.id.includes('risk')) || factorDefinitions[0];
    const valueFactor = factorDefinitions.find(f => f.id.includes('value')) || factorDefinitions[1];
    const roiFactor = factorDefinitions.find(f => f.id.includes('roi')) || factorDefinitions[2];

    const bubbleData = projects.map(p => ({
        name: p.name,
        x: p.factors[riskFactor?.id] || 0,
        y: p.factors[valueFactor?.id] || 0,
        z: p.factors[roiFactor?.id] || 0,
        score: p.score
    }));

    // 2. Resource Analysis Data
    // Calculate total demand per resource for ACTIVE projects
    const activeProjects = projects.filter(p => p.status === 'active');

    const resourceData = resourcePool.map(res => {
        let totalDemand = 0;
        activeProjects.forEach(p => {
            const req = p.resourceRequirements.find(r => r.resourceId === res.id);
            if (req) {
                // Simple calculation: just summing "count". 
                // In reality, we might consider duration overlap, but for this level:
                // "Total concurrent headcount needed"
                totalDemand += req.count;
            }
        });

        return {
            name: res.name,
            capacity: res.totalQuantity,
            demand: totalDemand,
            utilization: res.totalQuantity > 0 ? (totalDemand / res.totalQuantity) * 100 : 0
        };
    });

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Portfolio Analysis</h1>

            {/* Resource Capacity Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Resource Capacity vs. Demand (Active Projects)</h3>
                    <p className="text-sm text-slate-500">Comparison of total available resources against the sum of requirements for currently active projects.</p>
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={resourceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl">
                                                <p className="font-bold text-slate-800">{data.name}</p>
                                                <p className="text-sm text-slate-500">Capacity: {data.capacity}</p>
                                                <p className="text-sm text-slate-500">Demand: {data.demand}</p>
                                                <p className={`text-sm font-bold mt-1 ${data.demand > data.capacity ? 'text-red-600' : 'text-green-600'}`}>
                                                    Utilization: {data.utilization.toFixed(1)}%
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Bar dataKey="capacity" name="Total Capacity" fill="#e2e8f0" barSize={20} />
                            <Bar dataKey="demand" name="Current Demand" barSize={20}>
                                {resourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.demand > entry.capacity ? '#ef4444' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {resourceData.filter(r => r.demand > r.capacity).map(r => (
                        <div key={r.name} className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <strong>Bottleneck:</strong> {r.name} is over-allocated by {r.demand - r.capacity} units.
                        </div>
                    ))}
                </div>
            </div>

            {/* Priority Matrix */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Strategic Priority Matrix</h3>
                    <p className="text-sm text-slate-500">
                        X: {riskFactor?.name} | Y: {valueFactor?.name} | Size: {roiFactor?.name}
                    </p>
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="x" name={riskFactor?.name} domain={[0, 10]} label={{ value: riskFactor?.name, position: 'bottom', offset: 0 }} />
                            <YAxis type="number" dataKey="y" name={valueFactor?.name} domain={[0, 10]} label={{ value: valueFactor?.name, angle: -90, position: 'left' }} />
                            <ZAxis type="number" dataKey="z" range={[60, 400]} name={roiFactor?.name} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl">
                                            <p className="font-bold text-slate-800">{data.name}</p>
                                            <p className="text-sm text-slate-500">{riskFactor?.name}: {data.x}</p>
                                            <p className="text-sm text-slate-500">{valueFactor?.name}: {data.y}</p>
                                            <p className="text-sm text-slate-500">{roiFactor?.name}: {data.z}</p>
                                            <p className="text-sm font-bold text-blue-600 mt-1">Score: {data.score.toFixed(2)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <Legend />
                            <Scatter name="Projects" data={bubbleData} fill="#8b5cf6" shape="circle" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analysis;
