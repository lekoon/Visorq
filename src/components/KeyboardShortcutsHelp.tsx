import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
    key: string;
    description: string;
    category: string;
}

const KeyboardShortcutsHelp: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const shortcuts: Shortcut[] = [
        // Navigation
        { key: 'Ctrl + K', description: 'Open command palette', category: 'Navigation' },
        { key: 'Ctrl + B', description: 'Toggle sidebar', category: 'Navigation' },
        { key: 'Esc', description: 'Close modal/dialog', category: 'Navigation' },

        // Actions
        { key: 'Ctrl + N', description: 'New project', category: 'Actions' },
        { key: 'Ctrl + S', description: 'Save changes', category: 'Actions' },
        { key: 'Ctrl + F', description: 'Search/Filter', category: 'Actions' },
        { key: 'Ctrl + E', description: 'Export data', category: 'Actions' },

        // View
        { key: 'Ctrl + D', description: 'Toggle dark mode', category: 'View' },
        { key: 'Ctrl + L', description: 'Switch language', category: 'View' },
        { key: 'Ctrl + 1-5', description: 'Navigate to page', category: 'View' },

        // Help
        { key: '?', description: 'Show keyboard shortcuts', category: 'Help' },
        { key: 'Ctrl + H', description: 'Show help', category: 'Help' },
    ];

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Show help with '?' key
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                const target = e.target as HTMLElement;
                // Don't trigger if typing in input/textarea
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    setIsOpen(true);
                }
            }

            // Show help with Ctrl+H
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                setIsOpen(true);
            }

            // Close with Escape
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen]);

    if (!isOpen) return null;

    const categories = Array.from(new Set(shortcuts.map(s => s.category)));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                Keyboard Shortcuts
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Master these shortcuts to boost your productivity
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                    {categories.map(category => (
                        <div key={category} className="mb-6 last:mb-0">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                {category}
                            </h3>
                            <div className="space-y-2">
                                {shortcuts
                                    .filter(s => s.category === category)
                                    .map((shortcut, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <span className="text-slate-700 dark:text-slate-300">
                                                {shortcut.description}
                                            </span>
                                            <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-200 shadow-sm">
                                                {shortcut.key}
                                            </kbd>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                        Press <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">?</kbd> or{' '}
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">Ctrl+H</kbd>{' '}
                        anytime to view this help
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsHelp;
