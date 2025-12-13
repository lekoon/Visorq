# Visorq 个人开发者落地执行指南 (Solo Developer Execution Guide)

**文档状态**: 执行中  
**版本**: v1.0  
**日期**: 2025-12-13  
**目标读者**: 个人全栈开发者 (Non-Expert Back-End friendly)  
**关联文档**: `VISORQ_ARCHITECTURE_AND_DEPLOYMENT_PLAN.md`

---

## 1. 核心问题解答

### Q1: Gemini/Claude 能否完全辅助开发实现？

**答案：可以。**
目前的 LLM (Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o) 对于标准化技术栈的代码生成能力极强。

*   **NestJS + TypeORM/Prisma**: 这是非常标准的后端组合，AI 能够生成近乎完美的基础 CRUD 代码、Auth 认证模块和数据库模型定义。
*   **前端修改**: 由于您已有前端代码，AI 可以很容易地读取现有 `interface` (如 `src/types/index.ts`)，然后为您生成对应的后端 `Entity` 或 `Schema`。
*   **Docker/部署**: AI 可以为您编写完整的 `Dockerfile` 和 `docker-compose.yml`，解决环境配置难题。

**推荐开发模式（AI-Driven Development）**：
1.  **定义数据结构**：把 `src/types/index.ts` 发给 AI，让它生成 `schema.prisma`。
2.  **生成后端模块**：提示 AI "基于这个 schema，使用 NestJS 生成 Projects 模块的 Controller 和 Service，包含 CRUD 功能"。
3.  **前端对接**：提示 AI "这是原来的 `projects.ts` mock api，请把它替换为调用 `axios.get('/api/projects')` 的真实实现"。

### Q2: 需要什么环境配置？

#### A. 本地开发环境 (Windows/Mac)
您的电脑不仅是写代码的地方，也是运行“微型服务器”的地方。

1.  **Node.js (LTS 版本)**:  
    *   下载地址: [nodejs.org](https://nodejs.org/) (推荐 v20.x 或 v22.x)
    *   用途: 运行前端构建工具 (Vite) 和 后端服务 (NestJS)。
2.  **Docker Desktop**:
    *   下载地址: [docker.com](https://www.docker.com/products/docker-desktop/)
    *   用途: 一键启动数据库 (PostgreSQL) 和缓存 (Redis)，无需繁琐安装配置。对于初学者，这是最简单的管理数据库方式。
3.  **VS Code + 插件**:
    *   *Docker*: 管理容器。
    *   *Prisma* (如果选 Prisma): 语法高亮。
    *   *Thunder Client* 或 *Postman*: 用于测试后端接口，不用打开浏览器就能测 API。
4.  **Git**: 版本控制，必须安装。

#### B. 线上部署资源 (Production)
对于个人开发者，不需要昂贵的云服务集群。一台轻量级云服务器 (VPS) 足够支撑初期 100+ 用户。

**推荐配置 (Minimum)**:
*   **CPU**: 2 vCPU
*   **内存**: 4GB RAM (NestJS + Postgres + Redis 至少需要 3GB 比较稳)
*   **硬盘**: 50GB SSD
*   **带宽**: 3-5 Mbps (常规使用足够，静态资源如图片大可以用 CDN 优化)

**预算参考**:
*   *腾讯云/阿里云/华为云*: 轻量应用服务器，约 ¥30-60/月。
*   *DigitalOcean/Vultr/Hetzner*: 约 $6-10/月。

---

## 2. 个人开发者落地步骤详解 (Step-by-Step)

### 第一阶段：本地跑通后端 (The "Hello World" of Backend)

**目标**：在自己电脑上让后端跑起来，数据库连通。

1.  **准备数据库**:
    *   在项目根目录创建 `docker-compose.dev.yml`:
        ```yaml
        version: '3.8'
        services:
          postgres:
            image: postgres:15
            environment:
              POSTGRES_USER: admin
              POSTGRES_PASSWORD: mysecretpassword
              POSTGRES_DB: visorq_local
            ports:
              - "5432:5432"
        ```
    *   运行 `docker-compose -f docker-compose.dev.yml up -d`。数据库就准备好了！

2.  **初始化后端**:
    *   执行 `npx @nestjs/cli new backend` (创建后端文件夹)。
    *   `cd backend`，安装 Prisma: `npm install prisma --save-dev`，`npx prisma init`。
    
3.  **AI 辅助生成数据表**:
    *   把前端 `src/types/index.ts` 的内容复制给 Claude/Gemini。
    *   **Prompt**: *"我是前端开发者，这是我的 `types.ts`。请帮我写一个 `schema.prisma` 文件，用 PostgreSQL，把这些 TS 接口转换成数据库模型。Project 和 Task 是一对多关系。"*
    *   把 AI 生成的代码贴入 `backend/prisma/schema.prisma`。
    *   运行 `npx prisma db push`。此时您的数据库里已经有了表结构！

### 第二阶段：前后端联调 (Connecting the Dots)

**目标**：前端不再读 LocalStorage，而是读后端。

1.  **AI 生成 API 代码**:
    *   **Prompt**: *"基于上面的 Prisma schema，请在 NestJS 中为 Project 模型生成 Controller 和 Service，实现 create, findAll, findOne, update, remove 方法。请给我完整的代码文件。"*
    *   将代码复制到 `backend/src/projects/` 目录。

2.  **前端改造**:
    *   在前端安装 Axios: `npm install axios`。
    *   配置代理 (Vite): 在 `vite.config.ts` 中添加 `server.proxy`，把 `/api` 转发到 `http://localhost:3000` (后端默认端口)。
    *   **Prompt**: *"这是我现在的 `useStore.ts` (基于 Zustand)，它是读写本地 LocalStorage 的。请帮我改造它，把 `fetchProjects` 改成用 axios 调用 `/api/projects`，把 `addProject` 改成 POST 请求。"*
    *   替换前端代码，刷新页面，您看到的数据就是来自数据库的了！

### 第三阶段：部署上线 (Go Live)

**目标**：把您的电脑上的东西搬到云服务器。

1.  **购买服务器**: 买了 VPS 后，装个 Ubuntu 22.04 LTS 系统。
2.  **安装 Docker**:
    *   SSH 连上服务器。
    *   执行 `curl -fsSL https://get.docker.com | bash` (官方一键安装脚本)。
3.  **打包上传**:
    *   在项目根目录创建一个生产用的 `docker-compose.prod.yml` (AI 可帮您写，整合前端 Nginx + 后端 NestJS + 数据库)。
    *   把代码推送到 GitHub。
    *   在服务器上 `git clone` 您的项目。
4.  **启动**:
    *   在服务器项目目录下运行 `docker compose -f docker-compose.prod.yml up -d`。
    *   访问服务器 IP，就能看到您的 Visorq 在线运行了！

---

## 3. 资源清单与成本预估 (Bill of Materials)

| 项目 | 规格/类型 | 建议方案 | 预估成本 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| **云服务器** | 2核4G, 50G SSD | 腾讯云轻量 / Hetzner CPX21 | ¥40-60/月 | 必须支持 Docker |
| **域名** | .com / .xyz | Namecheap / 阿里云 | ¥10-80/年 | 没域名也可以用 IP 访问，但不专业 |
| **SSL 证书** | HTTPS 安全锁 | Let's Encrypt | **免费** | 必须配置，否则浏览器会警告不安全 |
| **对象存储** (可选) | 文件上传存储 | AWS S3 / 阿里云 OSS | 按量付费 | 初期直接存服务器硬盘即可，省钱 |
| **AI API** (可选) | LLM Key | OpenAI / Anthropic / Gemini | 按量付费 | 初期自用几乎不花钱，Google Gemini Pro 目前有免费层 |

## 4. 给您的特别建议 (Pro Tips)

1.  **不要一开始就追求微服务**：对于个人开发者，**单体架构 (Monolith)** 是最好的选择。把所有后端代码放在一个 NestJS 项目里，部署维护最简单。等用户量过万了再拆分不迟。
2.  **善用 AI 写 SQL/Prisma**：数据库操作是前端最头疼的，直接把需求告诉 AI (例如 *"查出所有逾期的 P0 级任务"*), 让 AI 给您写 Prisma 查询语句。
3.  **先把数据存下来**：不要急着做复杂的 RBAC 权限或 WebSocket 实时协同。先把最简单的增删改查 (CRUD) 跑通，让数据能持久化到云端数据库，这就已经比 LocalStorage 版本强无数倍了。
4.  **每日备份**：设置一个简单的 Cron Job (定时任务)，每天把数据库导出个文件存起来。这是个人开发者最通过的“高可用”方案。

---

*按照这个指南，结合 Gemini/Claude 强大的代码生成能力，即使您主要熟悉前端，也完全有能力在一个月内独立完成 Visorq 的商业化部署。加油！*
