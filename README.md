# GitHub Search Mirror

GitHub Search Mirror 是一个面向开源项目检索和沉淀的 GitHub 仓库搜索镜像站。它把 GitHub 仓库搜索、README 阅读、AI 辅助理解、收藏夹、搜索历史、评论讨论、用户后台和管理后台整合到一个 Next.js 应用里，适合搭建团队内部的开源项目发现入口或个人 GitHub 搜索工作台。

## 功能特性

- **仓库搜索**：支持关键词、语言、星标数、fork 数、更新时间、license、topic、user/org 等条件检索 GitHub 仓库。
- **趋势榜单**：按日、周、月查看 GitHub 趋势仓库，支持语言筛选、热度/Stars/最近更新排序，展示排名、趋势分、估算新增星标数和趋势数据。
- **仓库详情**：展示仓库基础信息、README、topics、stars、forks、watchers、最近更新时间和 GitHub 原站链接。
- **仓库健康评分**：详情页侧边栏展示健康评分和风险提示，搜索结果卡片同步显示健康分和首要风险，支持多维度评分（活跃度、社区规模、维护质量、文档完整度、安全合规）。
- **AI 助手**：支持项目摘要、README 翻译、README 问答，并支持 Claude、OpenAI、Gemini、DeepSeek 和自定义 OpenAI 兼容接口。
- **AI 仓库选型建议**：搜索结果页可基于当前搜索结果，由 AI 分析并生成选型建议和关注要点。
- **AI 配置测试**：设置页可直接测试当前 AI Provider/API Key 的连通性，确认配置是否正确。
- **个人收藏夹**：登录后可创建收藏夹，保存和分类管理感兴趣的仓库。
- **搜索历史**：登录用户的搜索记录会自动保存，便于回溯和复用搜索条件。
- **用户设置**：可配置个人 GitHub Token 和 AI Provider/API Key。
- **管理后台**：提供用户管理、搜索/收藏统计分析。
- **Git 镜像加速**：可配置镜像服务，生成 clone/raw 文件代理地址。
- **健康检查**：提供 `/api/health`，用于 Docker、反向代理和监控探活。

## 技术栈

- **框架**：Next.js 16 + React 19 + TypeScript
- **样式**：Tailwind CSS 4 + UnoCSS + shadcn
- **数据库**：PostgreSQL + Drizzle ORM / SQLite + better-sqlite3（通过 `DATABASE_PROVIDER` 环境变量切换）
- **认证**：NextAuth.js Credentials 登录
- **搜索**：Meilisearch，失败时可回退 GitHub API 搜索
- **缓存**：Redis + 内存缓存回退
- **AI**：Anthropic Claude / OpenAI / Gemini / DeepSeek / 自定义 OpenAI 兼容接口
- **部署**：Docker + Docker Compose + Next.js standalone output

## 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL 16+（或用 SQLite 模式：`DATABASE_PROVIDER=sqlite`）
- Meilisearch 1.8+
- Redis 7（可选，未连接时会使用内存缓存）

### 本地开发

```bash
git clone <repository-url>
cd github-search-mirror
npm install
cp .env.example .env.local
```

`.env.example` 主要服务于 Docker 部署。本地开发建议在 `.env.local` 中补齐下面这些变量：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/github_mirror
AUTH_SECRET=change_me_auth_secret
NEXTAUTH_URL=http://localhost:3000

MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=change_me_meilisearch_master_key

# 可选
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
ADMIN_EMAILS=admin@example.com
GITHUB_TOKEN=
MIRROR_BASE_URL=
```

初始化数据库：

```bash
npm run db:push
```

启动开发服务：

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

> 如果只是跑测试或临时体验，可设置 `ALLOW_MEMORY_DB=true` 启用内存数据库回退。生产环境请使用 PostgreSQL。

#### SQLite 模式

如果不想配置 PostgreSQL，可以使用 SQLite 本地数据库：

```env
DATABASE_PROVIDER=sqlite
SQLITE_DATABASE_PATH=./data/github-search-mirror.sqlite
AUTH_SECRET=change_me_auth_secret
NEXTAUTH_URL=http://localhost:3000
```

SQLite 模式下无需 Meilisearch 和 Redis 也可运行，数据库表会在首次启动时自动创建。

## Docker 部署

复制环境变量模板：

```bash
cp .env.example .env
```

Docker 最小必填配置：

```env
POSTGRES_PASSWORD=change_me_postgres_password
AUTH_SECRET=change_me_auth_secret
MEILISEARCH_API_KEY=change_me_meilisearch_master_key
REDIS_PASSWORD=change_me_redis_password
```

常用可选配置：

| 变量                 | 说明                                                 |
| -------------------- | ---------------------------------------------------- |
| `NEXTAUTH_URL`       | 用户实际访问的站点地址，默认 `http://localhost:3000` |
| `ADMIN_EMAILS`       | 管理员邮箱列表，多个邮箱用英文逗号分隔               |
| `GITHUB_TOKEN`       | GitHub API Token，用于提高 API 速率限制              |
| `MIRROR_BASE_URL`    | Git 镜像服务基础 URL，未配置时回退 GitHub 原站       |
| `ANTHROPIC_API_KEY`  | Claude API Key                                       |
| `OPENAI_API_KEY`     | OpenAI API Key                                       |
| `DEEPSEEK_API_KEY`   | DeepSeek API Key                                     |
| `GEMINI_API_KEY`     | Gemini API Key                                       |
| `CUSTOM_AI_BASE_URL` | 自定义 OpenAI 兼容接口地址                           |
| `CUSTOM_AI_API_KEY`  | 自定义 OpenAI 兼容接口 Key                           |

启动服务：

```bash
docker compose up --build -d
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f app
```

Docker Compose 会自动启动 `app`、`postgres`、`meilisearch` 和 `redis`。首次创建 PostgreSQL 数据卷时，`scripts/init.sql` 会初始化业务表；已有旧数据卷时，请按需执行迁移或 `npm run db:push` 同步 schema。

## AI 功能配置

AI 功能可以通过两种方式配置：

1. 在环境变量中配置全局 API Key，例如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`。
2. 登录后进入用户设置页，配置个人 AI Provider、模型、接口地址和 API Key。设置页提供 **测试连接** 按钮，可即时验证 AI 配置是否可用。

支持的 Provider：

- Claude：默认 `claude-sonnet-4-20250514`
- OpenAI：默认 `gpt-4o`
- Gemini：默认 `gemini-1.5-pro`
- DeepSeek：默认 `deepseek-chat`
- Custom：兼容 OpenAI Chat Completions 格式的自定义接口

自定义 AI 接口必须使用 HTTPS，且不能指向 localhost、内网地址或 metadata 地址。

AI 助手的三个功能页签：

- **摘要**：分析 README 生成项目摘要，快速了解项目用途和特点。
- **翻译**：将英文 README 翻译为中文。
- **问答**：基于 README 内容回答用户问题，如安装方法、使用说明等。

## 项目结构

```text
github-search-mirror/
├── src/
│   ├── app/                 # Next.js App Router 页面和 API
│   │   ├── api/             # Route Handlers
│   │   │   ├── ai/          # AI 接口（摘要、翻译、问答、推荐、测试）
│   │   │   └── ...
│   │   ├── admin/           # 管理后台
│   │   ├── dashboard/       # 用户后台
│   │   ├── repo/            # 仓库详情页
│   │   ├── search/          # 搜索页
│   │   └── trending/        # 趋势页
│   ├── components/          # React 组件
│   │   ├── dashboard/       # 用户后台组件
│   │   ├── layout/          # Header / Footer
│   │   ├── repo/            # README、AI、收藏、健康评分组件
│   │   └── search/          # 搜索、筛选、结果卡片、AI 选型组件
│   ├── db/                  # Drizzle schema 和数据库连接（支持 PG / SQLite）
│   ├── lib/                 # GitHub、AI、缓存、认证、搜索、仓库健康度等工具
│   ├── server/              # Server Actions
│   └── test/                # 单元测试和性能测试
├── scripts/                 # 数据库初始化脚本
├── traefik/                 # Traefik 配置
├── docker-compose.yml       # Docker Compose 编排
├── Dockerfile               # 生产镜像构建
└── next.config.ts           # Next.js 配置
```

## 可用脚本

```bash
# 开发和构建
npm run dev
npm run build
npm run start

# 代码质量
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck

# 数据库
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio

# 测试
npm run test
npm run test:unit
npm run test:perf
npm run test:coverage
```

## 主要接口

| 接口                                           | 说明                |
| ---------------------------------------------- | ------------------- |
| `GET /api/health`                              | 服务健康检查        |
| `GET /api/search`                              | 仓库搜索            |
| `GET /api/trending`                            | 趋势仓库            |
| `POST /api/ai/explain`                         | 生成项目摘要        |
| `POST /api/ai/translate`                       | README 翻译         |
| `POST /api/ai/explain-code`                    | 代码解释            |
| `POST /api/ai/readme-qa`                       | README 问答         |
| `POST /api/ai/recommend`                       | AI 仓库选型建议     |
| `POST /api/ai/test`                            | AI 配置连通性测试   |
| `GET/POST /api/collections`                    | 收藏夹              |
| `GET/POST /api/favorites`                      | 收藏仓库            |
| `GET /api/mirror/clone/[owner]/[repo]`         | 生成镜像 clone 地址 |
| `GET /api/mirror/raw/[owner]/[repo]/[...path]` | 代理 raw 文件       |

## 部署提示

- 生产环境务必设置强随机 `AUTH_SECRET`。
- 建议配置 `GITHUB_TOKEN`，否则 GitHub 公共 API 速率限制较低。
- Meilisearch 和 Redis 的密钥不要使用默认示例值。
- 如果通过反向代理访问，请正确设置 `NEXTAUTH_URL`。
- `/api/health?strict=true` 会要求数据库、Redis、Meilisearch 全部可用；默认健康检查只要求必需服务通过。
- 小规模或本地部署可使用 `DATABASE_PROVIDER=sqlite` 替代 PostgreSQL。

## 许可证

[MIT](LICENSE)