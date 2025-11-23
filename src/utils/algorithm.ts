import type { Project, FactorDefinition } from '../types';

export const calculateProjectScore = (
    projectFactors: Record<string, number>,
    definitions: FactorDefinition[]
): number => {
    let totalScore = 0;
    let totalWeight = 0;

    definitions.forEach(def => {
        const score = projectFactors[def.id] || 0;
        totalScore += score * def.weight;
        totalWeight += def.weight;
    });

    return totalWeight > 0 ? (totalScore / totalWeight) : 0;
};

export const rankProjects = (projects: Project[], definitions: FactorDefinition[]): Project[] => {
    const scoredProjects = projects.map((p) => ({
        ...p,
        score: calculateProjectScore(p.factors, definitions),
    }));

    // Sort descending by score
    return scoredProjects.sort((a, b) => b.score - a.score).map((p, index) => ({
        ...p,
        rank: index + 1,
    }));
};
