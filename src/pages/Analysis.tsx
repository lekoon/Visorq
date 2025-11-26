import React from 'react';
import CostAnalysis from '../components/CostAnalysis';
import { useTranslation } from 'react-i18next';

const Analysis: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('cost.title') || '成本分析'}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    {t('cost.subtitle') || '全面的项目组合成本控制与预算分析'}
                </p>
            </div>

            <CostAnalysis />
        </div>
    );
};

export default Analysis;
