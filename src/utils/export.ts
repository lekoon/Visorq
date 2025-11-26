import type { Project } from '../types';

export const exportProjectsToCSV = (projects: Project[]) => {
    // Define CSV headers
    const headers = [
        'ID',
        'Name',
        'Status',
        'Score',
        'Start Date',
        'End Date',
        'Resource Count'
    ];

    // Map project data to rows
    const rows = projects.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
        p.status,
        p.score.toFixed(2),
        p.startDate || '',
        p.endDate || '',
        p.resourceRequirements.length
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
