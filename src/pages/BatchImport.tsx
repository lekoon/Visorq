import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Project } from '../types';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

const BatchImport: React.FC = () => {
    const { addProject, factorDefinitions } = useStore();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const downloadTemplate = () => {
        // 创建CSV模板
        const headers = [
            'Name',
            'Description',
            'Status',
            'Priority',
            'Start Date',
            'End Date',
            ...factorDefinitions.map(f => f.name)
        ];

        const sampleRow = [
            'Sample Project',
            'This is a sample project description',
            'planning',
            'P1',
            '2025-01-01',
            '2025-12-31',
            ...factorDefinitions.map(() => '5')
        ];

        const csv = [
            headers.join(','),
            sampleRow.join(',')
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'project_import_template.csv';
        link.click();
    };

    const parseCSV = (text: string): string[][] => {
        const lines = text.split('\n').filter(line => line.trim());
        return lines.map(line => {
            // 简单的CSV解析（不处理引号内的逗号）
            return line.split(',').map(cell => cell.trim());
        });
    };

    const handleFileUpload = async (file: File) => {
        setImporting(true);
        setResult(null);

        try {
            const text = await file.text();
            const rows = parseCSV(text);

            if (rows.length < 2) {
                throw new Error('File is empty or invalid');
            }

            const headers = rows[0];
            const dataRows = rows.slice(1);

            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            // 查找列索引
            const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'));
            const descIdx = headers.findIndex(h => h.toLowerCase().includes('desc'));
            const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'));
            const priorityIdx = headers.findIndex(h => h.toLowerCase().includes('priority'));
            const startDateIdx = headers.findIndex(h => h.toLowerCase().includes('start'));
            const endDateIdx = headers.findIndex(h => h.toLowerCase().includes('end'));

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                const rowNum = i + 2; // +2 because of header and 0-index

                try {
                    if (!row[nameIdx] || row[nameIdx].trim() === '') {
                        throw new Error(`Row ${rowNum}: Name is required`);
                    }

                    // 构建因子对象
                    const factors: Record<string, number> = {};
                    factorDefinitions.forEach((factor, idx) => {
                        const factorIdx = headers.findIndex(h => h === factor.name);
                        if (factorIdx !== -1 && row[factorIdx]) {
                            const value = parseInt(row[factorIdx]);
                            factors[factor.id] = isNaN(value) ? 5 : Math.min(10, Math.max(0, value));
                        } else {
                            factors[factor.id] = 5; // 默认值
                        }
                    });

                    const project: Project = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: row[nameIdx],
                        description: row[descIdx] || '',
                        status: (row[statusIdx]?.toLowerCase() as Project['status']) || 'planning',
                        priority: (row[priorityIdx] as Project['priority']) || 'P2',
                        startDate: row[startDateIdx] || '',
                        endDate: row[endDateIdx] || '',
                        factors,
                        score: 0,
                        resourceRequirements: []
                    };

                    addProject(project);
                    success++;
                } catch (error) {
                    failed++;
                    errors.push(error instanceof Error ? error.message : `Row ${rowNum}: Unknown error`);
                }
            }

            setResult({ success, failed, errors });
        } catch (error) {
            setResult({
                success: 0,
                failed: 0,
                errors: [error instanceof Error ? error.message : 'Failed to parse file']
            });
        } finally {
            setImporting(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                handleFileUpload(file);
            } else {
                alert('Please upload a CSV file');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">{t('import.title')}</h2>
                <p className="text-slate-500 mt-1">{t('import.subtitle')}</p>
            </div>

            {/* Download Template */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="text-blue-600" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">{t('import.downloadTemplate')}</h3>
                        <p className="text-sm text-slate-600 mb-3">
                            {t('import.templateDescription')}
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <Download size={16} />
                            {t('import.downloadCSV')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload className="mx-auto text-slate-400 mb-4" size={48} />
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {dragOver ? t('import.dropFile') : t('import.uploadFile')}
                </h3>
                <p className="text-slate-500 mb-4">
                    {t('import.dragOrClick')}
                </p>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {importing ? t('import.importing') : t('import.selectFile')}
                </button>
            </div>

            {/* Import Result */}
            {result && (
                <div className={`rounded-2xl p-6 border-2 ${result.failed === 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${result.failed === 0 ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                            {result.failed === 0 ? (
                                <CheckCircle className="text-green-600" size={24} />
                            ) : (
                                <AlertCircle className="text-orange-600" size={24} />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 mb-2">{t('import.importComplete')}</h3>
                            <div className="space-y-1 text-sm mb-3">
                                <p className="text-green-700">
                                    ✓ {result.success} {t('import.projectsImported')}
                                </p>
                                {result.failed > 0 && (
                                    <p className="text-orange-700">
                                        ✗ {result.failed} {t('import.projectsFailed')}
                                    </p>
                                )}
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border border-orange-200">
                                    <h4 className="font-bold text-sm text-slate-900 mb-2">{t('import.errors')}:</h4>
                                    <ul className="text-xs text-slate-600 space-y-1 max-h-40 overflow-y-auto">
                                        {result.errors.map((error, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <X size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                                                <span>{error}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-3">{t('import.instructions')}</h3>
                <ol className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">1.</span>
                        <span>{t('import.step1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">2.</span>
                        <span>{t('import.step2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">3.</span>
                        <span>{t('import.step3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">4.</span>
                        <span>{t('import.step4')}</span>
                    </li>
                </ol>
            </div>
        </div>
    );
};

export default BatchImport;
