// Auth
export interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
    name?: string;
    email?: string;
    avatar?: string;
}

// Dynamic Factors
export interface FactorDefinition {
    id: string;
    name: string;
    weight: number; // 0-100
    description?: string;
}

// Resources
export type ResourceUnit = 'day' | 'month' | 'year';

export interface ResourcePoolItem {
    id: string;
    name: string; // e.g., "Software Department"
    totalQuantity: number; // e.g., 10 people
    costPerUnit?: number;
}

export interface ResourceRequirement {
    resourceId: string;
    count: number; // e.g., 5 people
    duration: number; // e.g., 30
    unit: ResourceUnit; // e.g., 'day'
}

// Project
export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    startDate: string;
    endDate: string;

    // Dynamic Factors: key is FactorDefinition.id, value is 0-10 score
    factors: Record<string, number>;

    score: number;
    rank?: number;

    resourceRequirements: ResourceRequirement[];
}

// Default Factors (for initialization)
export const DEFAULT_FACTORS: FactorDefinition[] = [
    { id: 'market', name: 'Market Potential', weight: 15 },
    { id: 'value', name: 'Business Value', weight: 20 },
    { id: 'risk', name: 'Technical Risk', weight: 10 }, // Higher score = Lower Risk (Safety)
    { id: 'roi', name: 'ROI', weight: 20 },
    { id: 'strategy', name: 'Strategic Fit', weight: 15 },
    { id: 'innovation', name: 'Innovation', weight: 10 },
    { id: 'cost', name: 'Cost Efficiency', weight: 10 },
];
