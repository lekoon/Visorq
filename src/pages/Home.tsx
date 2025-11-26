import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Users, PieChart, Brain, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const cards = [
        {
            title: '项目管理',
            description: '全方位的项目全生命周期管理，包括评分、进度追踪、模板管理与批量操作。',
            icon: FolderKanban,
            path: '/projects',
            color: 'from-blue-500 to-cyan-500',
            features: ['项目列表', '项目详情', '模板管理', '批量导入']
        },
        {
            title: '资源管理',
            description: '智能化的资源池管理，实时监控资源负载，自动检测冲突并提供优化建议。',
            icon: Users,
            path: '/resources',
            color: 'from-purple-500 to-pink-500',
            features: ['资源池', '容量规划', '冲突检测', '技能匹配']
        },
        {
            title: '成本分析',
            description: '精确的成本控制与预算分析，实时追踪项目投入产出比，辅助财务决策。',
            icon: PieChart,
            path: '/cost',
            color: 'from-amber-500 to-orange-500',
            features: ['成本概览', '预算分析', 'ROI预测', '支出追踪']
        },
        {
            title: '决策支持',
            description: '基于AI的智能决策辅助系统，提供高管仪表盘、高级报表与风险预测。',
            icon: Brain,
            path: '/decision',
            color: 'from-emerald-500 to-teal-500',
            features: ['高管仪表盘', 'AI 洞察', '高级报表', '风险预警']
        }
    ];

    return (
        <div className="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-6">
                    Visorq
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                    企业级项目组合管理系统
                </p>
                <p className="mt-4 text-slate-500 dark:text-slate-400">
                    赋能企业高效决策，驱动业务持续增长
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto w-full">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(card.path)}
                        className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 dark:border-slate-700 hover:-translate-y-2"
                    >
                        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${card.color}`} />

                        <div className="p-8">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon size={28} />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                                {card.title}
                            </h3>

                            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed h-20">
                                {card.description}
                            </p>

                            <div className="space-y-2 mb-8">
                                {card.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center text-xs text-slate-500 dark:text-slate-500">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${card.color} mr-2`} />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                进入模块 <ArrowRight size={16} className="ml-2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
