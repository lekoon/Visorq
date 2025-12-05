import type { Task } from '../types';
import { addDays, format } from 'date-fns';

export interface TaskTemplate {
    name: string;
    description: string;
    estimatedDays: number;
    type: 'task' | 'milestone' | 'group';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    dependencies?: number[]; // 模板内的依赖索引
    subtasks?: TaskTemplate[];
}

export interface ProjectTemplate {
    id: string;
    name: string;
    category: 'web' | 'mobile' | 'data' | 'infrastructure' | 'custom';
    tasks: TaskTemplate[];
}

/**
 * 预定义的项目模板
 */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'web-app',
        name: 'Web 应用开发',
        category: 'web',
        tasks: [
            {
                name: '需求分析',
                description: '收集和分析项目需求，编写需求文档',
                estimatedDays: 5,
                type: 'task',
                priority: 'P0'
            },
            {
                name: 'UI/UX 设计',
                description: '设计用户界面和交互流程',
                estimatedDays: 7,
                type: 'task',
                priority: 'P0',
                dependencies: [0]
            },
            {
                name: '技术架构设计',
                description: '设计系统架构和技术选型',
                estimatedDays: 3,
                type: 'task',
                priority: 'P0',
                dependencies: [0]
            },
            {
                name: '前端开发',
                description: '实现前端页面和交互',
                estimatedDays: 15,
                type: 'task',
                priority: 'P1',
                dependencies: [1, 2]
            },
            {
                name: '后端开发',
                description: '实现后端 API 和业务逻辑',
                estimatedDays: 15,
                type: 'task',
                priority: 'P1',
                dependencies: [2]
            },
            {
                name: '数据库设计',
                description: '设计数据库结构和优化',
                estimatedDays: 3,
                type: 'task',
                priority: 'P1',
                dependencies: [2]
            },
            {
                name: '集成测试',
                description: '前后端集成和功能测试',
                estimatedDays: 5,
                type: 'task',
                priority: 'P1',
                dependencies: [3, 4]
            },
            {
                name: '性能优化',
                description: '优化系统性能和用户体验',
                estimatedDays: 3,
                type: 'task',
                priority: 'P2',
                dependencies: [6]
            },
            {
                name: '部署上线',
                description: '部署到生产环境',
                estimatedDays: 2,
                type: 'milestone',
                priority: 'P0',
                dependencies: [7]
            }
        ]
    },
    {
        id: 'mobile-app',
        name: '移动应用开发',
        category: 'mobile',
        tasks: [
            {
                name: '需求分析',
                description: '收集和分析移动应用需求',
                estimatedDays: 4,
                type: 'task',
                priority: 'P0'
            },
            {
                name: 'UI/UX 设计',
                description: '设计移动端界面',
                estimatedDays: 6,
                type: 'task',
                priority: 'P0',
                dependencies: [0]
            },
            {
                name: 'iOS 开发',
                description: '开发 iOS 应用',
                estimatedDays: 20,
                type: 'task',
                priority: 'P1',
                dependencies: [1]
            },
            {
                name: 'Android 开发',
                description: '开发 Android 应用',
                estimatedDays: 20,
                type: 'task',
                priority: 'P1',
                dependencies: [1]
            },
            {
                name: '后端 API',
                description: '开发后端接口',
                estimatedDays: 12,
                type: 'task',
                priority: 'P1',
                dependencies: [0]
            },
            {
                name: '测试',
                description: '功能测试和兼容性测试',
                estimatedDays: 7,
                type: 'task',
                priority: 'P1',
                dependencies: [2, 3, 4]
            },
            {
                name: '发布',
                description: '提交应用商店审核',
                estimatedDays: 3,
                type: 'milestone',
                priority: 'P0',
                dependencies: [5]
            }
        ]
    },
    {
        id: 'data-analysis',
        name: '数据分析项目',
        category: 'data',
        tasks: [
            {
                name: '数据收集',
                description: '收集和整理数据源',
                estimatedDays: 5,
                type: 'task',
                priority: 'P0'
            },
            {
                name: '数据清洗',
                description: '清洗和预处理数据',
                estimatedDays: 7,
                type: 'task',
                priority: 'P0',
                dependencies: [0]
            },
            {
                name: '探索性分析',
                description: '进行初步数据分析',
                estimatedDays: 5,
                type: 'task',
                priority: 'P1',
                dependencies: [1]
            },
            {
                name: '建模',
                description: '构建分析模型',
                estimatedDays: 10,
                type: 'task',
                priority: 'P1',
                dependencies: [2]
            },
            {
                name: '可视化',
                description: '创建数据可视化报表',
                estimatedDays: 5,
                type: 'task',
                priority: 'P1',
                dependencies: [3]
            },
            {
                name: '报告撰写',
                description: '编写分析报告',
                estimatedDays: 3,
                type: 'task',
                priority: 'P1',
                dependencies: [4]
            }
        ]
    }
];

/**
 * 根据项目描述智能生成任务建议
 */
export const generateTaskSuggestions = (
    projectDescription: string,
    projectCategory?: 'web' | 'mobile' | 'data' | 'infrastructure' | 'custom'
): TaskTemplate[] => {
    // 简化版：基于关键词匹配
    const keywords = projectDescription.toLowerCase();

    // 如果指定了类别，使用对应模板
    if (projectCategory && projectCategory !== 'custom') {
        const template = PROJECT_TEMPLATES.find(t => t.category === projectCategory);
        if (template) {
            return template.tasks;
        }
    }

    // 否则根据关键词推断
    if (keywords.includes('web') || keywords.includes('网站') || keywords.includes('网页')) {
        return PROJECT_TEMPLATES.find(t => t.id === 'web-app')!.tasks;
    }

    if (keywords.includes('mobile') || keywords.includes('app') || keywords.includes('移动') || keywords.includes('手机')) {
        return PROJECT_TEMPLATES.find(t => t.id === 'mobile-app')!.tasks;
    }

    if (keywords.includes('data') || keywords.includes('数据') || keywords.includes('分析')) {
        return PROJECT_TEMPLATES.find(t => t.id === 'data-analysis')!.tasks;
    }

    // 默认返回通用任务
    return [
        {
            name: '需求分析',
            description: '明确项目需求和目标',
            estimatedDays: 5,
            type: 'task',
            priority: 'P0'
        },
        {
            name: '方案设计',
            description: '设计解决方案',
            estimatedDays: 5,
            type: 'task',
            priority: 'P0',
            dependencies: [0]
        },
        {
            name: '开发实现',
            description: '实现核心功能',
            estimatedDays: 15,
            type: 'task',
            priority: 'P1',
            dependencies: [1]
        },
        {
            name: '测试验证',
            description: '测试和验证功能',
            estimatedDays: 5,
            type: 'task',
            priority: 'P1',
            dependencies: [2]
        },
        {
            name: '交付上线',
            description: '部署和交付',
            estimatedDays: 2,
            type: 'milestone',
            priority: 'P0',
            dependencies: [3]
        }
    ];
};

/**
 * 将任务模板转换为实际任务
 */
export const convertTemplateToTasks = (
    templates: TaskTemplate[],
    startDate: Date,
    projectId: string
): Task[] => {
    const tasks: Task[] = [];
    const taskMap = new Map<number, string>(); // 模板索引 -> 任务ID

    let currentDate = new Date(startDate);

    templates.forEach((template, index) => {
        const taskId = `${projectId}-task-${Date.now()}-${index}`;
        taskMap.set(index, taskId);

        // 计算开始日期（考虑依赖）
        if (template.dependencies && template.dependencies.length > 0) {
            let latestEndDate = currentDate;

            for (const depIndex of template.dependencies) {
                const depTask = tasks.find(t => t.id === taskMap.get(depIndex));
                if (depTask && depTask.endDate) {
                    const depEndDate = new Date(depTask.endDate);
                    if (depEndDate > latestEndDate) {
                        latestEndDate = depEndDate;
                    }
                }
            }

            currentDate = addDays(latestEndDate, 1);
        }

        const endDate = addDays(currentDate, template.estimatedDays);

        const task: Task = {
            id: taskId,
            name: template.name,
            description: template.description,
            startDate: format(currentDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            progress: 0,
            type: template.type,
            priority: template.priority,
            status: 'planning',
            dependencies: template.dependencies?.map(i => taskMap.get(i)!).filter(Boolean),
            color: template.type === 'milestone' ? '#10B981' :
                template.priority === 'P0' ? '#EF4444' :
                    template.priority === 'P1' ? '#F59E0B' : '#3B82F6'
        };

        tasks.push(task);
    });

    return tasks;
};

/**
 * 估算任务工作量（基于历史数据）
 */
export const estimateTaskEffort = (
    taskName: string,
    taskDescription: string,
    historicalTasks: Task[] = []
): {
    estimatedDays: number;
    confidence: number;
    similarTasks: Task[];
} => {
    // 查找相似任务
    const keywords = (taskName + ' ' + taskDescription).toLowerCase().split(' ');
    const similarTasks: { task: Task; similarity: number }[] = [];

    for (const task of historicalTasks) {
        const taskText = (task.name + ' ' + (task.description || '')).toLowerCase();
        let matchCount = 0;

        for (const keyword of keywords) {
            if (keyword.length > 2 && taskText.includes(keyword)) {
                matchCount++;
            }
        }

        const similarity = matchCount / keywords.length;
        if (similarity > 0.3) {
            similarTasks.push({ task, similarity });
        }
    }

    similarTasks.sort((a, b) => b.similarity - a.similarity);

    if (similarTasks.length === 0) {
        // 无历史数据，返回默认估算
        return {
            estimatedDays: 5,
            confidence: 30,
            similarTasks: []
        };
    }

    // 计算平均工期
    const top5 = similarTasks.slice(0, 5);
    let totalDays = 0;

    for (const { task } of top5) {
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
    }

    const estimatedDays = Math.round(totalDays / top5.length);
    const confidence = Math.min(90, 50 + top5.length * 10);

    return {
        estimatedDays,
        confidence,
        similarTasks: top5.map(s => s.task)
    };
};

/**
 * 优化任务排期（考虑资源约束）
 */
export const optimizeTaskSchedule = (
    tasks: Task[],
    resourceConstraints?: {
        maxParallelTasks: number;
        workingDaysPerWeek: number;
    }
): Task[] => {
    // 简化版：确保任务不在周末
    // 未来可以使用 resourceConstraints 进行更复杂的优化
    return tasks.map(task => {
        let start = new Date(task.startDate);
        let end = new Date(task.endDate);

        // 跳过周末
        while (start.getDay() === 0 || start.getDay() === 6) {
            start = addDays(start, 1);
        }

        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        let workingDays = 0;
        let current = new Date(start);

        while (workingDays < duration) {
            if (current.getDay() !== 0 && current.getDay() !== 6) {
                workingDays++;
            }
            if (workingDays < duration) {
                current = addDays(current, 1);
            }
        }

        return {
            ...task,
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(current, 'yyyy-MM-dd')
        };
    });
};
