# UI组件库快速参考指南

## 📦 导入方式

```tsx
// 导入所有组件
import { PageContainer, PageHeader, Card, Button, StatCard, Badge } from '../components/ui';

// 或者单独导入
import PageContainer from '../components/ui/PageContainer';
import Card from '../components/ui/Card';
```

## 🎨 组件使用指南

### 1. PageContainer - 页面容器

**用途**: 为整个页面提供统一的背景和内边距

```tsx
<PageContainer>
  {/* 页面内容 */}
</PageContainer>

// 自定义类名
<PageContainer className="custom-class">
  {/* 页面内容 */}
</PageContainer>
```

**Props**:
- `children`: React.ReactNode - 页面内容
- `className?`: string - 额外的CSS类名

---

### 2. PageHeader - 页面头部

**用途**: 统一的页面标题、描述和操作按钮区域

```tsx
// 基础用法
<PageHeader
  title="页面标题"
  description="页面描述信息"
/>

// 带操作按钮
<PageHeader
  title="项目管理"
  description="管理和跟踪所有项目"
  actions={
    <>
      <Button variant="secondary" icon={Download}>导出</Button>
      <Button variant="primary" icon={Plus}>新建项目</Button>
    </>
  }
/>
```

**Props**:
- `title`: string - 页面标题 **(必需)**
- `description?`: string - 页面描述
- `actions?`: React.ReactNode - 操作按钮区域
- `className?`: string - 额外的CSS类名

---

### 3. Card - 卡片组件

**用途**: 统一的内容卡片容器

```tsx
// 基础用法
<Card>
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</Card>

// 不同内边距
<Card padding="none">无内边距</Card>
<Card padding="sm">小内边距 (16px)</Card>
<Card padding="md">中等内边距 (24px) - 默认</Card>
<Card padding="lg">大内边距 (32px)</Card>

// 悬停效果
<Card hover>
  鼠标悬停时显示阴影
</Card>
```

**Props**:
- `children`: React.ReactNode - 卡片内容 **(必需)**
- `padding?`: 'none' | 'sm' | 'md' | 'lg' - 内边距大小，默认 'md'
- `hover?`: boolean - 是否显示悬停效果，默认 false
- `className?`: string - 额外的CSS类名

---

### 4. Button - 按钮组件

**用途**: 统一的按钮样式和交互

```tsx
// 基础用法
<Button onClick={handleClick}>点击我</Button>

// 不同变体
<Button variant="primary">主要按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="danger">危险按钮</Button>
<Button variant="success">成功按钮</Button>
<Button variant="ghost">幽灵按钮</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="md">中等按钮</Button>
<Button size="lg">大按钮</Button>

// 带图标
import { Plus, Download, Trash2 } from 'lucide-react';

<Button icon={Plus}>新建</Button>
<Button icon={Download} iconPosition="right">下载</Button>

// 禁用状态
<Button disabled>禁用按钮</Button>

// 表单按钮
<Button type="submit" variant="primary">提交</Button>
```

**Props**:
- `children`: React.ReactNode - 按钮文字 **(必需)**
- `onClick?`: () => void - 点击事件处理函数
- `variant?`: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' - 按钮变体，默认 'primary'
- `size?`: 'sm' | 'md' | 'lg' - 按钮尺寸，默认 'md'
- `icon?`: LucideIcon - 图标组件
- `iconPosition?`: 'left' | 'right' - 图标位置，默认 'left'
- `disabled?`: boolean - 是否禁用，默认 false
- `type?`: 'button' | 'submit' | 'reset' - 按钮类型，默认 'button'
- `className?`: string - 额外的CSS类名

---

### 5. StatCard - 统计卡片

**用途**: 展示关键指标和统计数据

```tsx
import { TrendingUp, Users, DollarSign } from 'lucide-react';

// 基础用法
<StatCard
  title="总项目数"
  value={42}
  icon={TrendingUp}
  iconColor="blue"
/>

// 不同图标颜色
<StatCard title="活跃用户" value={1234} icon={Users} iconColor="green" />
<StatCard title="总收入" value="$50K" icon={DollarSign} iconColor="orange" />

// 带趋势指示器
<StatCard
  title="月度增长"
  value="15%"
  icon={TrendingUp}
  iconColor="green"
  trend={{ value: 12, isPositive: true }}
/>

<StatCard
  title="错误率"
  value="2.3%"
  icon={AlertTriangle}
  iconColor="red"
  trend={{ value: 5, isPositive: false }}
/>
```

**Props**:
- `title`: string - 统计标题 **(必需)**
- `value`: string | number - 统计值 **(必需)**
- `icon`: LucideIcon - 图标组件 **(必需)**
- `iconColor?`: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate' - 图标颜色，默认 'blue'
- `trend?`: { value: number, isPositive: boolean } - 趋势指示器
- `className?`: string - 额外的CSS类名

---

### 6. Badge - 徽章组件

**用途**: 显示状态、标签和分类

```tsx
// 基础用法
<Badge>默认徽章</Badge>

// 不同变体
<Badge variant="primary">主要</Badge>
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="danger">危险</Badge>
<Badge variant="info">信息</Badge>
<Badge variant="neutral">中性</Badge>

// 不同尺寸
<Badge size="sm">小</Badge>
<Badge size="md">中</Badge>
<Badge size="lg">大</Badge>

// 圆角样式
<Badge rounded="default">默认圆角</Badge>
<Badge rounded="full">完全圆角</Badge>

// 实际应用示例
<Badge variant="success" rounded="full">已完成</Badge>
<Badge variant="warning">进行中</Badge>
<Badge variant="danger" size="sm">高风险</Badge>
```

**Props**:
- `children`: React.ReactNode - 徽章内容 **(必需)**
- `variant?`: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' - 徽章变体，默认 'neutral'
- `size?`: 'sm' | 'md' | 'lg' - 徽章尺寸，默认 'md'
- `rounded?`: 'default' | 'full' - 圆角样式，默认 'default'
- `className?`: string - 额外的CSS类名

---

## 🎯 完整页面示例

### 示例 1: 仪表盘页面

```tsx
import React from 'react';
import { PageContainer, PageHeader, StatCard, Card, Button } from '../components/ui';
import { TrendingUp, Users, DollarSign, Download } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="仪表盘"
        description="项目概览和关键指标"
        actions={
          <Button variant="primary" icon={Download}>
            导出报表
          </Button>
        }
      />

      {/* KPI卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="总项目数"
          value={42}
          icon={TrendingUp}
          iconColor="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="活跃用户"
          value={1234}
          icon={Users}
          iconColor="green"
        />
        <StatCard
          title="总收入"
          value="$50K"
          icon={DollarSign}
          iconColor="orange"
        />
      </div>

      {/* 内容卡片 */}
      <Card>
        <h3 className="text-lg font-bold mb-4">最近活动</h3>
        {/* 活动列表 */}
      </Card>
    </PageContainer>
  );
};
```

### 示例 2: 项目列表页面

```tsx
import React from 'react';
import { PageContainer, PageHeader, Card, Button, Badge } from '../components/ui';
import { Plus, Filter } from 'lucide-react';

const Projects: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="项目管理"
        description="管理和跟踪所有项目"
        actions={
          <>
            <Button variant="secondary" icon={Filter}>筛选</Button>
            <Button variant="primary" icon={Plus}>新建项目</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover>
          <h3 className="text-lg font-bold mb-2">项目名称</h3>
          <p className="text-sm text-slate-600 mb-4">项目描述...</p>
          <div className="flex items-center gap-2">
            <Badge variant="success" rounded="full">已完成</Badge>
            <Badge variant="primary">P0</Badge>
          </div>
        </Card>
        {/* 更多项目卡片 */}
      </div>
    </PageContainer>
  );
};
```

---

## 🎨 设计标准

### 颜色使用
- **primary (蓝色)**: 主要操作、链接
- **success (绿色)**: 成功状态、完成
- **warning (橙色)**: 警告、待处理
- **danger (红色)**: 错误、删除、高风险
- **info (青色)**: 信息提示
- **neutral (灰色)**: 默认、中性状态

### 间距使用
- 卡片间距: `gap-6` (24px)
- 内容间距: `mb-4` / `mb-6` / `mb-8`
- 组件内边距: Card 默认 `p-6`

### 响应式网格
```tsx
// 1-3列响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 1-4列响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// 1-5列响应式 (KPI卡片)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
```

---

## ✅ 最佳实践

1. **始终使用 PageContainer 包裹页面内容**
2. **使用 PageHeader 统一页面头部**
3. **优先使用 StatCard 展示KPI数据**
4. **使用 Card 组织内容区块**
5. **使用 Button 替代原生 button 标签**
6. **使用 Badge 显示状态和标签**
7. **保持一致的间距和网格布局**
8. **支持深色模式 (组件已内置)**

---

**版本**: 1.0  
**创建时间**: 2025-12-13  
**最后更新**: 2025-12-13
