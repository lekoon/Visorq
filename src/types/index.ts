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
    gender?: '男' | '女' | '其他';
    department?: string;
    position?: string; // 职称
    role: string; // e.g., "Senior Frontend Dev"
    avatar?: string;
    email?: string;
    phone?: string;
    joinDate?: string;
    skills: string[]; // Skill IDs
    certifications?: string[]; // 资质证书
    availability: number; // Hours per week or percentage
    hourlyRate?: number; // 时薪（用于成本计算）
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

// Milestone
export interface Milestone {
    id: string;
    name: string;
    date: string;
    completed: boolean;
    description?: string;
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

export interface CostEntry {
    id: string;
    date: string;
    amount: number;
    category: 'labor' | 'equipment' | 'materials' | 'overhead' | 'other';
    description: string;
}

// Risk Management - Enhanced
export type RiskCategory = 'schedule' | 'cost' | 'resource' | 'technical' | 'external' | 'quality' | 'scope';
export type RiskStatus = 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved' | 'accepted';
export type RiskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface RiskMitigationAction {
    id: string;
    description: string;
    owner: string;
    dueDate: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    completedDate?: string;
    notes?: string;
}

export interface RiskHistoryEntry {
    id: string;
    date: string;
    userId: string;
    userName: string;
    action: 'created' | 'updated' | 'status_changed' | 'probability_changed' | 'impact_changed' | 'mitigation_added' | 'resolved';
    description: string;
    oldValue?: any;
    newValue?: any;
}

export interface Risk {
    id: string;
    projectId: string;
    category: RiskCategory;
    title: string;
    description: string;

    // Risk Assessment (1-5 scale)
    probability: number; // 1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High
    impact: number; // 1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Severe

    // Calculated fields
    riskScore: number; // probability × impact (1-25)
    priority: RiskPriority; // Auto-calculated based on riskScore

    // Management
    owner: string; // User ID responsible for this risk
    ownerName?: string;
    status: RiskStatus;

    // Mitigation
    mitigationStrategy: string; // Overall strategy description
    mitigationActions: RiskMitigationAction[];
    contingencyPlan?: string; // Backup plan if mitigation fails

    // Tracking
    identifiedDate: string;
    lastReviewDate?: string;
    nextReviewDate?: string;
    resolvedDate?: string;

    // Cost impact
    estimatedCostImpact?: number; // Potential cost if risk occurs
    mitigationCost?: number; // Cost to mitigate the risk

    // History
    history: RiskHistoryEntry[];

    // Tags and metadata
    tags?: string[];
    relatedTaskIds?: string[]; // Tasks affected by this risk
    relatedMilestoneIds?: string[]; // Milestones affected by this risk
}

// Task for Canvas-based Task Diagram
// Task for Canvas-based Task Diagram
export interface Task {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    color?: string;
    type: 'task' | 'milestone' | 'group';
    parentId?: string;
    expanded?: boolean;
    description?: string;
    priority?: 'P0' | 'P1' | 'P2' | 'P3';
    status?: 'planning' | 'active' | 'completed' | 'on-hold';

    // Canvas positioning (for free-form layout)
    x?: number; // X coordinate on canvas (Optional if bound to time)
    y?: number; // Y coordinate on canvas
    height?: number; // Custom height

    // Dependencies
    dependencies?: string[]; // Array of task IDs this task depends on

    // Assignment
    assignee?: string; // Resource ID
}

// Project
export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    startDate: string;
    endDate: string;
    manager?: string;
    department?: string;

    // Dynamic Factors: key is FactorDefinition.id, value is 0-10 score
    factors: Record<string, number>;

    score?: number;
    rank?: number;

    resourceRequirements?: ResourceRequirement[]; // Planned Resources

    // Cost tracking
    budget?: number; // 预算
    budgetUsed?: number;
    totalBudget?: number;
    actualCost?: number; // 实际成本
    costBreakdown?: {
        labor: number; // 人力成本
        equipment: number; // 设备成本
        materials: number; // 材料成本
        overhead: number; // 管理费用
        other: number; // 其他
    };
    costHistory?: CostEntry[];

    // Metrics
    progress?: number;
    resourceUtilization?: number;
    healthScore?: number;
    riskScore?: number;

    // Milestones
    milestones?: Milestone[];

    // Tasks (New for Gantt)
    tasks?: Task[];

    // Risks
    risks?: Risk[];

    estimatedCost?: number; // 预估成本（向后兼容）

    // Baseline Management (基线管理)
    baselines?: ProjectBaseline[];
    activeBaselineId?: string; // 当前激活的基线ID
}

// ==================== PMO Enhancement Types ====================

// 1. Baseline Management (基线管理)
export interface ProjectBaseline {
    id: string;
    name: string; // e.g., "Baseline 1.0", "Re-baseline after scope change"
    description?: string;
    createdDate: string;
    createdBy: string;
    createdByName?: string;

    // Snapshot of project state
    snapshot: {
        startDate: string;
        endDate: string;
        budget: number;
        tasks: Task[]; // Full task list with dates
        milestones: Milestone[];
        resourceRequirements: ResourceRequirement[];
    };
}

export interface VarianceMetrics {
    scheduleVariance: number; // Days difference (negative = behind schedule)
    costVariance: number; // Budget difference (negative = over budget)
    startDateVariance: number; // Days
    endDateVariance: number; // Days
    budgetVariancePercent: number; // Percentage
}

// 2. Earned Value Management (挣值管理)
export interface EVMMetrics {
    projectId: string;
    asOfDate: string;

    // Core EVM Values
    plannedValue: number; // PV - 计划价值
    earnedValue: number; // EV - 挣值
    actualCost: number; // AC - 实际成本

    // Performance Indices
    schedulePerformanceIndex: number; // SPI = EV / PV
    costPerformanceIndex: number; // CPI = EV / AC

    // Variance
    scheduleVariance: number; // SV = EV - PV
    costVariance: number; // CV = EV - AC

    // Forecasts
    estimateAtCompletion: number; // EAC
    estimateToComplete: number; // ETC
    varianceAtCompletion: number; // VAC
    toCompletePerformanceIndex: number; // TCPI
}

// 3. Stage-Gate Process (阶段门径)
export type ProjectStage = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';
export type GateStatus = 'pending' | 'approved' | 'rejected' | 'conditional';

export interface StageGate {
    id: string;
    stage: ProjectStage;
    name: string; // e.g., "Gate 1: Project Charter Approval"
    description: string;

    // Requirements (Checklist)
    requirements: GateRequirement[];

    // Approval
    status: GateStatus;
    approvedBy?: string;
    approvedByName?: string;
    approvalDate?: string;
    comments?: string;
    conditions?: string[]; // If status is 'conditional'
}

export interface GateRequirement {
    id: string;
    description: string; // e.g., "Risk Assessment completed"
    required: boolean;
    completed: boolean;
    completedDate?: string;
    completedBy?: string;
    evidence?: string; // Link to document or description
}

export interface ProjectWithStageGate extends Project {
    currentStage: ProjectStage;
    gates: StageGate[];
}

// 4. Resource Governance (资源治理)
export type ResourceRequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'allocated';
export type BookingType = 'soft' | 'hard'; // Soft = tentative, Hard = confirmed

export interface ResourceRequest {
    id: string;
    projectId: string;
    projectName: string;
    requestedBy: string; // PM user ID
    requestedByName?: string;
    requestDate: string;

    // Resource Details
    roleRequired: string; // e.g., "Senior Frontend Developer"
    skillsRequired: string[];
    quantity: number;
    startDate: string;
    endDate: string;
    hoursPerWeek: number;

    // Approval
    status: ResourceRequestStatus;
    reviewedBy?: string;
    reviewedByName?: string;
    reviewDate?: string;
    reviewComments?: string;

    // Allocation (if approved)
    allocatedResourceId?: string;
    allocatedResourceName?: string;
    bookingType?: BookingType;
}

// 5. Portfolio Dashboard (组合仪表盘)
export type RAGStatus = 'red' | 'amber' | 'green';

export interface ProjectHealthIndicators {
    projectId: string;
    projectName: string;

    // RAG Status for different dimensions
    scheduleHealth: RAGStatus;
    budgetHealth: RAGStatus;
    scopeHealth: RAGStatus;
    qualityHealth: RAGStatus;
    riskHealth: RAGStatus;

    // Overall
    overallHealth: RAGStatus;

    // Trend (compared to last period)
    trend: 'improving' | 'stable' | 'declining';
}

export interface PortfolioMetrics {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;

    // Financial
    totalBudget: number;
    totalSpent: number;
    totalValue: number; // Expected business value

    // Health Distribution
    healthDistribution: {
        green: number;
        amber: number;
        red: number;
    };

    // Risk
    totalRiskExposure: number; // Sum of all risk impacts
    criticalRisks: number;

    // Resources
    totalResourcesAllocated: number;
    resourceUtilizationRate: number; // Percentage
}

// 6. Cross-Project Dependencies (跨项目依赖)
export interface CrossProjectDependency {
    id: string;
    sourceProjectId: string;
    sourceProjectName: string;
    targetProjectId: string;
    targetProjectName: string;

    dependencyType: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
    description: string;

    // Impact
    criticalPath: boolean; // Is this on the critical path?
    lagDays?: number; // Delay between projects

    status: 'active' | 'resolved' | 'broken';
    createdDate: string;
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
    defaultMilestones?: Omit<Milestone, 'id' | 'completed'>[];
    isBuiltIn: boolean;
    createdAt: string;
}

// Collaboration Features

export interface Comment {
    id: string;
    taskId?: string;
    projectId?: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    mentions?: string[]; // User IDs mentioned in the comment
    createdAt: string;
    updatedAt?: string;
    replies?: Comment[];
}

export interface ActivityLog {
    id: string;
    projectId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    action: 'created' | 'updated' | 'deleted' | 'commented' | 'assigned' | 'completed' | 'status_changed';
    entityType: 'project' | 'task' | 'resource' | 'risk' | 'cost';
    entityId: string;
    entityName: string;
    description: string;
    metadata?: Record<string, any>;
    timestamp: string;
}

export interface NotificationItem {
    id: string;
    userId: string;
    type: 'mention' | 'assignment' | 'deadline' | 'status_change' | 'comment' | 'system';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
    projectId?: string;
    taskId?: string;
}

// ========== Extended Data Models ==========

// Project Dependencies
export interface ProjectDependency {
    id: string;
    sourceProjectId: string;
    targetProjectId: string;
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
    lag?: number; // Days of lag/lead time
    description?: string;
    createdAt: string;
    createdBy: string;
}

// Change Log for Audit Trail
export interface ChangeLogEntry {
    id: string;
    entityType: 'project' | 'task' | 'resource' | 'risk' | 'milestone';
    entityId: string;
    entityName: string;
    action: 'created' | 'updated' | 'deleted' | 'status_changed';
    userId: string;
    userName: string;
    timestamp: string;
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    metadata?: Record<string, any>;
}

// Data Export Configuration
export interface ExportConfig {
    id: string;
    name: string;
    type: 'csv' | 'excel' | 'pdf' | 'json';
    entityType: 'projects' | 'tasks' | 'resources' | 'risks' | 'reports';
    fields: string[]; // Fields to include in export
    filters?: Record<string, any>; // Filters to apply
    format?: {
        includeHeaders?: boolean;
        dateFormat?: string;
        numberFormat?: string;
        pageSize?: 'A4' | 'Letter' | 'A3';
        orientation?: 'portrait' | 'landscape';
    };
    schedule?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        time?: string; // HH:mm format
        recipients?: string[]; // Email addresses
    };
    createdAt: string;
    createdBy: string;
    lastRunAt?: string;
}

// Performance Metrics
export interface PerformanceMetrics {
    timestamp: string;
    metrics: {
        pageLoadTime: number; // ms
        apiResponseTime: number; // ms
        renderTime: number; // ms
        memoryUsage?: number; // MB
        activeUsers?: number;
    };
    page: string;
    userId?: string;
}

// Data Validation Rules
export interface ValidationRule {
    id: string;
    field: string;
    entityType: 'project' | 'task' | 'resource' | 'risk';
    rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message: string;
    enabled: boolean;
}

// Custom Fields for extensibility
export interface CustomField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'textarea';
    entityType: 'project' | 'task' | 'resource' | 'risk';
    options?: string[]; // For select/multiselect
    required: boolean;
    defaultValue?: any;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
    order: number;
    enabled: boolean;
}

// Batch Operation
export interface BatchOperation {
    id: string;
    type: 'update' | 'delete' | 'export' | 'import';
    entityType: 'projects' | 'tasks' | 'resources' | 'risks';
    entityIds: string[];
    operation: Record<string, any>;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    startedAt?: string;
    completedAt?: string;
    userId: string;
    userName: string;
    results?: {
        success: number;
        failed: number;
        errors?: string[];
    };
}

// Data Backup
export interface DataBackup {
    id: string;
    name: string;
    type: 'full' | 'incremental';
    size: number; // bytes
    createdAt: string;
    createdBy: string;
    status: 'completed' | 'failed' | 'in-progress';
    downloadUrl?: string;
    expiresAt?: string;
    metadata?: {
        projectCount?: number;
        taskCount?: number;
        resourceCount?: number;
        riskCount?: number;
    };
}

// Integration Configuration
export interface IntegrationConfig {
    id: string;
    name: string;
    type: 'webhook' | 'api' | 'oauth' | 'custom';
    provider?: string; // e.g., 'jira', 'slack', 'github'
    enabled: boolean;
    config: {
        url?: string;
        apiKey?: string;
        secret?: string;
        headers?: Record<string, string>;
        events?: string[]; // Events to trigger integration
    };
    createdAt: string;
    lastSyncAt?: string;
    status: 'active' | 'inactive' | 'error';
}

// Cache Configuration for Performance
export interface CacheConfig {
    key: string;
    ttl: number; // Time to live in seconds
    data: any;
    createdAt: string;
    expiresAt: string;
}
