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
