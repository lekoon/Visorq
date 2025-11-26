import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, FactorDefinition, User, ResourcePoolItem, Notification, Alert, ProjectTemplate } from '../types';
import { calculateProjectScore, rankProjects } from '../utils/algorithm';

interface StoreState {
    user: User | null;
    projects: Project[];
    factorDefinitions: FactorDefinition[];
    resourcePool: ResourcePoolItem[];
    projectTemplates: ProjectTemplate[];

    // Actions
    login: (username: string, role: 'admin' | 'manager' | 'user' | 'readonly') => void;
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

    // Notifications
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;

    // Persistent Alerts
    alerts: Alert[];
    addAlert: (alert: Omit<Alert, 'id' | 'date' | 'read'>) => void;
    markAlertRead: (id: string) => void;
    clearAlerts: () => void;

    // Batch Actions
    deleteProjects: (ids: string[]) => void;
    updateProjectsStatus: (ids: string[], status: Project['status']) => void;

    // Project Templates
    addTemplate: (template: ProjectTemplate) => void;
    updateTemplate: (id: string, updates: Partial<ProjectTemplate>) => void;
    deleteTemplate: (id: string) => void;
    createProjectFromTemplate: (templateId: string, projectName: string) => Project;
}

export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            user: null,
            projects: [],
            factorDefinitions: [
                { id: 'strategic_alignment', name: 'Strategic Alignment', weight: 30 },
                { id: 'financial_roi', name: 'Financial ROI', weight: 25 },
                { id: 'risk_level', name: 'Risk Level (Inverse)', weight: 20 },
                { id: 'market_urgency', name: 'Market Urgency', weight: 15 },
                { id: 'tech_feasibility', name: 'Technical Feasibility', weight: 10 },
            ],
            resourcePool: [
                { id: 'res-1', name: 'Software Engineers', totalQuantity: 20 },
                { id: 'res-2', name: 'Product Managers', totalQuantity: 5 },
                { id: 'res-3', name: 'QA Specialists', totalQuantity: 8 },
                { id: 'res-4', name: 'UX Designers', totalQuantity: 4 },
            ],
            projectTemplates: [
                {
                    id: 'tpl-web',
                    name: 'Web Application',
                    description: 'Full-stack web application with frontend and backend',
                    category: 'web',
                    icon: '🌐',
                    defaultDuration: 6,
                    defaultFactors: {
                        strategic_alignment: 7,
                        financial_roi: 6,
                        risk_level: 7,
                        market_urgency: 6,
                        tech_feasibility: 8
                    },
                    defaultResources: [
                        { count: 3, duration: 6, unit: 'month' as const },
                        { count: 1, duration: 6, unit: 'month' as const },
                        { count: 1, duration: 4, unit: 'month' as const }
                    ],
                    isBuiltIn: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'tpl-mobile',
                    name: 'Mobile App',
                    description: 'Native or cross-platform mobile application',
                    category: 'mobile',
                    icon: '📱',
                    defaultDuration: 5,
                    defaultFactors: {
                        strategic_alignment: 8,
                        financial_roi: 7,
                        risk_level: 6,
                        market_urgency: 8,
                        tech_feasibility: 7
                    },
                    defaultResources: [
                        { count: 2, duration: 5, unit: 'month' as const },
                        { count: 1, duration: 5, unit: 'month' as const },
                        { count: 1, duration: 3, unit: 'month' as const }
                    ],
                    isBuiltIn: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'tpl-data',
                    name: 'Data Analytics',
                    description: 'Data pipeline, analytics, and reporting project',
                    category: 'data',
                    icon: '📊',
                    defaultDuration: 4,
                    defaultFactors: {
                        strategic_alignment: 7,
                        financial_roi: 8,
                        risk_level: 7,
                        market_urgency: 5,
                        tech_feasibility: 7
                    },
                    defaultResources: [
                        { count: 2, duration: 4, unit: 'month' as const },
                        { count: 1, duration: 4, unit: 'month' as const }
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
                        { count: 2, duration: 3, unit: 'month' as const }
                    ],
                    isBuiltIn: true,
                    createdAt: new Date().toISOString()
                }
            ],

            login: (username, role) => set({
                user: {
                    id: 'u-1',
                    username,
                    role,
                    name: role === 'admin' ? 'Administrator' : role === 'manager' ? 'Project Manager' : role === 'readonly' ? 'Viewer' : 'Standard User',
                    email: `${username}@example.com`,
                    avatar: `https://ui-avatars.com/api/?name=${username}&background=random`
                }
            }),

            logout: () => set({ user: null }),

            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null
            })),

            addProject: (project) => set((state) => {
                const score = calculateProjectScore(project.factors, state.factorDefinitions);
                const newProject = { ...project, score };
                const newProjects = [...state.projects, newProject];
                return { projects: rankProjects(newProjects, state.factorDefinitions) };
            }),

            updateProject: (id, updates) => set((state) => {
                const newProjects = state.projects.map((p) =>
                    p.id === id ? { ...p, ...updates } : p
                );
                // Recalculate score for the updated project if factors changed
                const updatedProject = newProjects.find(p => p.id === id);
                if (updatedProject && updates.factors) {
                    updatedProject.score = calculateProjectScore(updatedProject.factors, state.factorDefinitions);
                }
                return { projects: rankProjects(newProjects, state.factorDefinitions) };
            }),

            deleteProject: (id) => set((state) => ({
                projects: state.projects.filter((p) => p.id !== id)
            })),

            addFactor: (name) => set((state) => ({
                factorDefinitions: [
                    ...state.factorDefinitions,
                    { id: name.toLowerCase().replace(/\s+/g, '_'), name, weight: 10 }
                ]
            })),

            updateFactor: (id, updates) => set((state) => ({
                factorDefinitions: state.factorDefinitions.map(f => f.id === id ? { ...f, ...updates } : f)
            })),

            deleteFactor: (id) => set((state) => ({
                factorDefinitions: state.factorDefinitions.filter(f => f.id !== id)
            })),

            recalculateScores: () => set((state) => ({
                projects: rankProjects(state.projects, state.factorDefinitions)
            })),

            addResource: (resource) => set((state) => ({
                resourcePool: [...state.resourcePool, resource]
            })),

            updateResource: (id, updates) => set((state) => ({
                resourcePool: state.resourcePool.map(r => r.id === id ? { ...r, ...updates } : r)
            })),

            deleteResource: (id) => set((state) => ({
                resourcePool: state.resourcePool.filter(r => r.id !== id)
            })),

            reorderResources: (newOrder) => set({
                resourcePool: newOrder
            }),

            // Notification Actions
            notifications: [],
            addNotification: (notification) => set((state) => ({
                notifications: [
                    ...state.notifications,
                    { ...notification, id: Math.random().toString(36).substr(2, 9) }
                ]
            })),
            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),

            // Persistent Alerts
            alerts: [],
            addAlert: (alert) => set((state) => ({
                alerts: [
                    { ...alert, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), read: false },
                    ...state.alerts
                ]
            })),
            markAlertRead: (id) => set((state) => ({
                alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a)
            })),
            clearAlerts: () => set({ alerts: [] }),

            // Batch Actions
            deleteProjects: (ids) => set((state) => ({
                projects: state.projects.filter((p) => !ids.includes(p.id))
            })),

            updateProjectsStatus: (ids, status) => set((state) => ({
                projects: state.projects.map((p) =>
                    ids.includes(p.id) ? { ...p, status } : p
                )
            })),

            // Project Templates
            addTemplate: (template) => set((state) => ({
                projectTemplates: [...state.projectTemplates, template]
            })),

            updateTemplate: (id, updates) => set((state) => ({
                projectTemplates: state.projectTemplates.map(t =>
                    t.id === id ? { ...t, ...updates } : t
                )
            })),

            deleteTemplate: (id) => set((state) => ({
                projectTemplates: state.projectTemplates.filter(t => t.id !== id && !t.isBuiltIn)
            })),

            createProjectFromTemplate: (templateId, projectName) => {
                const state = useStore.getState();
                const template = state.projectTemplates.find(t => t.id === templateId);
                if (!template) throw new Error('Template not found');

                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + template.defaultDuration);

                const newProject: Project = {
                    id: `proj-${Date.now()}`,
                    name: projectName,
                    description: template.description,
                    status: 'planning',
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                    factors: template.defaultFactors,
                    score: calculateProjectScore(template.defaultFactors, state.factorDefinitions),
                    resourceRequirements: template.defaultResources.map((res, idx) => ({
                        ...res,
                        resourceId: state.resourcePool[idx]?.id || ''
                    }))
                };

                return newProject;
            },
        }),
        {
            name: 'ctpm-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                projects: state.projects,
                factorDefinitions: state.factorDefinitions,
                resourcePool: state.resourcePool,
                projectTemplates: state.projectTemplates,
                alerts: state.alerts
            }),
        }
    )
);
