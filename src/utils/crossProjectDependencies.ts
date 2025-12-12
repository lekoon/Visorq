import type { Project, CrossProjectDependency } from '../types';

/**
 * Detect cross-project dependencies based on resource conflicts and timeline overlaps
 */
export function detectCrossProjectDependencies(projects: Project[]): CrossProjectDependency[] {
    const dependencies: CrossProjectDependency[] = [];
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    // Check each pair of projects
    for (let i = 0; i < activeProjects.length; i++) {
        for (let j = i + 1; j < activeProjects.length; j++) {
            const project1 = activeProjects[i];
            const project2 = activeProjects[j];

            // Check for resource conflicts (shared resources)
            const sharedResources = findSharedResources(project1, project2);

            // Check for timeline dependencies
            const timelineDep = analyzeTimelineDependency(project1, project2);

            if (sharedResources.length > 0 || timelineDep) {
                const dependency: CrossProjectDependency = {
                    id: `dep-${project1.id}-${project2.id}`,
                    sourceProjectId: project1.id,
                    sourceProjectName: project1.name,
                    targetProjectId: project2.id,
                    targetProjectName: project2.name,
                    dependencyType: timelineDep || 'finish-to-start',
                    description: sharedResources.length > 0
                        ? `共享资源: ${sharedResources.join(', ')}`
                        : '时间依赖',
                    criticalPath: false, // Will be calculated later
                    status: 'active',
                    createdDate: new Date().toISOString()
                };

                dependencies.push(dependency);
            }
        }
    }

    return dependencies;
}

/**
 * Find shared resources between two projects
 */
function findSharedResources(project1: Project, project2: Project): string[] {
    const resources1 = (project1.resourceRequirements || []).map(r => r.resourceId);
    const resources2 = (project2.resourceRequirements || []).map(r => r.resourceId);

    return resources1.filter(r => resources2.includes(r));
}

/**
 * Analyze timeline dependency between two projects
 */
function analyzeTimelineDependency(
    project1: Project,
    project2: Project
): 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish' | null {
    const start1 = new Date(project1.startDate);
    const end1 = new Date(project1.endDate);
    const start2 = new Date(project2.startDate);
    const end2 = new Date(project2.endDate);

    // Check if project2 starts after project1 ends (finish-to-start)
    if (start2 > end1 && Math.abs(start2.getTime() - end1.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        return 'finish-to-start';
    }

    // Check if both start around the same time (start-to-start)
    if (Math.abs(start1.getTime() - start2.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        return 'start-to-start';
    }

    // Check if both end around the same time (finish-to-finish)
    if (Math.abs(end1.getTime() - end2.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        return 'finish-to-finish';
    }

    return null;
}

/**
 * Calculate critical path through cross-project dependencies
 */
export function calculateCriticalPath(
    projects: Project[],
    dependencies: CrossProjectDependency[]
): string[] {
    // Build adjacency list
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    projects.forEach(p => {
        graph.set(p.id, []);
        inDegree.set(p.id, 0);
    });

    dependencies.forEach(dep => {
        graph.get(dep.sourceProjectId)?.push(dep.targetProjectId);
        inDegree.set(dep.targetProjectId, (inDegree.get(dep.targetProjectId) || 0) + 1);
    });

    // Find projects with no dependencies (starting points)
    const queue: string[] = [];
    inDegree.forEach((degree, projectId) => {
        if (degree === 0) {
            queue.push(projectId);
        }
    });

    // Topological sort to find longest path (critical path)
    const distances = new Map<string, number>();
    const predecessors = new Map<string, string | null>();

    projects.forEach(p => {
        distances.set(p.id, 0);
        predecessors.set(p.id, null);
    });

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentProject = projects.find(p => p.id === current);
        if (!currentProject) continue;

        const currentDuration = Math.ceil(
            (new Date(currentProject.endDate).getTime() - new Date(currentProject.startDate).getTime())
            / (1000 * 60 * 60 * 24)
        );

        const neighbors = graph.get(current) || [];
        neighbors.forEach(neighbor => {
            const newDistance = (distances.get(current) || 0) + currentDuration;
            if (newDistance > (distances.get(neighbor) || 0)) {
                distances.set(neighbor, newDistance);
                predecessors.set(neighbor, current);
            }

            inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        });
    }

    // Find the project with maximum distance (end of critical path)
    let maxDistance = 0;
    let endProject: string | null = null;

    distances.forEach((distance, projectId) => {
        if (distance > maxDistance) {
            maxDistance = distance;
            endProject = projectId;
        }
    });

    // Backtrack to find the critical path
    const criticalPath: string[] = [];
    let current: string | null = endProject;

    while (current) {
        criticalPath.unshift(current);
        current = predecessors.get(current) || null;
    }

    return criticalPath;
}

/**
 * Simulate delay impact on dependent projects
 */
export function simulateDelayImpact(
    projectId: string,
    delayDays: number,
    projects: Project[],
    dependencies: CrossProjectDependency[]
): {
    projectId: string;
    projectName: string;
    originalEndDate: string;
    newEndDate: string;
    delayDays: number;
}[] {
    const impactedProjects: {
        projectId: string;
        projectName: string;
        originalEndDate: string;
        newEndDate: string;
        delayDays: number;
    }[] = [];

    // Build dependency graph
    const dependents = new Map<string, string[]>();
    dependencies.forEach(dep => {
        if (!dependents.has(dep.sourceProjectId)) {
            dependents.set(dep.sourceProjectId, []);
        }
        dependents.get(dep.sourceProjectId)!.push(dep.targetProjectId);
    });

    // BFS to find all impacted projects
    const queue: { projectId: string; accumulatedDelay: number }[] = [
        { projectId, accumulatedDelay: delayDays }
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const { projectId: currentId, accumulatedDelay } = queue.shift()!;

        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const project = projects.find(p => p.id === currentId);
        if (!project) continue;

        if (currentId !== projectId) {
            const originalEndDate = new Date(project.endDate);
            const newEndDate = new Date(originalEndDate);
            newEndDate.setDate(newEndDate.getDate() + accumulatedDelay);

            impactedProjects.push({
                projectId: currentId,
                projectName: project.name,
                originalEndDate: project.endDate,
                newEndDate: newEndDate.toISOString().split('T')[0],
                delayDays: accumulatedDelay
            });
        }

        // Add dependent projects to queue
        const deps = dependents.get(currentId) || [];
        deps.forEach(depId => {
            queue.push({ projectId: depId, accumulatedDelay });
        });
    }

    return impactedProjects;
}

/**
 * Get dependency statistics
 */
export function getDependencyStatistics(
    projects: Project[],
    dependencies: CrossProjectDependency[]
): {
    totalDependencies: number;
    criticalDependencies: number;
    mostDependentProject: { id: string; name: string; count: number } | null;
    mostBlockingProject: { id: string; name: string; count: number } | null;
} {
    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();

    projects.forEach(p => {
        incomingCount.set(p.id, 0);
        outgoingCount.set(p.id, 0);
    });

    dependencies.forEach(dep => {
        outgoingCount.set(dep.sourceProjectId, (outgoingCount.get(dep.sourceProjectId) || 0) + 1);
        incomingCount.set(dep.targetProjectId, (incomingCount.get(dep.targetProjectId) || 0) + 1);
    });

    const criticalDependencies = dependencies.filter(d => d.criticalPath).length;

    // Find most dependent project (most incoming dependencies)
    let maxIncoming = 0;
    let mostDependentProjectId: string | null = null;

    incomingCount.forEach((count, projectId) => {
        if (count > maxIncoming) {
            maxIncoming = count;
            mostDependentProjectId = projectId;
        }
    });

    // Find most blocking project (most outgoing dependencies)
    let maxOutgoing = 0;
    let mostBlockingProjectId: string | null = null;

    outgoingCount.forEach((count, projectId) => {
        if (count > maxOutgoing) {
            maxOutgoing = count;
            mostBlockingProjectId = projectId;
        }
    });

    const mostDependentProject = mostDependentProjectId
        ? {
            id: mostDependentProjectId,
            name: projects.find(p => p.id === mostDependentProjectId)?.name || '',
            count: maxIncoming
        }
        : null;

    const mostBlockingProject = mostBlockingProjectId
        ? {
            id: mostBlockingProjectId,
            name: projects.find(p => p.id === mostBlockingProjectId)?.name || '',
            count: maxOutgoing
        }
        : null;

    return {
        totalDependencies: dependencies.length,
        criticalDependencies,
        mostDependentProject,
        mostBlockingProject
    };
}
