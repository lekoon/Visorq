import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Download, Upload, AlertTriangle, Database, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
    const { factorDefinitions, addFactor, updateFactor, deleteFactor, recalculateScores, projects, resourcePool } = useStore();
    const { t } = useTranslation();
    const [newFactorName, setNewFactorName] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const totalWeight = factorDefinitions.reduce((acc, f) => acc + f.weight, 0);

    const handleAddFactor = () => {
        if (newFactorName.trim()) {
            addFactor(newFactorName.trim());
            setNewFactorName('');
        }
    };

    // Backup Data
    const handleBackup = () => {
        const data = localStorage.getItem('ctpm-storage');
        if (!data) {
            alert('No data to backup');
            return;
        }

        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: JSON.parse(data)
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ctpm-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Restore Data
    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target?.result as string);
                if (backup.data && backup.version) {
                    localStorage.setItem('ctpm-storage', JSON.stringify(backup.data));
                    alert('Data restored successfully! Please refresh the page.');
                    window.location.reload();
                } else {
                    alert('Invalid backup file format');
                }
            } catch (error) {
                alert('Error reading backup file');
            }
        };
        reader.readAsText(file);
    };

    // Clear All Data
    const handleClearData = () => {
        if (showClearConfirm) {
            localStorage.removeItem('ctpm-storage');
            alert('All data cleared! The page will reload.');
            window.location.reload();
        } else {
            setShowClearConfirm(true);
            setTimeout(() => setShowClearConfirm(false), 5000);
        }
    };

    // Calculate data statistics
    const dataStats = {
        projects: projects.length,
        resources: resourcePool.length,
        factors: factorDefinitions.length,
        storageSize: new Blob([localStorage.getItem('ctpm-storage') || '']).size
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('settings.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('settings.subtitle')}</p>
                </div>
                <button
                    onClick={recalculateScores}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors"
                >
                    {t('settings.recalculate')}
                </button>
            </div>

            {/* Data Management */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-800">{t('settings.dataManagement')}</h2>
                    </div>
                    <p className="text-slate-500">{t('settings.dataDesc')}</p>
                </div>

                {/* Data Statistics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-600 font-medium">{t('settings.projects')}</p>
                        <p className="text-2xl font-bold text-blue-700">{dataStats.projects}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-sm text-green-600 font-medium">{t('settings.resources')}</p>
                        <p className="text-2xl font-bold text-green-700">{dataStats.resources}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <p className="text-sm text-purple-600 font-medium">{t('settings.factors')}</p>
                        <p className="text-2xl font-bold text-purple-700">{dataStats.factors}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <p className="text-sm text-orange-600 font-medium">{t('settings.storage')}</p>
                        <p className="text-2xl font-bold text-orange-700">{(dataStats.storageSize / 1024).toFixed(1)} KB</p>
                    </div>
                </div>

                {/* Backup & Restore Actions */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <Shield className="text-blue-600" size={24} />
                        <div className="flex-1">
                            <h3 className="font-bold text-blue-900">{t('settings.backup')}</h3>
                            <p className="text-sm text-blue-700">{t('settings.backupDesc')}</p>
                        </div>
                        <button
                            onClick={handleBackup}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Download size={18} />
                            {t('settings.backupNow')}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                        <Upload className="text-green-600" size={24} />
                        <div className="flex-1">
                            <h3 className="font-bold text-green-900">{t('settings.restore')}</h3>
                            <p className="text-sm text-green-700">{t('settings.restoreDesc')}</p>
                        </div>
                        <label className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2 shadow-lg">
                            <Upload size={18} />
                            {t('settings.restore')}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                        <AlertTriangle className="text-red-600" size={24} />
                        <div className="flex-1">
                            <h3 className="font-bold text-red-900">{t('settings.clearData')}</h3>
                            <p className="text-sm text-red-700">
                                {showClearConfirm ? t('settings.confirmClear') : t('settings.clearDesc')}
                            </p>
                        </div>
                        <button
                            onClick={handleClearData}
                            className={`px-6 py-3 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg ${showClearConfirm ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        >
                            <Trash2 size={18} />
                            {showClearConfirm ? t('settings.confirmDelete') : t('settings.clearData')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Scoring Factors */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('settings.scoringFactors')}</h2>
                        <p className="text-slate-500">{t('settings.scoringDesc')}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-bold ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {t('settings.totalWeight')}: {totalWeight}%
                    </div>
                </div>

                <div className="space-y-4">
                    {factorDefinitions.map((factor) => (
                        <div key={factor.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">{factor.name}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    value={factor.weight}
                                    onChange={(e) => updateFactor(factor.id, { weight: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="w-20 text-center">
                                <span className="font-bold text-slate-900">{factor.weight}%</span>
                            </div>
                            <button
                                onClick={() => deleteFactor(factor.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Factor"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4">
                    <input
                        type="text"
                        placeholder={t('settings.newFactorPlaceholder')}
                        className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newFactorName}
                        onChange={(e) => setNewFactorName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFactor()}
                    />
                    <button
                        onClick={handleAddFactor}
                        disabled={!newFactorName}
                        className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        {t('settings.addFactor')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
