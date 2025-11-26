import React from 'react';
import { useStore } from '../store/useStore';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';

const Analysis: React.FC = () => {
    const { projects, resourcePool, factorDefinitions } = useStore();
    const { t } = useTranslation();

    // 1. Priority Matrix Data
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
    const activeProjects = projects.filter(p => p.status === 'active');
    const resourceData = resourcePool.map(res => {
        let totalDemand = 0;
        activeProjects.forEach(p => {
            const req = p.resourceRequirements.find(r => r.resourceId === res.id);
            if (req) {
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

    // 3. Status Distribution Data
    const statusData = [
        { name: t('projects.active'), value: projects.filter(p => p.status === 'active').length, color: '#22c55e' },
        { name: t('projects.planning'), value: projects.filter(p => p.status === 'planning').length, color: '#3b82f6' },
        { name: t('projects.completed'), value: projects.filter(p => p.status === 'completed').length, color: '#a855f7' },
        { name: t('projects.onHold'), value: projects.filter(p => p.status === 'on-hold').length, color: '#f97316' },
    ].filter(d => d.value > 0);

    // 4. Pipeline Data (Projects by Start Month)
    const pipelineData = projects.reduce((acc, project) => {
        if (!project.startDate) return acc;
        const month = format(parseISO(project.startDate), 'MMM yyyy');
        const existing = acc.find(d => d.name === month);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ name: month, count: 1, date: parseISO(project.startDate) });
        }
        return acc;
    }, [] as { name: string, count: number, date: Date }[])
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">{t('analysis.title')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{t('analysis.projectStatus')}</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pipeline Velocity */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{t('analysis.pipelineVelocity')}</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" name={t('analysis.newProjects')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Resource Capacity Analysis */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{t('analysis.resourceCapacityVsDemand')}</h3>
                        <p className="text-sm text-slate-500">{t('analysis.resourceDesc')}</p>
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
                                                    <p className="text-sm text-slate-500">{t('analysis.totalCapacity')}: {data.capacity}</p>
                                                    <p className="text-sm text-slate-500">{t('analysis.currentDemand')}: {data.demand}</p>
                                                    <p className={`text-sm font-bold mt-1 ${data.demand > data.capacity ? 'text-red-600' : 'text-green-600'}`}>
                                                        {t('dashboard.utilization')}: {data.utilization.toFixed(1)}%
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="capacity" name={t('analysis.totalCapacity')} fill="#e2e8f0" barSize={20} />
                                <Bar dataKey="demand" name={t('analysis.currentDemand')} barSize={20}>
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
                                <strong>{t('analysis.bottleneck')}:</strong> {r.name} {t('analysis.overAllocated')} {r.demand - r.capacity} {t('analysis.units')}.
                            </div>
                        ))}
                    </div>
                </div>

                {/* Priority Matrix */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{t('analysis.strategicPriorityMatrix')}</h3>
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
        </div>
    );
};

export default Analysis;
