# GitHub Search Mirror

一个功能丰富的 GitHub 仓库搜索镜像站，支持智能搜索、AI 摘要、翻译、收藏夹管理和评论系统。

## 功能特性

- **GitHub 仓库搜索** — 支持关键词、语言、星标数等多维度筛选
- **AI 智能摘要** — 基于 README 内容自动生成项目介绍
- **AI 翻译** — 支持项目描述和 README 的多语言翻译
- **收藏夹管理** — 创建个人收藏夹，分类管理感兴趣的仓库
- **搜索历史** — 自动保存搜索记录，快速回溯
- **评论系统** — 对仓库进行评论和讨论
- **用户后台** — 个人设置、收藏夹管理、搜索历史查看
- **管理后台** — 用户管理、评论审核、数据分析
- **Git 镜像加速** — 支持配置 Git 镜像服务加速 clone

## 技术栈

- **框架**: [Next.js](https://nextjs.org) 16 + React 19 + TypeScript
- **样式**: Tailwind CSS 4 + UnoCSS
- **数据库**: PostgreSQL + Drizzle ORM（带内存回退）
- **认证**: NextAuth.js (邮箱密码登录)
- **搜索**: Meilisearch
- **缓存**: Redis + 内存缓存双级缓存
- **AI 服务**: Anthropic Claude / OpenAI / Gemini / DeepSeek / 自定义
- **部署**: Docker + Docker Compose + Traefik

## 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL 16（可选，支持内存数据库回退）
- Redis 7（可选）
- Meilisearch 1.8

### 本地开发

1. **克隆项目**

```bash
git clone <repository-url>
cd github-search-mirror
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

```bash
cp .env.example .env.local
# 编辑 .env.local 填入必要的配置
```

必需的环境变量：

| 变量           | 说明                                                  |
| -------------- | ----------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL 连接字符串（可选，未配置时使用内存数据库） |
| `AUTH_SECRET`  | NextAuth 密钥                                         |
| `ADMIN_EMAILS` | 管理员邮箱列表，多个邮箱用英文逗号分隔                |
| `GITHUB_TOKEN` | 可选的 GitHub API Token，用于提高公共 API 速率限制    |

4. **初始化数据库**

```bash
npm run db:push
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### Docker 部署

1. **配置环境变量**

```bash
cp .env.example .env
# 编辑 .env 填入所有配置
```

**Docker 最小必填 `.env` 模板（与 `.env.example` 一致）：**

```env
POSTGRES_PASSWORD=change_me_postgres_password
AUTH_SECRET=change_me_auth_secret
MEILISEARCH_API_KEY=change_me_meilisearch_master_key
REDIS_PASSWORD=change_me_redis_password
```

**最小必填变量说明：**

| 变量                  | 说明                                                         | 必需 |
| --------------------- | ------------------------------------------------------------ | ---- |
| `POSTGRES_PASSWORD`   | PostgreSQL 数据库密码                                        | 是   |
| `AUTH_SECRET`         | NextAuth 加密密钥                                            | 是   |
| `MEILISEARCH_API_KEY` | Meilisearch 主密钥                                           | 是   |
| `REDIS_PASSWORD`      | Redis 密码（用于 compose 中的 `redis-server --requirepass`） | 是   |

**可选变量（按需追加到 `.env`）：**

| 变量                | 说明                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| `ADMIN_EMAILS`      | 管理员邮箱列表，多个邮箱用英文逗号分隔                                 |
| `NEXTAUTH_URL`      | 用户实际访问的站点地址；本机 Docker 测试默认为 `http://localhost:3000` |
| `GITHUB_TOKEN`      | GitHub API Token，用于提高公共 API 速率限制                            |
| `ANTHROPIC_API_KEY` | Anthropic Claude API 密钥                                              |
| `OPENAI_API_KEY`    | OpenAI API 密钥                                                        |
| `DEEPSEEK_API_KEY`  | DeepSeek API 密钥                                                      |
| `GEMINI_API_KEY`    | Gemini API 密钥                                                        |
| `MIRROR_BASE_URL`   | 可选的 Git 镜像服务基础 URL；未配置时 clone URL 回退到 GitHub          |

**注意：** Docker Compose 会自动构建 `DATABASE_URL` 等连接字符串，无需手动设置。首次创建 PostgreSQL 数据卷时，`scripts/init.sql` 会初始化业务表；已有旧数据卷时请运行 `npm run db:migrate` 同步 schema。

2. **启动所有服务**

```bash
docker-compose up --build -d
```

3. **查看服务状态**

```bash
docker-compose ps
```

4. **查看日志**

```bash
docker-compose logs -f app
```

## 项目结构

```
github-search-mirror/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API 路由
│   │   ├── dashboard/       # 用户后台
│   │   ├── admin/           # 管理后台
│   │   ├── collection/      # 公开收藏夹页面
│   │   ├── repo/            # 仓库详情页
│   │   ├── search/          # 搜索页
│   │   └── trending/        # 趋势页
│   ├── components/          # React 组件
│   │   ├── layout/          # 布局组件
│   │   ├── search/          # 搜索相关
│   │   ├── repo/            # 仓库详情
│   │   └── dashboard/       # 后台组件
│   ├── db/                  # 数据库配置
│   │   ├── schema.ts        # 表结构定义
│   │   └── index.ts         # 数据库连接（支持内存回退）
│   ├── lib/                 # 工具函数
│   │   ├── ai.ts            # AI 服务
│   │   ├── ai-config.ts     # AI 配置管理
│   │   ├── auth.ts          # 认证配置
│   │   ├── cache.ts         # 缓存逻辑（Redis + 内存）
│   │   ├── github.ts        # GitHub API
│   │   ├── mirror.ts        # Git 镜像服务
│   │   ├── search.ts        # 搜索逻辑
│   │   └── utils.ts         # 通用工具函数
│   ├── server/              # Server Actions
│   └── test/                # 测试文件
├── traefik/                 # Traefik 配置
├── scripts/                 # 初始化脚本
├── docker-compose.yml       # Docker 编排
├── Dockerfile               # 应用镜像
└── next.config.ts           # Next.js 配置
```

## 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 代码质量
npm run lint             # ESLint 检查
npm run lint:fix         # 自动修复
npm run format           # Prettier 格式化
npm run typecheck        # TypeScript 类型检查

# 数据库
npm run db:generate      # 生成迁移文件
npm run db:migrate       # 执行迁移
npm run db:push          # 推送 schema 到数据库
npm run db:studio        # 打开 Drizzle Studio

# 测试
npm run test             # 运行所有测试
npm run test:unit        # 单元测试
npm run test:perf        # 性能测试
npm run test:coverage    # 覆盖率报告
```

## AI 功能配置

在后台设置页面配置以下 API Key 以启用 AI 功能：

- **Anthropic Claude** — 摘要和翻译
- **OpenAI** — GPT 系列模型
- **Gemini** — Google Gemini 模型
- **DeepSeek** — 国产大模型
- **自定义** — 支持任何 OpenAI 兼容 API

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)
