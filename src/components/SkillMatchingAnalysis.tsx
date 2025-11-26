import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { analyzeSkillGaps, recommendResources } from '../utils/skillMatching';
import { Target, Award, AlertCircle, TrendingUp, Users, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SkillLevel } from '../types';

const SkillMatchingAnalysis: React.FC = () => {
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [minMatchScore, setMinMatchScore] = useState(60);

    // 技能缺口分析
    const skillGapAnalysis = useMemo(() => {
        return analyzeSkillGaps(projects, resourcePool);
    }, [projects, resourcePool]);

    // 选中项目的资源推荐
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const recommendations = useMemo(() => {
        if (!selectedProject || !selectedProject.resourceRequirements.length) return [];

        const allRecommendations: any[] = [];
        selectedProject.resourceRequirements.forEach(req => {
            if (req.requiredSkills && req.requiredSkills.length > 0) {
                const recs = recommendResources(req, resourcePool, minMatchScore);
                allRecommendations.push({
                    requirement: req,
                    recommendations: recs
                });
            }
        });

        return allRecommendations;
    }, [selectedProject, resourcePool, minMatchScore]);

    // 计算总体匹配率
    const overallMatchRate = skillGapAnalysis.totalRequirements > 0
        ? ((skillGapAnalysis.fullyMatched + skillGapAnalysis.partiallyMatched) / skillGapAnalysis.totalRequirements) * 100
        : 100;

    const getSkillLevelColor = (level: SkillLevel) => {
        switch (level) {
            case 'beginner': return 'bg-blue-100 text-blue-700';
            case 'intermediate': return 'bg-green-100 text-green-700';
            case 'advanced': return 'bg-orange-100 text-orange-700';
            case 'expert': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getSkillLevelLabel = (level: SkillLevel) => {
        const labels = {
            beginner: t('skills.beginner'),
            intermediate: t('skills.intermediate'),
            advanced: t('skills.advanced'),
            expert: t('skills.expert')
        };
        return labels[level] || level;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Target className="text-blue-600" size={24} />
                        <h4 className="font-bold text-blue-900">{t('skills.totalRequirements')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{skillGapAnalysis.totalRequirements}</p>
                    <p className="text-sm text-blue-700 mt-1">{t('skills.acrossProjects')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="text-green-600" size={24} />
                        <h4 className="font-bold text-green-900">{t('skills.fullyMatched')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{skillGapAnalysis.fullyMatched}</p>
                    <p className="text-sm text-green-700 mt-1">
                        {skillGapAnalysis.totalRequirements > 0
                            ? `${((skillGapAnalysis.fullyMatched / skillGapAnalysis.totalRequirements) * 100).toFixed(0)}%`
                            : '0%'
                        } {t('skills.perfect')}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-yellow-600" size={24} />
                        <h4 className="font-bold text-yellow-900">{t('skills.partialMatches')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{skillGapAnalysis.partiallyMatched}</p>
                    <p className="text-sm text-yellow-700 mt-1">{t('skills.needsImprovement')}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-red-600" size={24} />
                        <h4 className="font-bold text-red-900">{t('skills.unmatched')}</h4>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{skillGapAnalysis.unmatched}</p>
                    <p className="text-sm text-red-700 mt-1">{t('skills.criticalGaps')}</p>
                </div>
            </div>

            {/* Overall Match Rate */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">{t('skills.overallMatchRate')}</h3>
                <div className="relative">
                    <div className="h-8 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 flex items-center justify-end pr-4"
                            style={{ width: `${overallMatchRate}%` }}
                        >
                            <span className="text-white font-bold text-sm">
                                {overallMatchRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Missing Skills */}
            {skillGapAnalysis.missingSkills.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="text-orange-600" size={24} />
                        <h3 className="text-lg font-bold text-slate-900">{t('skills.topMissingSkills')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skillGapAnalysis.missingSkills.slice(0, 9).map((skill, idx) => (
                            <div
                                key={skill.skillId}
                                className="p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-slate-900">{skill.skillId}</h4>
                                    <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                                        #{idx + 1}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">
                                    {t('skills.neededIn')} <span className="font-bold text-orange-600">{skill.occurrences}</span> {t('skills.projects')}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {skill.projects.slice(0, 3).map((proj, i) => (
                                        <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-orange-300">
                                            {proj.length > 15 ? proj.substring(0, 15) + '...' : proj}
                                        </span>
                                    ))}
                                    {skill.projects.length > 3 && (
                                        <span className="text-xs text-orange-600 px-2 py-1">
                                            +{skill.projects.length - 3} {t('skills.more')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resource Recommendations */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="text-blue-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-900">{t('skills.resourceRecommendations')}</h3>
                </div>

                <div className="mb-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('skills.selectProject')}
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">{t('skills.chooseProject')}</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('skills.minMatchScore')}
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={minMatchScore}
                            onChange={(e) => setMinMatchScore(parseInt(e.target.value) || 0)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {selectedProject && recommendations.length > 0 ? (
                    <div className="space-y-6">
                        {recommendations.map((rec, idx) => {
                            const resource = resourcePool.find(r => r.id === rec.requirement.resourceId);
                            return (
                                <div key={idx} className="border border-slate-200 rounded-xl p-4">
                                    <div className="mb-3">
                                        <h4 className="font-bold text-slate-900">
                                            {t('skills.requirement')} #{idx + 1}: {resource?.name || t('skills.unknownResource')}
                                        </h4>
                                        {rec.requirement.requiredSkills && rec.requirement.requiredSkills.length > 0 && (
                                            <p className="text-sm text-slate-600 mt-1">
                                                {t('skills.requiredSkills')}: {rec.requirement.requiredSkills.join(', ')}
                                            </p>
                                        )}
                                    </div>

                                    {rec.recommendations.length > 0 ? (
                                        <div className="space-y-2">
                                            {rec.recommendations.map((recommendation: any, recIdx: number) => (
                                                <div
                                                    key={recIdx}
                                                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                                                >
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-slate-900">{recommendation.resourceName}</h5>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {recommendation.matchDetails.matchedSkills.map((skillId: string) => {
                                                                const res = resourcePool.find(r => r.id === recommendation.resourceId);
                                                                const skill = res?.skills?.find(s => s.id === skillId);
                                                                return skill ? (
                                                                    <span
                                                                        key={skillId}
                                                                        className={`text-xs px-2 py-1 rounded-full font-medium ${getSkillLevelColor(skill.level)}`}
                                                                    >
                                                                        {skill.name} ({getSkillLevelLabel(skill.level)})
                                                                    </span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                        {recommendation.matchDetails.missingSkills.length > 0 && (
                                                            <p className="text-xs text-red-600 mt-1">
                                                                {t('skills.missing')}: {recommendation.matchDetails.missingSkills.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 text-right">
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {recommendation.matchScore.toFixed(0)}%
                                                        </div>
                                                        <div className="text-xs text-slate-500">{t('skills.match')}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">
                                            {t('skills.noRecommendations')}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : selectedProject ? (
                    <p className="text-slate-500 text-center py-8">
                        {t('skills.noRequirements')}
                    </p>
                ) : (
                    <p className="text-slate-500 text-center py-8">
                        {t('skills.selectProjectPrompt')}
                    </p>
                )}
            </div>

            {/* Recommendations */}
            {skillGapAnalysis.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-purple-600" size={24} />
                        <h3 className="text-lg font-bold text-purple-900">{t('skills.actionableRecommendations')}</h3>
                    </div>
                    <div className="space-y-3">
                        {skillGapAnalysis.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex gap-3 p-4 bg-white rounded-xl border border-purple-300">
                                <div className="text-2xl">💡</div>
                                <p className="text-sm text-slate-700 flex-1">{rec}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillMatchingAnalysis;
