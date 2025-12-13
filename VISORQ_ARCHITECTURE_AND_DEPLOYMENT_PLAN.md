# Visorq 系统前后端分离与部署落地实施方案 (Architecture & Deployment Plan)

**文档状态**: 待审批  
**版本**: v1.0  
**日期**: 2025-12-12  
**作者**: Antigravity (Visorq 首席架构师)

---

## 1. 前言与目标

Visorq 当前作为一个基于浏览器 LocalStorage 的纯前端单页应用 (SPA)，在数据持久化、多用户协作、数据安全及性能扩展性方面存在局限。本方案旨在指导 Visorq 向**企业级前后端分离架构**的平滑演进，实现数据的云端存储、实时的多人协作以及高可用的部署能力。

**核心目标：**
1.  **数据安全性**：从本地存储迁移至企业级数据库（PostgreSQL），确保数据不丢失、可备份。
2.  **多用户协作**：支持多用户同时在线编辑、即时通讯及复杂的权限控制（RBAC）。
3.  **性能与扩展**：通过微服务或模块化单体架构，支撑百万级任务数据和复杂的 PMO 分析算法。
4.  **自动化运维**：建立标准化的 CI/CD 流水线，实现自动化构建、测试与部署。

---

## 2. 技术栈选型与架构设计

### 2.1 总体架构图 (Conceptual Architecture)

```mermaid
graph TD
    Client[Web Browser / Mobile] --> |HTTPS/WSS| LB[Load Balancer / Nginx]
    LB --> FE[Frontend Server (Static Assets)]
    LB --> API[API Gateway / Backend Service]
    
    subgraph "Backend Services"
        API --> Auth[Auth Service]
        API --> Core[Project & Task Core]
        API --> PMO[PMO Analyzers (EVM/Risk)]
        API --> AI[AI Decision Engine]
    end
    
    subgraph "Data Storage"
        Core --> DB[(PostgreSQL Primary)]
        PMO --> Redis[(Redis Cache)]
        AI --> VectorDB[(Vector DB for RAG)]
        Core --> OS[Object Storage (MinIO/S3)]
    end
    
    subgraph "DevOps"
        Git[Git Registry] --> CI[CI/CD Pipeline]
        CI --> Docker[Container Registry]
        Docker --> K8s[Kubernetes / Docker Swarm]
        Prometheus[Monitoring] -.-> API
    end
```

### 2.2 技术栈详细选型

| 层面 | 推荐技术 | 选型理由 |
| :--- | :--- | :--- |
| **前端 (保留)** | **React + TypeScript + Vite** | 复用现有代码，生态成熟，性能优异。 |
| **后端框架** | **NestJS (Node.js)** | 完美支持 TypeScript，与前端共享类型，模块化设计适合复杂业务；或者是 **Spring Boot** (如果企业有 Java 背景)。本方案默认推荐 **NestJS**。 |
| **数据库** | **PostgreSQL** | 强大的关系型数据处理能力，支持 JSONB (灵活性) 和 PostGIS (若需地理位置)，适合复杂项目管理数据。 |
| **缓存** | **Redis** | 用于各种即时状态、Session 缓存、排行榜计算及分布式锁。 |
| **ORM** | **Prisma** 或 **TypeORM** | 类型安全，开发效率高，Prisma 尤其适合 TS 生态。 |
| **部署容器** | **Docker + Docker Compose** | 交付标准镜像，初中期推荐 Compose，后期上 K8s。 |
| **反向代理** | **Nginx** | 高性能静态资源服务、SSL 卸载、负载均衡。 |

---

## 3. 详细实施阶段规划 (Implementation Roadmap)

迁移过程采取 **"绞杀者模式" (Strangler Fig Pattern)**，逐步替换功能，而非一次性重写。

### 第一阶段：基础架构搭建与认证服务 (预计周期：2周)
**目标**：打通前后端连接，实现用户登录与基础数据上云。

*   **P1-1 (环境)**: 初始化 NestJS 项目结构，配置 ESLint/Prettier，搭建 Docker 开发环境 (Postgres + Redis)。
*   **P1-2 (API 设计)**: 定义 Swagger/OpenAPI 规范，确定 Response 标准格式。
*   **P1-3 (认证)**: 实现 JWT 认证机制，包括用户注册、登录、RefreshToken 刷新流。
*   **P1-4 (前端对接)**: 改造前端 `src/store`，将原来的 LocalStorage 适配器替换为 API Client (Axios)。
*   **P1-5 (迁移)**: 开发“数据迁移工具”，允许用户将本地 LocalStorage 数据一键上传至服务器。

### 第二阶段：核心业务迁移 (预计周期：3周)
**目标**：迁移项目管理核心功能（项目、任务、资源）。

*   **P2-1 (模型映射)**: 将前端 `types/index.ts` 映射为 Prisma Schema 数据库模型。
*   **P2-2 (CRUD API)**: 开发项目(Project)、任务(Task)、资源(Resource) 的增删改查接口。
*   **P2-3 (并发控制)**: 实现乐观锁 (Optimistic Locking) 机制，防止多人同时编辑冲突。
*   **P2-4 (前端改造)**: 
    *   重构 `useStore`，拆分为 `useProjectStore`, `useTaskStore` 等原子化 Store。
    *   引入 `React Query` 或 `SWR` 管理服务端状态、缓存和重新验证。

### 第三阶段：PMO 高级特性与计算服务 (预计周期：3周)
**目标**：迁移复杂的计算逻辑至后端，减轻前端负担，提高数据一致性。

*   **P3-1 (计算下沉)**: 将 EVM 计算、关键路径算法、资源冲突检测逻辑从前端迁移至后端 Service。
    *   *优势*：大数据量下前端不卡顿，且可复用于报表导出。
*   **P3-2 (报表服务)**: 后端集成 `Puppeteer` 或 `PDFKit`，提供高性能的 PDF/Excel 导出接口。
*   **P3-3 (实时性)**: 引入 `WebSocket (Socket.io)`，实现任务状态变更的实时推送，屏幕右下角实时通知。

### 第四阶段：AI 模型服务与向量库集成 (预计周期：2周)
**目标**：构建 AI 决策大脑的后端支持。

*   **P4-1 (Python 服务)**: 搭建独立的 Python 微服务 (FastAPI)，专门处理 LLM 调用和复杂数据分析。
*   **P4-2 (向量库)**: 部署 `pgvector` 或 `Milvus`，存储项目文档和历史经验，支持 RAG 检索。
*   **P4-3 (网关集成)**: 在 API Gateway 层聚合 Node.js 业务服务和 Python AI 服务，对外暴露统一接口。

---

## 4. 落地执行详细清单 (Execution Checklist)

### 4.1 数据库设计规范 (Database Schema Plan)
需立即设计的核心表结构：
*   `users`: id, email, password_hash, role, profile_json
*   `projects`: id, name, manager_id, status, baseline_jsonb
*   `tasks`: id, project_id, parent_id, wbs_code, schedule_dates
*   `resources`: id, type, capacity, skill_tags
*   `allocations`: id, resource_id, task_id, date_range, allocation_percent
*   `audit_logs`: id, user_id, action, entity_id, change_diff (审计日志)

### 4.2 接口迁移对照表 (API Migration Map)
前端调用需从同步改为异步：
*   `addProject(p)` -> `POST /api/v1/projects`
*   `updateTask(t)` -> `PATCH /api/v1/tasks/:id`
*   `calculateEVM(p)` -> `GET /api/v1/projects/:id/evm-analysis`

### 4.3 部署基础设施配置 (Infrastructure as Code)
**Docker Compose 示例结构**：
```yaml
version: '3.8'
services:
  app-frontend:
    build: ./frontend
    ports: ["80:80"]
  app-backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://postgres:pass@db:5432/visorq
  db:
    image: postgres:15
    volumes: ["./pgdata:/var/lib/postgresql/data"]
  redis:
    image: redis:alpine
```

---

## 5. 运维与保障 (DevOps & Security)

### 5.1 CI/CD 流水线 (GitHub Actions / GitLab CI)
1.  **代码检查**: Commit 时触发 Lint 和 Type Check。
2.  **单元测试**: 运行 Jest 单元测试。
3.  **构建镜像**:通过 Dockerfile 构建前后端镜像，打上 commit hash 标签。
4.  **自动部署**:
    *   **开发环境 (Dev)**: 自动部署最新代码，供内部联调。
    *   **生产环境 (Prod)**: Tag 触发部署，需人工审批 (Approval Gate)。

### 5.2 安全加固
*   **传输层**: 强制开启 HTTPS，配置 SSL 证书 (Let's Encrypt)。
*   **接口层**: 配置 Rate Limiting (限流) 防止 DDoS；配置 CORS 白名单。
*   **数据层**: 数据库每日定时冷备，上传至 S3/OSS。敏感字段 (密码、密钥) 加密存储。

### 5.3 监控告警
*   **日志**: 此时接入 ELK (Elasticsearch, Logstash, Kibana) 或简单的 Loki+Grafana。
*   **APM**: 使用 SkyWalking 或 Sentry 监控后端性能瓶颈和前端 JS 错误。

---

## 6. 总结

本方案将 Visorq 从一个纯前端工具升级为一个**企业级协作平台**。
*   **短期收益**：数据安全得到保障，支持多端数据同步。
*   **中期收益**：利用后端算力，大幅提升大数据量下的性能和报表生成速度。
*   **长期收益**：打通 AI 服务，沉淀企业项目资产，实现真正的智能化 PMO 管理。

建议立即启动 **第一阶段：基础架构搭建**，优先解决数据云端存储问题。
