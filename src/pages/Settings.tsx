import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2 } from 'lucide-react';

const Settings: React.FC = () => {
    const { factorDefinitions, addFactor, updateFactor, deleteFactor, recalculateScores } = useStore();
    const [newFactorName, setNewFactorName] = useState('');

    const totalWeight = factorDefinitions.reduce((acc, f) => acc + f.weight, 0);

    const handleAddFactor = () => {
        if (newFactorName.trim()) {
            addFactor(newFactorName.trim());
            setNewFactorName('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Configuration</h1>
                <button
                    onClick={recalculateScores}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors"
                >
                    Recalculate All Scores
                </button>
            </div>

            {/* Scoring Factors */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Scoring Factors</h2>
                        <p className="text-slate-500">Define the criteria used to prioritize projects.</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-bold ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        Total Weight: {totalWeight}%
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
                        placeholder="New Factor Name (e.g. Sustainability)"
                        className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newFactorName}
                        onChange={(e) => setNewFactorName(e.target.value)}
                    />
                    <button
                        onClick={handleAddFactor}
                        disabled={!newFactorName}
                        className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Factor
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
