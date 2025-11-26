import { differenceInDays, parseISO } from 'date-fns';
import type { Project, ResourcePoolItem, Alert } from '../types';

export const checkDeadlines = (projects: Project[]): Omit<Alert, 'id' | 'date' | 'read'>[] => {
    const alerts: Omit<Alert, 'id' | 'date' | 'read'>[] = [];
    const today = new Date();

    projects.forEach(project => {
        if (project.status !== 'active') return;
        if (!project.endDate) return;

        const endDate = parseISO(project.endDate);
        const daysLeft = differenceInDays(endDate, today);

        if (daysLeft >= 0 && daysLeft <= 7) {
            alerts.push({
                type: 'warning',
                message: `Project "${project.name}" is due in ${daysLeft} days.`,
                link: `/projects?id=${project.id}`
            });
        } else if (daysLeft < 0) {
            alerts.push({
                type: 'error',
                message: `Project "${project.name}" is overdue by ${Math.abs(daysLeft)} days.`,
                link: `/projects?id=${project.id}`
            });
        }
    });

    return alerts;
};

export const checkResourceConflicts = (projects: Project[], resourcePool: ResourcePoolItem[]): Omit<Alert, 'id' | 'date' | 'read'>[] => {
    const alerts: Omit<Alert, 'id' | 'date' | 'read'>[] = [];

    // Simple check: Total demand vs Total capacity
    // In a real app, this would be time-based (monthly/daily)

    const totalDemand: Record<string, number> = {};

    projects.forEach(project => {
        if (project.status !== 'active') return;

        project.resourceRequirements.forEach(req => {
            totalDemand[req.resourceId] = (totalDemand[req.resourceId] || 0) + req.count;
        });
    });

    resourcePool.forEach(resource => {
        const demand = totalDemand[resource.id] || 0;
        if (demand > resource.totalQuantity) {
            alerts.push({
                type: 'error',
                message: `Resource "${resource.name}" is over-allocated (Demand: ${demand}, Capacity: ${resource.totalQuantity}).`,
                link: '/resources'
            });
        } else if (demand > resource.totalQuantity * 0.8) {
            alerts.push({
                type: 'warning',
                message: `Resource "${resource.name}" is nearing capacity (${Math.round((demand / resource.totalQuantity) * 100)}%).`,
                link: '/resources'
            });
        }
    });

    return alerts;
};
