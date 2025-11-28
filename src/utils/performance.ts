/**
 * Performance monitoring utilities
 * Helps identify performance bottlenecks in development
 */

interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private timers: Map<string, number> = new Map();
    private enabled: boolean = import.meta.env.DEV;

    /**
     * Start timing an operation
     */
    start(name: string): void {
        if (!this.enabled) return;
        this.timers.set(name, performance.now());
    }

    /**
     * End timing and record metric
     */
    end(name: string): number | null {
        if (!this.enabled) return null;

        const startTime = this.timers.get(name);
        if (!startTime) {
            console.warn(`Performance timer "${name}" was not started`);
            return null;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(name);

        this.metrics.push({
            name,
            duration,
            timestamp: Date.now(),
        });

        // Log slow operations (> 100ms)
        if (duration > 100) {
            console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    /**
     * Measure a function execution time
     */
    async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        if (!this.enabled) return await fn();

        this.start(name);
        try {
            const result = await fn();
            this.end(name);
            return result;
        } catch (error) {
            this.end(name);
            throw error;
        }
    }

    /**
     * Get all metrics
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics by name
     */
    getMetricsByName(name: string): PerformanceMetric[] {
        return this.metrics.filter((m) => m.name === name);
    }

    /**
     * Get average duration for a metric
     */
    getAverageDuration(name: string): number {
        const metrics = this.getMetricsByName(name);
        if (metrics.length === 0) return 0;

        const total = metrics.reduce((sum, m) => sum + m.duration, 0);
        return total / metrics.length;
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
        this.timers.clear();
    }

    /**
     * Generate performance report
     */
    generateReport(): string {
        if (this.metrics.length === 0) {
            return 'No performance metrics recorded';
        }

        const grouped = this.metrics.reduce((acc, metric) => {
            if (!acc[metric.name]) {
                acc[metric.name] = [];
            }
            acc[metric.name].push(metric.duration);
            return acc;
        }, {} as Record<string, number[]>);

        let report = '📊 Performance Report\n\n';

        Object.entries(grouped).forEach(([name, durations]) => {
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            const min = Math.min(...durations);
            const max = Math.max(...durations);

            report += `${name}:\n`;
            report += `  Count: ${durations.length}\n`;
            report += `  Average: ${avg.toFixed(2)}ms\n`;
            report += `  Min: ${min.toFixed(2)}ms\n`;
            report += `  Max: ${max.toFixed(2)}ms\n\n`;
        });

        return report;
    }

    /**
     * Log performance report to console
     */
    logReport(): void {
        console.log(this.generateReport());
    }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * React component profiler wrapper
 */
export function withProfiler<P extends object>(
    Component: React.ComponentType<P>,
    id: string
): React.ComponentType<P> {
    return (props: P) => {
        const onRender = (
            id: string,
            phase: 'mount' | 'update',
            actualDuration: number,
            baseDuration: number,
            startTime: number,
            commitTime: number
        ) => {
            if (actualDuration > 16) {
                // Slower than 60fps
                console.warn(
                    `⚠️ Component ${id} ${phase} took ${actualDuration.toFixed(2)}ms (target: <16ms)`
                );
            }

            perfMonitor.metrics.push({
                name: `${id}:${phase}`,
                duration: actualDuration,
                timestamp: Date.now(),
            });
        };

        return (
            <React.Profiler id= { id } onRender = { onRender } >
                <Component { ...props } />
                </React.Profiler>
    );
    };
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string): void {
    if (import.meta.env.DEV) {
        React.useEffect(() => {
            const renderTime = performance.now();
            return () => {
                const duration = performance.now() - renderTime;
                if (duration > 16) {
                    console.warn(
                        `⚠️ ${componentName} render took ${duration.toFixed(2)}ms (target: <16ms)`
                    );
                }
            };
        });
    }
}

/**
 * Decorator for measuring method execution time
 */
export function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        const name = `${target.constructor.name}.${propertyKey}`;
        perfMonitor.start(name);
        try {
            const result = await originalMethod.apply(this, args);
            perfMonitor.end(name);
            return result;
        } catch (error) {
            perfMonitor.end(name);
            throw error;
        }
    };

    return descriptor;
}

// Add React import
import React from 'react';
