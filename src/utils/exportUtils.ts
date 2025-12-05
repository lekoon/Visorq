import type { ResourcePoolItem, TeamMember } from '../types';
import { format } from 'date-fns';

/**
 * Export resource heatmap data to CSV
 */
export const exportHeatmapToCSV = (resources: ResourcePoolItem[], startDate: Date, weeksToShow: number) => {
    const rows: string[] = [];

    // Header row
    const headers = ['Resource', 'Member', 'Role'];
    for (let week = 0; week < weeksToShow; week++) {
        for (let day = 0; day < 5; day++) { // Mon-Fri
            const date = new Date(startDate);
            date.setDate(date.getDate() + (week * 7) + day);
            headers.push(format(date, 'yyyy-MM-dd'));
        }
    }
    rows.push(headers.join(','));

    // Data rows
    resources.forEach(resource => {
        resource.members?.forEach(member => {
            const row = [
                `"${resource.name}"`,
                `"${member.name}"`,
                `"${member.role}"`
            ];

            // Add load data for each day
            for (let week = 0; week < weeksToShow; week++) {
                for (let day = 0; day < 5; day++) {
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + (week * 7) + day);
                    const load = calculateMemberLoad(member, date);
                    row.push(load.toString());
                }
            }

            rows.push(row.join(','));
        });
    });

    // Create and download CSV
    const csvContent = rows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resource_heatmap_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
};

/**
 * Calculate member load for a specific date (simplified version)
 */
const calculateMemberLoad = (member: TeamMember, date: Date): number => {
    let totalHours = 0;
    const assignments = member.assignments || [];

    assignments.forEach(assign => {
        const start = new Date(assign.startDate);
        const end = new Date(assign.endDate);

        if (date >= start && date <= end) {
            totalHours += assign.hours / 5; // Weekly hours distributed over 5 days
        }
    });

    const dailyCapacity = (member.availability || 40) / 5;
    return dailyCapacity > 0 ? Math.round((totalHours / dailyCapacity) * 100) : 0;
};

/**
 * Export resource heatmap to Excel-like HTML table
 */
export const exportHeatmapToExcel = (resources: ResourcePoolItem[], startDate: Date, weeksToShow: number) => {
    let html = `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                table { border-collapse: collapse; font-family: Arial, sans-serif; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #4CAF50; color: white; font-weight: bold; }
                .resource-header { background-color: #f2f2f2; font-weight: bold; text-align: left; }
                .high-load { background-color: #ffebee; color: #c62828; font-weight: bold; }
                .medium-load { background-color: #fff3e0; }
                .low-load { background-color: #e8f5e9; }
            </style>
        </head>
        <body>
            <h2>Resource Heatmap - ${format(new Date(), 'yyyy-MM-dd')}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Resource</th>
                        <th>Member</th>
                        <th>Role</th>
    `;

    // Add date headers
    for (let week = 0; week < weeksToShow; week++) {
        for (let day = 0; day < 5; day++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + (week * 7) + day);
            html += `<th>${format(date, 'MM/dd')}</th>`;
        }
    }

    html += `
                    </tr>
                </thead>
                <tbody>
    `;

    // Add data rows
    resources.forEach(resource => {
        resource.members?.forEach(member => {
            html += `
                <tr>
                    <td class="resource-header">${resource.name}</td>
                    <td>${member.name}</td>
                    <td>${member.role}</td>
            `;

            for (let week = 0; week < weeksToShow; week++) {
                for (let day = 0; day < 5; day++) {
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + (week * 7) + day);
                    const load = calculateMemberLoad(member, date);

                    let className = 'low-load';
                    if (load > 100) className = 'high-load';
                    else if (load > 80) className = 'medium-load';

                    html += `<td class="${className}">${load}%</td>`;
                }
            }

            html += `</tr>`;
        });
    });

    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;

    // Create and download HTML file
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resource_heatmap_${format(new Date(), 'yyyyMMdd')}.html`;
    link.click();
};

/**
 * Print resource heatmap (opens print dialog)
 */
export const printHeatmap = () => {
    window.print();
};

/**
 * Print Gantt chart
 */
export const printGanttChart = () => {
    window.print();
};

/**
 * Export tasks to CSV
 */
export const exportTasksToCSV = (tasks: any[], projectName: string): void => {
    const headers = ['任务名称', '描述', '开始日期', '结束日期', '状态', '优先级', '类型', '进度(%)'];

    const rows = tasks.map(task => [
        task.name,
        task.description || '',
        task.startDate,
        task.endDate,
        task.status || 'planning',
        task.priority || 'P2',
        task.type || 'task',
        (task.progress || 0).toString()
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${projectName}_tasks_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
};

/**
 * Export gantt chart to JSON
 */
export const exportGanttToJSON = (tasks: any[], projectName: string): void => {
    const ganttData = {
        projectName,
        exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        tasks: tasks.map(task => ({
            id: task.id,
            name: task.name,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            status: task.status,
            priority: task.priority,
            type: task.type,
            progress: task.progress,
            color: task.color,
            dependencies: task.dependencies || []
        }))
    };

    const jsonContent = JSON.stringify(ganttData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${projectName}_gantt_${format(new Date(), 'yyyyMMdd')}.json`;
    link.click();
};

/**
 * Export resource report to CSV
 */
export const exportResourceReportToCSV = (
    project: any,
    resourcePool: ResourcePoolItem[]
): void => {
    const headers = [
        '资源名称',
        '分配数量',
        '总容量',
        '利用率(%)',
        '工期',
        '预估成本(元)',
        '技能要求',
        '状态'
    ];

    const rows = (project.resourceRequirements || []).map((req: any) => {
        const resource = resourcePool.find(r => r.id === req.resourceId);
        if (!resource) return null;

        const workDays = req.unit === 'day' ? req.duration :
            req.unit === 'month' ? req.duration * 22 :
                req.unit === 'year' ? req.duration * 260 : 0;

        const estimatedCost = resource.hourlyRate
            ? resource.hourlyRate * workDays * 8 * req.count
            : resource.costPerUnit
                ? resource.costPerUnit * req.duration * req.count
                : 0;

        const utilization = (req.count / resource.totalQuantity) * 100;
        const isOverAllocated = req.count > resource.totalQuantity;

        return [
            resource.name,
            req.count.toString(),
            resource.totalQuantity.toString(),
            utilization.toFixed(1),
            `${req.duration}${req.unit === 'day' ? '天' : req.unit === 'month' ? '月' : '年'}`,
            estimatedCost.toFixed(2),
            (req.requiredSkills || []).join('; '),
            isOverAllocated ? '超额' : '正常'
        ];
    }).filter(Boolean);

    const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.name}_resources_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
};

/**
 * Export complete project report to JSON
 */
export const exportProjectReport = (
    project: any,
    resourcePool: ResourcePoolItem[]
): void => {
    const report = {
        projectInfo: {
            name: project.name,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            budget: project.budget,
            actualCost: project.actualCost
        },
        tasks: project.tasks || [],
        resources: (project.resourceRequirements || []).map((req: any) => {
            const resource = resourcePool.find(r => r.id === req.resourceId);
            return {
                requirement: req,
                resourceInfo: resource
            };
        }),
        risks: project.risks || [],
        costs: project.costHistory || [],
        exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };

    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.name}_report_${format(new Date(), 'yyyyMMdd')}.json`;
    link.click();
};
