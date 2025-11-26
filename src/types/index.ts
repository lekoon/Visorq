// Auth
export interface User {
    id: string;
    username: string;
    role: 'admin' | 'manager' | 'user' | 'readonly';
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
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
    id: string;
    name: string;
    level: SkillLevel;
}

export interface ResourcePoolItem {
    id: string;
    name: string; // e.g., "Software Department"
    totalQuantity: number; // e.g., 10 people
    costPerUnit?: number; // Cost per unit per time period
    skills?: Skill[]; // Skills this resource possesses
    hourlyRate?: number; // For detailed cost calculation
    members?: TeamMember[]; // 具体人员列表
}

export interface TeamMember {
    id: string;
    name: string;
    role: string; // e.g., "Senior Frontend Dev"
    avatar?: string;
    skills: string[]; // Skill IDs
    availability: number; // Hours per week or percentage
    assignments: {
        projectId: string;
        projectName: string;
        hours: number;
        startDate: string;
        endDate: string;
    }[];
}

export interface ResourceRequirement {
    resourceId: string;
    count: number; // e.g., 5 people
    duration: number; // e.g., 30
    unit: ResourceUnit; // e.g., 'day'
    requiredSkills?: string[]; // Required skill IDs
    estimatedCost?: number; // Calculated cost for this requirement
}

// Resource Conflict Detection
export interface ResourceConflict {
    resourceId: string;
    resourceName: string;
    period: string; // e.g., "2025-01"
    capacity: number;
    allocated: number;
    overallocation: number;
    conflictingProjects: {
        projectId: string;
        projectName: string;
        allocation: number;
    }[];
}

// Cost Analysis
export interface CostBreakdown {
    projectId: string;
    projectName: string;
    totalCost: number;
    resourceCosts: {
        resourceId: string;
        resourceName: string;
        quantity: number;
        duration: number;
        unit: ResourceUnit;
        unitCost: number;
        totalCost: number;
    }[];
}

// Project
export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    priority: 'P0' | 'P1' | 'P2' | 'P3'; // 新增优先级
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

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number; // in ms, default 3000
}

export interface Alert {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    date: string;
    read: boolean;
    link?: string; // Optional link to project or resource
}

// Project Template
export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: 'web' | 'mobile' | 'data' | 'infrastructure' | 'custom';
    icon?: string;
    defaultDuration: number; // in months
    defaultFactors: Record<string, number>;
    defaultResources: Omit<ResourceRequirement, 'resourceId'>[];
    isBuiltIn: boolean;
    createdAt: string;
}
