// Auth
export interface User {
    id: string;
    username: string;
    role: 'admin' | 'manager' | 'user' | 'readonly' | 'pmo';
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

export type BaySize = 'S' | 'M' | 'L';
export type ResourceStatus = 'available' | 'occupied' | 'maintenance';

export interface ResourceBooking {
    id: string;
    projectId: string;
    projectName: string;
    startDate: string;
    endDate: string;
    reservedBy: string; // User ID
    reservedByName?: string;
    reservedByDept?: string;
    purpose?: string;
    usageType?: 'test' | 'development' | 'demo' | 'validation';
    status?: 'planned' | 'active' | 'completed' | 'cancelled';
    initialStatusConfirmed?: boolean;
    returnStatusConfirmed?: boolean;
}

export interface MaintenancePlan {
    id: string;
    resourceId: string;
    resourceName: string;
    applicant: string;
    applicantDept: string;
    plannedDate: string;
    type: 'breakdown' | 'routine' | 'upgrade';
    description: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    approver?: string;
    approvalRemarks?: string;
    createdAt: string;
}

export interface ReplacementRecord {
    id: string;
    date: string;
    partName: string; // 更换部件
    reason: string;
    performedBy: string;
    notes?: string;
}

export interface SoftwareHistoryRecord {
    id: string;
    version: string;
    date: string;
    changedBy: string; // User ID
    changedByName: string;
    notes?: string;
}

export interface BayResource {
    id: string;
    name: string;
    size: BaySize;
    status: ResourceStatus;
    currentProjectId?: string;
    currentProjectName?: string;
    currentMachineId?: string;
    currentMachineName?: string;
    health: number; // 0-100
    lastMaintenance: string;
    nextMaintenance: string;
    bookings: ResourceBooking[];
    conflicts?: string[]; // IDs of conflicting bookings
    replacementHistory?: ReplacementRecord[];
    maintenancePlans?: MaintenancePlan[];
    usageHistory?: ResourceBooking[]; // Detailed usage history
    softwareVersion?: string;
    softwareHistory?: SoftwareHistoryRecord[];
}

export interface MachineResource {
    id: string;
    name: string;
    model: string;
    platform?: string;
    status: ResourceStatus;
    currentProjectId?: string;
    currentProjectName?: string;
    currentBayId?: string;
    currentBayName?: string;
    health: number; // 0-100
    lastMaintenance: string;
    nextMaintenance: string;
    bookings: ResourceBooking[];
    conflicts?: string[];
    replacementHistory?: ReplacementRecord[];
    maintenancePlans?: MaintenancePlan[];
    usageHistory?: ResourceBooking[];
    softwareVersion?: string;
    softwareHistory?: SoftwareHistoryRecord[];
}
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
    id: string;
    name: string;
    level: SkillLevel;
}

export interface ResourcePoolItem {
    id: string;
    name: string; // e.g., "Software Department"
    department?: string; // 归属部门
    category?: 'frontend' | 'backend' | 'design' | 'testing' | 'hardware' | 'management' | 'other'; // 技术栈/类别
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

// Key Task Definitions for Portfolio Timeline
export interface KeyTaskDefinition {
    id: string;
    name: string;
    color: string;
}

export interface ProjectKeyTask {
    definitionId: string; // Reference to KeyTaskDefinition
    startDate: string;
    endDate: string;
}

// Project Type Definition (Configurable)
export interface ProjectTypeDefinition {
    id: string;
    name: string;
    color: string;
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
    code?: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    startDate: string;
    endDate: string;
    manager?: string;
    department?: string;
    category?: 'web' | 'mobile' | 'data' | 'infrastructure' | 'custom';
    projectType?: string; // ID of ProjectTypeDefinition

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

    // PDSG Members (核心成员)
    pdsgMembers?: TeamMember[];

    // Risks
    risks?: Risk[];

    // Environment Requirements
    environmentRequirements?: {
        environmentId: string;
        environmentName: string;
        startDate: string;
        endDate: string;
        purpose: string;
    }[];

    // PMO Strategic Metrics
    pmoMetrics?: PMOMetrics;

    // PMO Health & Monitoring (Linkage)
    healthIndicators?: ProjectHealthIndicators;
    pmoAdvice?: string;

    // Milestone Dependencies (Manual)
    milestoneDependencies?: MilestoneDependency[];

    estimatedCost?: number; // 预估成本（向后兼容）

    // Baseline Management (基线管理)
    baselines?: ProjectBaseline[];
    activeBaselineId?: string; // 当前激活的基线ID

    // Strategic Key Tasks (关键任务总览)
    keyTasks?: ProjectKeyTask[];

    // Resource Consumption (实际资源消耗记录)
    actualResourceUsage?: {
        resourceId: string;
        resourceName: string;
        count: number;
        duration: number;
        unit: ResourceUnit;
        department?: string;
        category?: string;
    }[];
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
export type GateStatus = 'pending' | 'requested' | 'approved' | 'rejected' | 'conditional';

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
    sourceMilestoneId?: string;
    sourceMilestoneName?: string;
    targetProjectId: string;
    targetProjectName: string;
    targetMilestoneId?: string;
    targetMilestoneName?: string;

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
    department?: string;
    icon?: string;
    defaultDuration: number; // in months
    defaultBudget?: number;
    defaultFactors: Record<string, number>;
    defaultResources: ResourceRequirement[];
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

// Project Dependencies (Milestone Level)
export interface MilestoneDependency {
    id: string;
    sourceMilestoneId: string; // Milestone ID in the current project
    targetProjectId: string;   // Target project ID
    targetMilestoneId: string; // Milestone ID in the target project
    type: 'FS' | 'SS' | 'FF' | 'SF';
    lag?: number; // Days
    description?: string;
}

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

// ==================== PMO Strategic Optimization Types ====================

// 1. Change Request & Impact Assessment (变更请求与影响评估)
export type ChangeRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'implemented';
export type ChangeImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ChangeRequest {
    id: string;
    projectId: string;
    projectName: string;
    requestedBy: string;
    requestedByName?: string;
    requestDate: string;

    // Change Details
    title: string;
    description: string;
    category: 'scope' | 'schedule' | 'budget' | 'resource' | 'quality' | 'project_status';

    // Impact Assessment (强制填写)
    estimatedEffortHours: number; // 预计增加工时
    estimatedCostIncrease: number; // 预计成本增加
    scheduleImpactDays: number; // 对进度的影响（天数）
    impactLevel: ChangeImpactLevel;

    // Justification
    businessJustification: string; // 业务理由
    alternativeConsidered?: string; // 考虑过的替代方案
    riskIfNotImplemented?: string; // 不实施的风险

    // Approval
    status: ChangeRequestStatus;
    approvedBy?: string;
    approvedByName?: string;
    approvalDate?: string;
    rejectionReason?: string;

    // Implementation
    implementedDate?: string;
    actualEffortHours?: number;
    actualCostIncrease?: number;

    // Audit
    createdAt: string;
    updatedAt?: string;
    metadata?: Record<string, any>;
}

// 2. Scope Creep Metrics (范围蔓延指标)
export interface ScopeCreepMetrics {
    projectId: string;
    projectName: string;

    // Baseline Comparison
    baselineEffortHours: number; // 基线总工时
    currentEffortHours: number; // 当前总工时
    creepPercentage: number; // 蔓延百分比 = (current - baseline) / baseline * 100

    // Change Tracking
    totalChangeRequests: number;
    approvedChanges: number;
    rejectedChanges: number;
    pendingChanges: number;

    // Alerts
    isOverThreshold: boolean; // 是否超过 30% 阈值
    requiresRebaseline: boolean; // 是否需要重新基线

    // Timestamp
    calculatedAt: string;
}

// 3. Environment Resources (非人力资源)
export type EnvironmentType = 'test' | 'staging' | 'production' | 'integration' | 'device' | 'license';
export type EnvironmentStatus = 'available' | 'occupied' | 'maintenance' | 'offline';

export interface EnvironmentResource {
    id: string;
    name: string; // e.g., "测试环境 A", "发布窗口 - 周五晚"
    type: EnvironmentType;
    description?: string;

    // Capacity
    maxConcurrentUsers?: number;
    specifications?: Record<string, any>; // 配置信息

    // Availability
    status: EnvironmentStatus;
    maintenanceSchedule?: {
        startDate: string;
        endDate: string;
        reason: string;
    }[];

    // Booking
    bookings: EnvironmentBooking[];

    // Metadata
    createdAt: string;
    updatedAt?: string;
}

export interface EnvironmentBooking {
    id: string;
    environmentId: string;
    projectId: string;
    projectName: string;
    bookedBy: string;
    bookedByName?: string;

    // Time Slot
    startDate: string;
    endDate: string;

    // Purpose
    purpose: string; // e.g., "集成测试", "性能测试", "生产发布"

    // Status
    status: 'reserved' | 'active' | 'completed' | 'cancelled';

    // Audit
    createdAt: string;
    updatedAt?: string;
}

// 4. Resource Booking Type (资源预定类型)
// Note: BookingType is already defined earlier in the file (line 368)

export interface ResourceAllocation {
    id: string;
    resourceId: string;
    resourceName: string;
    projectId: string;
    projectName: string;

    // Allocation Details
    startDate: string;
    endDate: string;
    hoursPerWeek: number;
    bookingType: BookingType;

    // Priority-based Locking
    projectPriority: 'P0' | 'P1' | 'P2' | 'P3';
    canBePreempted: boolean; // 是否可被抢占（P0 项目的 hard booking 不可被抢占）

    // Audit
    allocatedBy: string;
    allocatedByName?: string;
    allocatedAt: string;
}

// 5. Requirement (需求实体 - 用于 RTM)
export type RequirementType = 'functional' | 'non-functional' | 'business' | 'technical';
export type RequirementStatus = 'draft' | 'approved' | 'in-progress' | 'completed' | 'cancelled';

export interface Requirement {
    id: string;
    projectId: string;

    // Requirement Details
    title: string;
    description: string;
    type: RequirementType;
    priority: 'P0' | 'P1' | 'P2' | 'P3';

    // Traceability
    relatedTaskIds: string[]; // 关联的任务
    relatedDeliverableIds?: string[]; // 关联的交付物

    // Status
    status: RequirementStatus;
    completionPercentage: number;

    // Stakeholder
    requestedBy: string;
    requestedByName?: string;
    assignedTo?: string;
    assignedToName?: string;

    // Audit
    createdAt: string;
    updatedAt?: string;
    completedAt?: string;
}

// 6. Approval Workflow (审批流)
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalType = 'project_initiation' | 'project_closure' | 'budget_change' | 'resource_request' | 'change_request';

export interface ApprovalWorkflow {
    id: string;
    type: ApprovalType;
    entityId: string; // 关联实体 ID（项目 ID、变更请求 ID 等）
    entityName: string;

    // Requester
    requestedBy: string;
    requestedByName?: string;
    requestDate: string;

    // Approval Chain
    approvers: ApprovalStep[];
    currentStepIndex: number;

    // Status
    overallStatus: ApprovalStatus;

    // Metadata
    createdAt: string;
    completedAt?: string;
}

export interface ApprovalStep {
    stepNumber: number;
    approverId: string;
    approverName: string;
    approverRole: string;

    // Decision
    status: ApprovalStatus;
    decision?: 'approve' | 'reject';
    comments?: string;
    decidedAt?: string;

    // Conditions
    isRequired: boolean; // 是否必须审批
    canSkip: boolean; // 是否可跳过
}

// 7. Project Simulation (沙盘推演)
export interface ProjectSimulation {
    id: string;
    name: string;
    description?: string;
    baseProjectId?: string; // 基于哪个项目进行模拟

    // Simulation Scenario
    scenarioType: 'resource_change' | 'priority_change' | 'new_project' | 'delay_simulation';
    changes: SimulationChange[];

    // Results
    impactAnalysis?: {
        affectedProjects: string[];
        totalDelayDays: number;
        resourceConflicts: number;
        budgetImpact: number;
    };

    // Metadata
    createdBy: string;
    createdByName?: string;
    createdAt: string;
    isActive: boolean; // 是否为当前活跃的模拟
}

export interface SimulationChange {
    changeType: 'add_project' | 'remove_project' | 'adjust_priority' | 'reallocate_resource' | 'extend_deadline';
    targetEntityId: string;
    targetEntityName: string;
    changeDetails: Record<string, any>;
}

// 8. Ghost Task Detection (幽灵任务检测)
export interface GhostTaskReport {
    projectId: string;
    projectName: string;

    // Detection Results
    ghostTasks: {
        taskId: string;
        taskName: string;
        reason: 'no_requirement_link' | 'no_deliverable' | 'duplicate' | 'obsolete';
        estimatedEffort: number;
        assignee?: string;
    }[];

    totalGhostTasks: number;
    totalWastedEffort: number; // 浪费的总工时

    // Recommendations
    recommendations: string[];

    // Timestamp
    generatedAt: string;
}
// 9. Portfolio Visualization (组合可视化数据结构)

export interface PMOMetrics {
    strategicConsistency: number; // 战略一致性得分 (0-5)
    rdInvestment: number; // 预计研发投入 (万元)

    // 价值 vs 风险 维度 (0-5分)
    valueRiskMetrics: {
        commercialROI: number;      // 商业回报 (NPV + 毛利率)
        strategicFit: number;       // 战略契合度
        technicalFeasibility: number; // 技术可行性 (e.g. 核心部件国产化)
        marketWindow: number;       // 市场窗口
        resourceDependency: number;   // 资源依赖度 (跨部门协作复杂度)
    };

    // 现金流预测
    cashFlow: {
        annualBudget: number;       // 年度研发预算
        currentInvestment: number;  // 本项目研发投入
        futureROI: number[];        // 未来3年预期净现金流 [Year1, Year2, Year3]
    };

    // 资源负荷 (按月/按角色)
    resourceLoad: MonthlyResourceLoad[];

    // 技术平台 (用于路线图分组)
    techPlatform?: 'Traditional' | 'PCCT' | 'AI' | 'Cloud' | 'Other';
}

export interface MonthlyResourceLoad {
    roleId: string; // e.g., 'algorithm', 'hardware'
    roleName: string; // e.g., 'AI算法工程师', '硬件工程师'
    monthlyUsage: Record<string, number>; // { '2026-01': 2.5, '2026-02': 3.0 } 人月
}

export interface ResourceCapacity {
    roleId: string;
    roleName: string;
    capacity: number; // 总可用产能 (人月/月)
}

export interface FeishuConfig {
    appId: string;
    appSecret: string;
    projectBaseToken?: string;
    projectTableId?: string;
    resourceBaseToken?: string;
    resourceTableId?: string;
}
