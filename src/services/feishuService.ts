import type { Project, ResourcePoolItem, FeishuConfig } from '../types';

/**
 * Feishu / Lark Bitable Integration Service
 * 
 * NOTE: For production, App Secret should NEVER be stored or used directly in the browser.
 * Use a backend proxy to handle authentication and API calls to avoid CORS issues 
 * and protect your credentials.
 */



export interface FeishuSyncResult {
    success: boolean;
    projectsSynced: number;
    resourcesSynced: number;
    errors: string[];
    data?: {
        projects: Project[];
        resources: ResourcePoolItem[];
    };
}

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

/**
 * Get Tenant Access Token
 * In a real browser environment, this will likely fail due to CORS.
 * This should be called from a backend/serverless function.
 */
async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
    const response = await fetch(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
            app_id: appId,
            app_secret: appSecret,
        }),
    });

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`Feishu Auth Error: ${data.msg}`);
    }
    return data.tenant_access_token;
}

/**
 * Fetch Bitable Records
 */
async function getBitableRecords(token: string, baseToken: string, tableId: string): Promise<any[]> {
    const response = await fetch(`${FEISHU_API_BASE}/bitable/v1/apps/${baseToken}/tables/${tableId}/records`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`Bitable Fetch Error: ${data.msg}`);
    }
    return data.data.items;
}

export const syncFeishuData = async (config: FeishuConfig): Promise<FeishuSyncResult> => {
    const syncedProjects: Project[] = [];
    const syncedResources: ResourcePoolItem[] = [];

    try {
        if (!config.appId || !config.appSecret) {
            throw new Error('Missing App ID or App Secret');
        }

        // 1. Get Token (Warning: CORS will likely block this in pure frontend)
        let token: string;
        try {
            token = await getTenantAccessToken(config.appId, config.appSecret);
        } catch (e: any) {
            // Fallback to mock for demonstration if API fails (e.g. CORS)
            console.warn('Real Feishu API call failed (likely CORS or invalid credentials). Falling back to mock for demo.', e);
            return simulateMockSync();
        }

        // 2. Sync Projects
        if (config.projectBaseToken && config.projectTableId) {
            const records = await getBitableRecords(token, config.projectBaseToken, config.projectTableId);
            records.forEach(record => {
                const fields = record.fields;
                syncedProjects.push({
                    id: record.record_id,
                    name: fields['项目名称'] || fields['name'] || '未命名项目',
                    description: fields['项目描述'] || fields['description'] || '',
                    status: mapFeishuStatus(fields['状态'] || fields['status']),
                    priority: fields['优先级'] || fields['priority'] || 'P2',
                    startDate: fields['开始日期'] || fields['start_date'] || new Date().toISOString().split('T')[0],
                    endDate: fields['结束日期'] || fields['end_date'] || new Date().toISOString().split('T')[0],
                    budget: fields['预算'] || fields['budget'] || 0,
                    factors: {}, // Map your factors here
                    score: fields['得分'] || fields['score'] || 0,
                    pmoMetrics: generateDefaultPMOMetrics(fields),
                });
            });
        }

        // 3. Sync Resources
        if (config.resourceBaseToken && config.resourceTableId) {
            const records = await getBitableRecords(token, config.resourceBaseToken, config.resourceTableId);
            records.forEach(record => {
                const fields = record.fields;
                syncedResources.push({
                    id: record.record_id,
                    name: fields['姓名'] || fields['name'] || '未知人员',
                    department: fields['部门'] || fields['department'] || '',
                    category: fields['类别'] || fields['category'] || 'other',
                    totalQuantity: fields['数量'] || fields['quantity'] || 1,
                });
            });
        }

        return {
            success: true,
            projectsSynced: syncedProjects.length,
            resourcesSynced: syncedResources.length,
            errors: [],
            data: {
                projects: syncedProjects,
                resources: syncedResources
            }
        };

    } catch (e: any) {
        return {
            success: false,
            projectsSynced: 0,
            resourcesSynced: 0,
            errors: [e.message]
        };
    }
};

/**
 * Fallback mapping for status
 */
function mapFeishuStatus(status: string): any {
    const s = String(status).toLowerCase();
    if (s.includes('进行') || s.includes('progress')) return 'active';
    if (s.includes('规划') || s.includes('plan')) return 'planning';
    if (s.includes('完成') || s.includes('complete')) return 'completed';
    return 'planning';
}

/**
 * Generate default PMO Metrics if they are not provided in Feishu
 */
function generateDefaultPMOMetrics(fields: any): any {
    return {
        strategicConsistency: fields['战略一致性'] || 3.5 + Math.random() * 1.5,
        rdInvestment: fields['研发投入'] || fields['budget'] || 500,
        techPlatform: fields['技术平台'] || 'AI',
        valueRiskMetrics: {
            commercialROI: 3 + Math.random() * 2,
            strategicFit: 3 + Math.random() * 2,
            technicalFeasibility: 4,
            marketWindow: 3 + Math.random() * 2,
            resourceDependency: 2 + Math.random() * 2
        },
        cashFlow: {
            annualBudget: 5000,
            currentInvestment: fields['预算'] || 200,
            futureROI: [150, 300, 600]
        },
        resourceLoad: [
            { roleId: 'ai', roleName: 'AI 算法', monthlyUsage: { '2026-01': 1, '2026-02': 1.5 } },
            { roleId: 'hardware', roleName: '硬件工程', monthlyUsage: { '2026-01': 0.5, '2026-02': 0.8 } }
        ]
    };
}

/**
 * Mock implementation for demonstration when real API is unavailable (CORS/No Secret)
 */
async function simulateMockSync(): Promise<FeishuSyncResult> {
    await new Promise(r => setTimeout(r, 1500));

    const mockProjects: Project[] = [
        {
            id: 'fs-1',
            name: '[Bitable] 2026 旗舰级产品研发',
            description: '从多维表格同步的核心战略项目',
            status: 'active',
            priority: 'P0',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            budget: 2000000,
            factors: { strategy: 10, roi: 8 },
            score: 9.2,
            pmoMetrics: {
                strategicConsistency: 4.8,
                rdInvestment: 2000,
                techPlatform: 'AI',
                valueRiskMetrics: {
                    commercialROI: 4.5,
                    strategicFit: 4.9,
                    technicalFeasibility: 4.2,
                    marketWindow: 4.7,
                    resourceDependency: 3.5
                },
                cashFlow: {
                    annualBudget: 10000,
                    currentInvestment: 2000,
                    futureROI: [500, 1200, 2500]
                },
                resourceLoad: [
                    { roleId: 'ai', roleName: 'AI 算法', monthlyUsage: { '2026-01': 5, '2026-02': 6, '2026-03': 8 } }
                ]
            }
        },
        {
            id: 'fs-2',
            name: '[Bitable] 全球供应链优化',
            description: '跨区域同步项目',
            status: 'planning',
            priority: 'P1',
            startDate: '2026-06-01',
            endDate: '2026-09-30',
            budget: 850000,
            factors: { strategy: 7, roi: 9 },
            score: 8.5,
            pmoMetrics: {
                strategicConsistency: 3.2,
                rdInvestment: 850,
                techPlatform: 'Cloud',
                valueRiskMetrics: {
                    commercialROI: 4.0,
                    strategicFit: 3.5,
                    technicalFeasibility: 4.8,
                    marketWindow: 3.8,
                    resourceDependency: 2.5
                },
                cashFlow: {
                    annualBudget: 10000,
                    currentInvestment: 850,
                    futureROI: [100, 400, 900]
                },
                resourceLoad: [
                    { roleId: 'hardware', roleName: '硬件工程', monthlyUsage: { '2026-06': 3, '2026-07': 4 } }
                ]
            }
        }
    ];

    return {
        success: true,
        projectsSynced: mockProjects.length,
        resourcesSynced: 0,
        errors: ['注意：由于浏览器 CORS 限制及安全性考虑，前端已切换至模拟同步模式。生产环境请通过后端代理调用飞书 API。'],
        data: {
            projects: mockProjects,
            resources: []
        }
    };
}

