import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, FactorDefinition, User, ResourcePoolItem } from '../types';
import { calculateProjectScore, rankProjects } from '../utils/algorithm';

interface StoreState {
    user: User | null;
    projects: Project[];
    factorDefinitions: FactorDefinition[];
    resourcePool: ResourcePoolItem[];

    // Actions
    login: (username: string, role: 'admin' | 'user') => void;
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

            login: (username, role) => set({
                user: {
                    id: 'u-1',
                    username,
                    role,
                    name: username === 'admin' ? 'Administrator' : 'Standard User',
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
        }),
        {
            name: 'ctpm-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                projects: state.projects,
                factorDefinitions: state.factorDefinitions,
                resourcePool: state.resourcePool
            }),
        }
    )
);
