import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Download, Upload, AlertTriangle, Database, Shield, Cloud, RefreshCw, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { syncFeishuData } from '../services/feishuService';


const Settings: React.FC = () => {
    const {
        factorDefinitions,
        addFactor,
        updateFactor,
        deleteFactor,
        recalculateScores,
        projects,
        resourcePool,
        addProject,
        addResource,
        feishuConfig,
        setFeishuConfig,
        lastSyncTime,
        setLastSyncTime
    } = useStore();
    const { t } = useTranslation();
    const [newFactorName, setNewFactorName] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const [isSyncing, setIsSyncing] = useState(false);

    const totalWeight = factorDefinitions.reduce((acc, f) => acc + f.weight, 0);

    const handleAddFactor = () => {
        if (newFactorName.trim()) {
            addFactor(newFactorName.trim());
            setNewFactorName('');
        }
    };

    // Feishu Sync Handler
    const handleFeishuSync = async () => {
        if (!feishuConfig.appId) {
            alert('Please enter App ID');
            return;
        }
        setIsSyncing(true);
        try {
            const result = await syncFeishuData(feishuConfig);
            if (result.success) {
                // @ts-ignore - data is attached in service even if interface doesn't strictly say so for now
                if (result.data) {
                    // @ts-ignore
                    result.data.projects.forEach(p => {
                        // Simple check to avoid duplicates if ID exists
                        if (!projects.find(existing => existing.id === p.id)) {
                            addProject(p);
                        }
                    });
                    // @ts-ignore
                    result.data.resources.forEach(r => {
                        if (!resourcePool.find(existing => existing.id === r.id)) {
                            addResource(r);
                        }
                    });
                }
                setLastSyncTime(new Date().toLocaleString());
                alert(`Sync Complete!\nProjects: ${result.projectsSynced}\nResources: ${result.resourcesSynced}`);
            } else {
                alert(`Sync Failed:\n${result.errors.join('\n')}`);
            }
        } catch (e) {
            console.error(e);
            alert('An unexpected error occurred during sync.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Backup Data
    const handleBackup = () => {
        const data = localStorage.getItem('visorq-storage');
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
        a.download = `visorq-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
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
                    localStorage.setItem('visorq-storage', JSON.stringify(backup.data));
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
            localStorage.removeItem('visorq-storage');
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
        storageSize: new Blob([localStorage.getItem('visorq-storage') || '']).size
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('settings.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
                </div>
                <button
                    onClick={recalculateScores}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                    {t('settings.recalculate')}
                </button>
            </div>

            {/* Integrations Section */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Cloud className="text-purple-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Third-party Integrations</h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Connect Visorq with external platforms to sync data.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                                {/* Feishu Logo Placeholder or generic integration icon */}
                                <LinkIcon className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Feishu / Lark Integration</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Sync projects and resource availability from Feishu Base.</p>
                            </div>
                        </div>
                        {lastSyncTime && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-900/30 flex items-center gap-1">
                                <CheckCircle size={12} /> Last synced: {lastSyncTime}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">App ID</label>
                            <input
                                type="text"
                                placeholder="cli_a1b2c3d4e5f6"
                                value={feishuConfig.appId}
                                onChange={(e) => setFeishuConfig({ ...feishuConfig, appId: e.target.value })}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">App Secret</label>
                            <input
                                type="password"
                                placeholder="••••••••••••••••"
                                value={feishuConfig.appSecret}
                                onChange={(e) => setFeishuConfig({ ...feishuConfig, appSecret: e.target.value })}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Bitable Token / Table ID</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Base Token (e.g. bascn...)"
                                    value={feishuConfig.projectBaseToken || ''}
                                    onChange={(e) => setFeishuConfig({ ...feishuConfig, projectBaseToken: e.target.value })}
                                    className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Table ID (e.g. tbl...)"
                                    value={feishuConfig.projectTableId || ''}
                                    onChange={(e) => setFeishuConfig({ ...feishuConfig, projectTableId: e.target.value })}
                                    className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 italic">需在飞书多维表格中开启“项目名称”、“状态”、“预算”等对应字段</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleFeishuSync}
                            disabled={isSyncing || !feishuConfig.appId}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-all
                                ${isSyncing
                                    ? 'bg-purple-400 cursor-wait'
                                    : !feishuConfig.appId ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'}
                            `}
                        >
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync Data Now'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('settings.dataManagement')}</h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{t('settings.dataDesc')}</p>
                </div>

                {/* Data Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('settings.projects')}</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dataStats.projects}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">{t('settings.resources')}</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{dataStats.resources}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{t('settings.factors')}</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{dataStats.factors}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">{t('settings.storage')}</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{(dataStats.storageSize / 1024).toFixed(1)} KB</p>
                    </div>
                </div>

                {/* Backup & Restore Actions */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <Shield className="text-blue-600 dark:text-blue-400" size={24} />
                        <div className="flex-1">
                            <h3 className="font-bold text-blue-900 dark:text-blue-100">{t('settings.backup')}</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{t('settings.backupDesc')}</p>
                        </div>
                        <button
                            onClick={handleBackup}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Download size={18} />
                            {t('settings.backupNow')}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                        <Upload className="text-green-600 dark:text-green-400" size={24} />
                        <div className="flex-1">
                            <h3 className="font-bold text-green-900 dark:text-green-100">{t('settings.restore')}</h3>
                            <p className="text-sm text-green-700 dark:text-green-300">{t('settings.restoreDesc')}</p>
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

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                        <div className="flex-1">
                            <h3 className="font-bold text-red-900 dark:text-red-100">{t('settings.clearData')}</h3>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {showClearConfirm ? t('settings.confirmClear') : t('settings.clearDesc')}
                            </p>
                        </div>
                        <button
                            onClick={handleClearData}
                            className={`px-6 py-3 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg ${showClearConfirm ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'}`}
                        >
                            <Trash2 size={18} />
                            {showClearConfirm ? t('settings.confirmDelete') : t('settings.clearData')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Scoring Factors */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('settings.scoringFactors')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t('settings.scoringDesc')}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-bold ${totalWeight === 100 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'}`}>
                        {t('settings.totalWeight')}: {totalWeight}%
                    </div>
                </div>

                <div className="space-y-4">
                    {factorDefinitions.map((factor) => (
                        <div key={factor.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-600">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{factor.name}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    value={factor.weight}
                                    onChange={(e) => updateFactor(factor.id, { weight: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="w-20 text-center">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{factor.weight}%</span>
                            </div>
                            <button
                                onClick={() => deleteFactor(factor.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remove Factor"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex gap-4">
                    <input
                        type="text"
                        placeholder={t('settings.newFactorPlaceholder')}
                        className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newFactorName}
                        onChange={(e) => setNewFactorName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFactor()}
                    />
                    <button
                        onClick={handleAddFactor}
                        disabled={!newFactorName}
                        className="px-6 py-3 bg-slate-900 dark:bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
