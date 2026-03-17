import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import type { Project, FactorDefinition, User, ResourcePoolItem, Notification, Alert, ProjectTemplate, KeyTaskDefinition, BayResource, MachineResource, BaySize, ProjectTypeDefinition, FeishuConfig } from '../types';
import { calculateProjectScore, rankProjects } from '../utils/algorithm';
import { createBaseline as createBaselineSnapshot } from '../utils/baselineManagement';

interface StoreState {
    user: User | null;
    projects: Project[];
    factorDefinitions: FactorDefinition[];
    resourcePool: ResourcePoolItem[];
    projectTemplates: ProjectTemplate[];
    notifications: Notification[];
    alerts: Alert[];
    keyTaskDefinitions: KeyTaskDefinition[];
    physicalBays: BayResource[];
    physicalMachines: MachineResource[];
    projectTypeDefinitions: ProjectTypeDefinition[];

    // Actions
    login: (username: string, role: 'admin' | 'manager' | 'user' | 'readonly' | 'pmo') => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;

    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    addFactor: (name: string) => void;
    updateFactor: (id: string, updates: Partial<FactorDefinition>) => void;
    deleteFactor: (id: string) => void;
    recalculateScores: () => void;

    addResource: (resource: ResourcePoolItem) => void;
    updateResource: (id: string, updates: Partial<ResourcePoolItem>) => void;
    deleteResource: (id: string) => void;
    reorderResources: (newOrder: ResourcePoolItem[]) => void;

    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;

    addAlert: (alert: Omit<Alert, 'id' | 'date' | 'read'>) => void;
    markAlertRead: (id: string) => void;
    clearAlerts: () => void;

    deleteProjects: (ids: string[]) => void;
    updateProjectsStatus: (ids: string[], status: Project['status']) => void;

    addTemplate: (template: ProjectTemplate) => void;
    updateTemplate: (id: string, updates: Partial<ProjectTemplate>) => void;
    deleteTemplate: (id: string) => void;
    createProjectFromTemplate: (templateId: string, projectName: string) => Project;

    // Baseline Management
    createBaseline: (projectId: string, name: string, description: string) => void;
    setActiveBaseline: (projectId: string, baselineId: string) => void;

    // Key Task Definitions
    addKeyTaskDefinition: (name: string, color: string) => void;
    updateKeyTaskDefinition: (id: string, updates: Partial<KeyTaskDefinition>) => void;
    deleteKeyTaskDefinition: (id: string) => void;

    // Physical Resources
    setPhysicalBays: (bays: BayResource[] | ((prev: BayResource[]) => BayResource[])) => void;
    setPhysicalMachines: (machines: MachineResource[] | ((prev: MachineResource[]) => MachineResource[])) => void;
    deletePhysicalBay: (id: string) => void;
    deletePhysicalMachine: (id: string) => void;
    updatePhysicalResource: (id: string, updates: any) => void;

    // Project Type Definitions
    addProjectTypeDefinition: (name: string, color: string) => void;
    updateProjectTypeDefinition: (id: string, updates: Partial<ProjectTypeDefinition>) => void;
    deleteProjectTypeDefinition: (id: string) => void;

    // Feishu Integration
    feishuConfig: FeishuConfig;
    setFeishuConfig: (config: FeishuConfig) => void;
    lastSyncTime: string | null;
    setLastSyncTime: (time: string | null) => void;
}

// Default data
const DEFAULT_FACTORS: FactorDefinition[] = [
    { id: 'strategic_alignment', name: 'Strategic Alignment', weight: 30 },
    { id: 'financial_roi', name: 'Financial ROI', weight: 25 },
    { id: 'risk_level', name: 'Risk Level (Inverse)', weight: 20 },
    { id: 'market_urgency', name: 'Market Urgency', weight: 15 },
    { id: 'tech_feasibility', name: 'Technical Feasibility', weight: 10 },
];

const DEFAULT_RESOURCES: ResourcePoolItem[] = [
    { id: 'res-1', name: 'Frontend Engineers', department: 'Software Dept', category: 'frontend', totalQuantity: 12 },
    { id: 'res-2', name: 'Backend Engineers', department: 'Software Dept', category: 'backend', totalQuantity: 15 },
    { id: 'res-3', name: 'Product Managers', department: 'Product Dept', category: 'management', totalQuantity: 5 },
    { id: 'res-4', name: 'QA Specialists', department: 'QA Dept', category: 'testing', totalQuantity: 8 },
    { id: 'res-5', name: 'UX Designers', department: 'Design Dept', category: 'design', totalQuantity: 4 },
];

const DEFAULT_PROJECT_TYPES: ProjectTypeDefinition[] = [
    { id: 'type-rnd', name: '新产品研发', color: '#3b82f6' }, // Blue
    { id: 'type-pre', name: '预研项目', color: '#10b981' }, // Green
    { id: 'type-reg', name: '注册变更', color: '#f59e0b' }, // Amber
    { id: 'type-maint', name: '产品维护', color: '#8b5cf6' }, // Purple
];

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'tpl-web',
        name: 'Web Application',
        description: 'Full-stack web application with frontend and backend',
        category: 'web',
        department: 'Software Dept',
        icon: '🌐',
        defaultDuration: 6,
        defaultBudget: 500000,
        defaultFactors: {
            strategic_alignment: 7,
            financial_roi: 6,
            risk_level: 7,
            market_urgency: 6,
            tech_feasibility: 8
        },
        defaultResources: [
            { resourceId: 'res-1', count: 3, duration: 6, unit: 'month' as const },
            { resourceId: 'res-2', count: 2, duration: 6, unit: 'month' as const },
            { resourceId: 'res-3', count: 1, duration: 6, unit: 'month' as const },
            { resourceId: 'res-4', count: 1, duration: 4, unit: 'month' as const }
        ],
        isBuiltIn: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'tpl-mobile',
        name: 'Mobile App',
        description: 'Native or cross-platform mobile application',
        category: 'mobile',
        department: 'Mobile Dept',
        icon: '📱',
        defaultDuration: 5,
        defaultBudget: 350000,
        defaultFactors: {
            strategic_alignment: 8,
            financial_roi: 7,
            risk_level: 6,
            market_urgency: 8,
            tech_feasibility: 7
        },
        defaultResources: [
            { resourceId: 'res-1', count: 2, duration: 5, unit: 'month' as const },
            { resourceId: 'res-2', count: 1, duration: 5, unit: 'month' as const },
            { resourceId: 'res-3', count: 1, duration: 5, unit: 'month' as const },
            { resourceId: 'res-4', count: 1, duration: 3, unit: 'month' as const }
        ],
        isBuiltIn: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'tpl-data',
        name: 'Data Analytics',
        description: 'Data pipeline, analytics, and reporting project',
        category: 'data',
        department: 'Data Sci Dept',
        icon: '📊',
        defaultDuration: 4,
        defaultBudget: 450000,
        defaultFactors: {
            strategic_alignment: 7,
            financial_roi: 8,
            risk_level: 7,
            market_urgency: 5,
            tech_feasibility: 7
        },
        defaultResources: [
            { resourceId: 'res-2', count: 2, duration: 4, unit: 'month' as const },
            { resourceId: 'res-3', count: 1, duration: 4, unit: 'month' as const }
        ],
        isBuiltIn: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'tpl-infra',
        name: 'Infrastructure',
        description: 'Cloud infrastructure and DevOps project',
        category: 'infrastructure',
        icon: '🏗️',
        defaultDuration: 3,
        defaultFactors: {
            strategic_alignment: 6,
            financial_roi: 5,
            risk_level: 8,
            market_urgency: 4,
            tech_feasibility: 8
        },
        defaultResources: [
            { resourceId: 'res-2', count: 2, duration: 3, unit: 'month' as const }
        ],
        isBuiltIn: true,
        createdAt: new Date().toISOString()
    }
];

const DEFAULT_KEY_TASKS: KeyTaskDefinition[] = [
    { id: 'kt-design', name: '系统设计', color: '#cb605b' },
    { id: 'kt-dev', name: '功能开发', color: '#d9b75a' },
    { id: 'kt-sit', name: 'SIT', color: '#509765' },
    { id: 'kt-st', name: 'ST', color: '#5a6da4' },
    { id: 'kt-transfer', name: '设计转换', color: '#5e84c9' },
    { id: 'kt-eco', name: 'ECO', color: '#8b71cc' },
];

// --- Mock Data for Physical Resources ---
const PRODUCTION_EQUIPMENT_MODELS = [
    'uCT 530', 'uCT 550', 'uCT 760', 'uCT 780', 'uCT 710', 'uCT 820',
    'uCT Atlas Astound', 'uCT 960+', 'uCT ATLAS', 'uCT 968', 'uCT 968 Pro', 'uCT 968 Elite'
];
const PLATFORMS = ['Falcon', 'Eagle', 'Titan', 'Zeus'];

const MOCK_BAYS: BayResource[] = Array.from({ length: 16 }).map((_, i) => ({
    id: `bay-${i + 1}`,
    name: `Bay ${String(i + 1).padStart(2, '0')}`,
    size: (['S', 'M', 'L'] as BaySize[])[i % 3],
    status: 'available',
    health: 95 + Math.random() * 5,
    lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextMaintenance: new Date(Date.now() + (30 + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    bookings: [],
    conflicts: [],
    replacementHistory: [],
    maintenancePlans: [],
    usageHistory: [],
    version: 1
} as any));

const MOCK_MACHINES: MachineResource[] = PRODUCTION_EQUIPMENT_MODELS.map((model, i) => ({
    id: `mach-${i + 1}`,
    name: `${model} #${String(i + 1).padStart(2, '0')}`,
    model: model,
    platform: PLATFORMS[i % PLATFORMS.length],
    health: 98 + Math.random() * 2,
    status: 'available',
    lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextMaintenance: new Date(Date.now() + (45 + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    bookings: [],
    conflicts: [],
    replacementHistory: [],
    maintenancePlans: [],
    usageHistory: [],
    version: 1
} as any));

export const useStore = create<StoreState>()(
    devtools(
        persist(
            (set, get) => ({
                user: null,
                projects: [],
                factorDefinitions: DEFAULT_FACTORS,
                resourcePool: DEFAULT_RESOURCES,
                projectTemplates: DEFAULT_TEMPLATES,
                notifications: [],
                alerts: [],
                keyTaskDefinitions: DEFAULT_KEY_TASKS,
                physicalBays: MOCK_BAYS,
                physicalMachines: MOCK_MACHINES,
                projectTypeDefinitions: DEFAULT_PROJECT_TYPES,
                feishuConfig: { appId: '', appSecret: '' },
                lastSyncTime: null,

                login: (username, role) => set({
                    user: {
                        id: 'u-1',
                        username,
                        role,
                        name: role === 'pmo' ? 'PMO Specialist' : role === 'admin' ? 'Administrator' : role === 'manager' ? 'Project Manager' : role === 'readonly' ? 'Viewer' : 'Standard User',
                        email: `${username}@example.com`,
                        avatar: `https://ui-avatars.com/api/?name=${username}&background=random`
                    }
                }, false, 'auth/login'),

                logout: () => set({ user: null }, false, 'auth/logout'),

                updateUser: (updates) => set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                }), false, 'auth/updateUser'),

                addProject: (project) => set((state) => {
                    const score = calculateProjectScore(project.factors, state.factorDefinitions);
                    const newProject = { ...project, score };
                    const newProjects = [...state.projects, newProject];
                    return { projects: rankProjects(newProjects, state.factorDefinitions) };
                }, false, 'projects/add'),

                updateProject: (id, updates) => set((state) => {
                    const newProjects = state.projects.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    );
                    const updatedProject = newProjects.find(p => p.id === id);
                    if (updatedProject && updates.factors) {
                        updatedProject.score = calculateProjectScore(updatedProject.factors, state.factorDefinitions);
                    }
                    return { projects: rankProjects(newProjects, state.factorDefinitions) };
                }, false, 'projects/update'),

                deleteProject: (id) => set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id)
                }), false, 'projects/delete'),

                addFactor: (name) => set((state) => ({
                    factorDefinitions: [
                        ...state.factorDefinitions,
                        { id: name.toLowerCase().replace(/\s+/g, '_'), name, weight: 10 }
                    ]
                }), false, 'factors/add'),

                updateFactor: (id, updates) => set((state) => ({
                    factorDefinitions: state.factorDefinitions.map(f => f.id === id ? { ...f, ...updates } : f)
                }), false, 'factors/update'),

                deleteFactor: (id) => set((state) => ({
                    factorDefinitions: state.factorDefinitions.filter(f => f.id !== id)
                }), false, 'factors/delete'),

                recalculateScores: () => set((state) => ({
                    projects: rankProjects(state.projects, state.factorDefinitions)
                }), false, 'projects/recalculate'),

                addResource: (resource) => set((state) => ({
                    resourcePool: [...state.resourcePool, resource]
                }), false, 'resources/add'),

                updateResource: (id, updates) => set((state) => ({
                    resourcePool: state.resourcePool.map(r => r.id === id ? { ...r, ...updates } : r)
                }), false, 'resources/update'),

                deleteResource: (id) => set((state) => ({
                    resourcePool: state.resourcePool.filter(r => r.id !== id)
                }), false, 'resources/delete'),

                reorderResources: (newOrder) => set({
                    resourcePool: newOrder
                }, false, 'resources/reorder'),

                addNotification: (notification) => set((state) => ({
                    notifications: [
                        ...state.notifications,
                        { ...notification, id: Math.random().toString(36).substr(2, 9) }
                    ]
                }), false, 'notifications/add'),

                removeNotification: (id) => set((state) => ({
                    notifications: state.notifications.filter(n => n.id !== id)
                }), false, 'notifications/remove'),

                addAlert: (alert) => set((state) => ({
                    alerts: [
                        { ...alert, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), read: false },
                        ...state.alerts
                    ]
                }), false, 'alerts/add'),

                markAlertRead: (id) => set((state) => ({
                    alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a)
                }), false, 'alerts/markRead'),

                clearAlerts: () => set({ alerts: [] }, false, 'alerts/clear'),

                deleteProjects: (ids) => set((state) => ({
                    projects: state.projects.filter((p) => !ids.includes(p.id))
                }), false, 'projects/batchDelete'),

                updateProjectsStatus: (ids, status) => set((state) => ({
                    projects: state.projects.map((p) =>
                        ids.includes(p.id) ? { ...p, status } : p
                    )
                }), false, 'projects/batchUpdateStatus'),

                addTemplate: (template) => set((state) => ({
                    projectTemplates: [...state.projectTemplates, template]
                }), false, 'templates/add'),

                updateTemplate: (id, updates) => set((state) => ({
                    projectTemplates: state.projectTemplates.map(t =>
                        t.id === id ? { ...t, ...updates } : t
                    )
                }), false, 'templates/update'),

                deleteTemplate: (id) => set((state) => ({
                    projectTemplates: state.projectTemplates.filter(t => t.id !== id && !t.isBuiltIn)
                }), false, 'templates/delete'),

                createProjectFromTemplate: (templateId, projectName) => {
                    const state = get();
                    const template = state.projectTemplates.find(t => t.id === templateId);
                    if (!template) throw new Error('Template not found');

                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + template.defaultDuration);

                    const id = `proj-${Date.now()}`;
                    const newProject: Project = {
                        id,
                        name: projectName,
                        description: template.description,
                        status: 'planning',
                        priority: 'P2',
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0],
                        factors: template.defaultFactors,
                        score: calculateProjectScore(template.defaultFactors, state.factorDefinitions),
                        resourceRequirements: template.defaultResources,
                        category: template.category,
                        department: template.department,
                        budget: template.defaultBudget || 0,
                        actualResourceUsage: template.defaultResources.map(req => {
                            const res = state.resourcePool.find(r => r.id === req.resourceId);
                            // Generate mock actuals: +/- 20% of planned
                            const variance = 0.8 + Math.random() * 0.4;
                            return {
                                resourceId: req.resourceId,
                                resourceName: res?.name || 'Unknown',
                                count: Math.round(req.count * variance * 10) / 10,
                                duration: req.duration,
                                unit: req.unit,
                                department: res?.department,
                                category: res?.category
                            };
                        }),
                        healthIndicators: {
                            projectId: id,
                            projectName: projectName,
                            overallHealth: 'green',
                            scheduleHealth: 'green',
                            budgetHealth: 'green',
                            scopeHealth: 'green',
                            qualityHealth: 'green',
                            riskHealth: 'green',
                            trend: 'stable'
                        },
                        pmoAdvice: ''
                    };

                    return newProject;
                },

                // Baseline Management
                createBaseline: (projectId, name, description) => set((state) => {
                    const project = state.projects.find(p => p.id === projectId);
                    if (!project || !state.user) return state;

                    const baseline = createBaselineSnapshot(
                        project,
                        name,
                        description,
                        state.user.id,
                        state.user.name || state.user.username
                    );

                    const updatedProjects = state.projects.map(p =>
                        p.id === projectId
                            ? {
                                ...p,
                                baselines: [...(p.baselines || []), baseline],
                                activeBaselineId: p.activeBaselineId || baseline.id
                            }
                            : p
                    );

                    return { projects: updatedProjects };
                }, false, 'baseline/create'),

                setActiveBaseline: (projectId, baselineId) => set((state) => ({
                    projects: state.projects.map(p =>
                        p.id === projectId
                            ? { ...p, activeBaselineId: baselineId }
                            : p
                    )
                }), false, 'baseline/setActive'),

                addKeyTaskDefinition: (name: string, color: string) => set((state) => ({
                    keyTaskDefinitions: [
                        ...state.keyTaskDefinitions,
                        { id: `kt-${Date.now()}`, name, color }
                    ]
                }), false, 'keyTasks/add'),

                updateKeyTaskDefinition: (id: string, updates: Partial<KeyTaskDefinition>) => set((state) => ({
                    keyTaskDefinitions: state.keyTaskDefinitions.map(kt =>
                        kt.id === id ? { ...kt, ...updates } : kt
                    )
                }), false, 'keyTasks/update'),

                deleteKeyTaskDefinition: (id: string) => set((state) => ({
                    keyTaskDefinitions: state.keyTaskDefinitions.filter(kt => kt.id !== id)
                }), false, 'keyTasks/delete'),

                setPhysicalBays: (bays) => set((state) => ({
                    physicalBays: typeof bays === 'function' ? bays(state.physicalBays) : bays
                }), false, 'physical/setBays'),
                setPhysicalMachines: (machines) => set((state) => ({
                    physicalMachines: typeof machines === 'function' ? machines(state.physicalMachines) : machines
                }), false, 'physical/setMachines'),
                deletePhysicalBay: (id: string) => set((state) => ({
                    physicalBays: state.physicalBays.filter(bay => bay.id !== id)
                }), false, 'physical/deleteBay'),
                deletePhysicalMachine: (id: string) => set((state) => ({
                    physicalMachines: state.physicalMachines.filter(mach => mach.id !== id)
                }), false, 'physical/deleteMachine'),
                updatePhysicalResource: (id, updates) => {
                    const isBay = id.startsWith('bay');
                    if (isBay) {
                        set((state) => ({
                            physicalBays: state.physicalBays.map((b) =>
                                b.id === id ? { ...b, ...updates } : b
                            ),
                        }), false, 'physical/updateBay');
                    } else {
                        set((state) => ({
                            physicalMachines: state.physicalMachines.map((m) =>
                                m.id === id ? { ...m, ...updates } : m
                            ),
                        }), false, 'physical/updateMachine');
                    }
                },
                addProjectTypeDefinition: (name, color) => set((state) => ({
                    projectTypeDefinitions: [
                        ...state.projectTypeDefinitions,
                        { id: `type-${Date.now()}`, name, color }
                    ]
                }), false, 'projectTypes/add'),
                updateProjectTypeDefinition: (id, updates) => set((state) => ({
                    projectTypeDefinitions: state.projectTypeDefinitions.map(d =>
                        d.id === id ? { ...d, ...updates } : d
                    )
                }), false, 'projectTypes/update'),
                deleteProjectTypeDefinition: (id) => set((state) => ({
                    projectTypeDefinitions: state.projectTypeDefinitions.filter(d => d.id !== id)
                }), false, 'projectTypes/delete'),

                setFeishuConfig: (config) => set({ feishuConfig: config }, false, 'feishu/setConfig'),
                setLastSyncTime: (time) => set({ lastSyncTime: time }, false, 'feishu/setLastSyncTime'),
            }),
            {
                name: 'visorq-storage',
                version: 1,
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({
                    user: state.user,
                    projects: state.projects,
                    factorDefinitions: state.factorDefinitions,
                    resourcePool: state.resourcePool,
                    projectTemplates: state.projectTemplates,
                    alerts: state.alerts,
                    keyTaskDefinitions: state.keyTaskDefinitions,
                    physicalBays: state.physicalBays,
                    physicalMachines: state.physicalMachines,
                    projectTypeDefinitions: state.projectTypeDefinitions,
                    feishuConfig: state.feishuConfig,
                    lastSyncTime: state.lastSyncTime
                }),
            }
        ),
        { name: 'Visorq Store' }
    )
);

// ============ Optimized Selectors ============
// These prevent unnecessary re-renders by selecting only needed data

export const useUser = () => useStore((state) => state.user);
export const useProjects = () => useStore((state) => state.projects);
export const useProject = (id: string) => useStore((state) =>
    state.projects.find(p => p.id === id)
);
export const useFactorDefinitions = () => useStore((state) => state.factorDefinitions);
export const useResourcePool = () => useStore((state) => state.resourcePool);
export const useNotifications = () => useStore((state) => state.notifications);
export const useAlerts = () => useStore((state) => state.alerts);
export const useUnreadAlerts = () => useStore((state) =>
    state.alerts.filter(a => !a.read)
);
export const useTemplates = () => useStore((state) => state.projectTemplates);
export const useProjectTypeDefinitions = () => useStore((state) => state.projectTypeDefinitions);

// Computed selectors
export const useActiveProjects = () => useStore((state) =>
    state.projects.filter(p => p.status === 'active')
);

export const useProjectsByStatus = (status: Project['status']) => useStore((state) =>
    state.projects.filter(p => p.status === status)
);

export const useTopProjects = (limit: number = 5) => useStore((state) =>
    state.projects.slice(0, limit)
);

export const useKeyTaskDefinitions = () => useStore((state) => state.keyTaskDefinitions);
export const useFeishuConfig = () => useStore((state) => state.feishuConfig);
export const useLastSyncTime = () => useStore((state) => state.lastSyncTime);
