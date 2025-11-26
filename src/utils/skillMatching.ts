import type { ResourcePoolItem, ResourceRequirement, Skill, SkillLevel } from '../types';

/**
 * 技能匹配评分
 * 计算资源与项目需求的匹配度
 */
export const calculateSkillMatch = (
    resourceSkills: Skill[],
    requiredSkillIds: string[]
): number => {
    if (!requiredSkillIds || requiredSkillIds.length === 0) return 100;
    if (!resourceSkills || resourceSkills.length === 0) return 0;

    const resourceSkillIds = resourceSkills.map(s => s.id);
    const matchedSkills = requiredSkillIds.filter(reqId =>
        resourceSkillIds.includes(reqId)
    );

    return (matchedSkills.length / requiredSkillIds.length) * 100;
};

/**
 * 技能等级权重
 */
const SKILL_LEVEL_WEIGHT: Record<SkillLevel, number> = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4
};

/**
 * 高级技能匹配（考虑技能等级）
 */
export const calculateAdvancedSkillMatch = (
    resourceSkills: Skill[],
    requiredSkillIds: string[],
    minLevel: SkillLevel = 'intermediate'
): {
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    qualifiedSkills: string[];
} => {
    if (!requiredSkillIds || requiredSkillIds.length === 0) {
        return {
            matchScore: 100,
            matchedSkills: [],
            missingSkills: [],
            qualifiedSkills: []
        };
    }

    if (!resourceSkills || resourceSkills.length === 0) {
        return {
            matchScore: 0,
            matchedSkills: [],
            missingSkills: requiredSkillIds,
            qualifiedSkills: []
        };
    }

    const minLevelWeight = SKILL_LEVEL_WEIGHT[minLevel];
    const matchedSkills: string[] = [];
    const qualifiedSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkillIds.forEach(reqId => {
        const resourceSkill = resourceSkills.find(s => s.id === reqId);

        if (resourceSkill) {
            matchedSkills.push(reqId);
            const skillWeight = SKILL_LEVEL_WEIGHT[resourceSkill.level];
            if (skillWeight >= minLevelWeight) {
                qualifiedSkills.push(reqId);
            }
        } else {
            missingSkills.push(reqId);
        }
    });

    // 计算匹配分数：完全匹配100分，部分匹配按比例，考虑技能等级
    const baseScore = (matchedSkills.length / requiredSkillIds.length) * 100;
    const qualifiedBonus = (qualifiedSkills.length / requiredSkillIds.length) * 20;
    const matchScore = Math.min(baseScore + qualifiedBonus, 100);

    return {
        matchScore,
        matchedSkills,
        missingSkills,
        qualifiedSkills
    };
};

/**
 * 为项目需求推荐最佳资源
 */
export const recommendResources = (
    requirement: ResourceRequirement,
    availableResources: ResourcePoolItem[],
    minMatchScore: number = 60
): {
    resourceId: string;
    resourceName: string;
    matchScore: number;
    matchDetails: ReturnType<typeof calculateAdvancedSkillMatch>;
}[] => {
    const recommendations = availableResources
        .map(resource => {
            const matchDetails = calculateAdvancedSkillMatch(
                resource.skills || [],
                requirement.requiredSkills || []
            );

            return {
                resourceId: resource.id,
                resourceName: resource.name,
                matchScore: matchDetails.matchScore,
                matchDetails
            };
        })
        .filter(rec => rec.matchScore >= minMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore);

    return recommendations;
};

/**
 * 批量技能匹配分析
 * 分析所有项目的技能需求与资源池的匹配情况
 */
export interface SkillGapAnalysis {
    totalRequirements: number;
    fullyMatched: number;
    partiallyMatched: number;
    unmatched: number;
    missingSkills: {
        skillId: string;
        occurrences: number;
        projects: string[];
    }[];
    recommendations: string[];
}

export const analyzeSkillGaps = (
    projects: { id: string; name: string; resourceRequirements: ResourceRequirement[] }[],
    resources: ResourcePoolItem[]
): SkillGapAnalysis => {
    const skillGapMap = new Map<string, { occurrences: number; projects: string[] }>();
    let totalRequirements = 0;
    let fullyMatched = 0;
    let partiallyMatched = 0;
    let unmatched = 0;

    projects.forEach(project => {
        project.resourceRequirements.forEach(req => {
            if (!req.requiredSkills || req.requiredSkills.length === 0) return;

            totalRequirements++;

            // 找到最佳匹配资源
            const resource = resources.find(r => r.id === req.resourceId);
            if (!resource) {
                unmatched++;
                req.requiredSkills.forEach(skillId => {
                    const existing = skillGapMap.get(skillId) || { occurrences: 0, projects: [] };
                    skillGapMap.set(skillId, {
                        occurrences: existing.occurrences + 1,
                        projects: [...existing.projects, project.name]
                    });
                });
                return;
            }

            const matchDetails = calculateAdvancedSkillMatch(
                resource.skills || [],
                req.requiredSkills
            );

            if (matchDetails.matchScore === 100) {
                fullyMatched++;
            } else if (matchDetails.matchScore > 0) {
                partiallyMatched++;
                matchDetails.missingSkills.forEach(skillId => {
                    const existing = skillGapMap.get(skillId) || { occurrences: 0, projects: [] };
                    skillGapMap.set(skillId, {
                        occurrences: existing.occurrences + 1,
                        projects: [...existing.projects, project.name]
                    });
                });
            } else {
                unmatched++;
                req.requiredSkills.forEach(skillId => {
                    const existing = skillGapMap.get(skillId) || { occurrences: 0, projects: [] };
                    skillGapMap.set(skillId, {
                        occurrences: existing.occurrences + 1,
                        projects: [...existing.projects, project.name]
                    });
                });
            }
        });
    });

    // 生成缺失技能列表
    const missingSkills = Array.from(skillGapMap.entries())
        .map(([skillId, data]) => ({
            skillId,
            occurrences: data.occurrences,
            projects: data.projects
        }))
        .sort((a, b) => b.occurrences - a.occurrences);

    // 生成建议
    const recommendations: string[] = [];
    if (missingSkills.length > 0) {
        const topMissingSkill = missingSkills[0];
        recommendations.push(
            `Consider hiring or training resources with "${topMissingSkill.skillId}" skill (needed in ${topMissingSkill.occurrences} projects)`
        );
    }
    if (unmatched > totalRequirements * 0.3) {
        recommendations.push(
            `High skill mismatch rate (${((unmatched / totalRequirements) * 100).toFixed(0)}%). Review resource allocation strategy.`
        );
    }
    if (partiallyMatched > fullyMatched) {
        recommendations.push(
            'Many partial matches detected. Consider upskilling existing resources.'
        );
    }

    return {
        totalRequirements,
        fullyMatched,
        partiallyMatched,
        unmatched,
        missingSkills,
        recommendations
    };
};
