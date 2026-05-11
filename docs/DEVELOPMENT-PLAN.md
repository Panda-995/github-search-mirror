# 🔍 GitMirror - 开发计划文档

> 版本: v2.0 | 日期: 2026-05-04 | 基于 [DESIGN-DOCUMENT.md](DESIGN-DOCUMENT.md) 制定

---

## 一、项目概述

GitMirror 是一个 GitHub 搜索镜像站，提供全量镜像 + 国内 CDN 加速、可视化过滤面板、实时趋势榜单、AI 智能增强等核心能力。

### 技术栈

| 层级       | 技术选型                                |
| ---------- | --------------------------------------- |
| 前端框架   | Next.js App Router + React + TypeScript |
| 样式方案   | UnoCSS + shadcn/ui + Framer Motion      |
| 数据库     | PostgreSQL + Drizzle ORM                |
| 搜索引擎   | Meilisearch                             |
| 向量数据库 | Qdrant                                  |
| 缓存       | Redis                                   |
| 认证       | NextAuth.js + 邮箱密码登录              |
| AI         | Claude / OpenAI / DeepSeek (可切换)     |
| 部署       | Docker Compose + Traefik                |

---

## 二、开发阶段总览

| 阶段        | 周期    | 核心目标                            | 优先级 |
| ----------- | ------- | ----------------------------------- | ------ |
| **Phase 0** | W1      | 项目初始化 + 基础架构搭建           | High   |
| **Phase 1** | W2-W3   | 搜索页面 + 过滤器 + 邮箱密码登录    | High   |
| **Phase 2** | W4      | 项目详情页 (README 渲染 + 文件浏览) | High   |
| **Phase 3** | W5      | 趋势榜单 + 镜像直链                 | High   |
| **Phase 4** | W6      | 用户系统 + 收藏 + 历史              | Medium |
| **Phase 5** | W7      | 评论 + 社区发现                     | Medium |
| **Phase 6** | W8-W9   | AI 智能增强 (搜索/翻译/解读/推荐)   | Medium |
| **Phase 7** | W10     | 管理后台 + 监控                     | Medium |
| **Phase 8** | W11-W12 | 测试 + 优化 + 部署                  | High   |

---

## 三、详细任务清单

### Phase 0: 项目初始化 + 基础架构搭建 (W1)

**目标:** 搭建项目骨架，所有基础设施就绪

| 序号 | 任务                                                                | 产出             | 验收标准                    |
| ---- | ------------------------------------------------------------------- | ---------------- | --------------------------- |
| 0.1  | 初始化 Next.js 项目 (App Router + TypeScript)                       | 项目骨架         | `npm run dev` 正常启动      |
| 0.2  | 配置 UnoCSS + shadcn/ui + Framer Motion                             | 样式基础设施     | 基础组件可正常渲染          |
| 0.3  | 配置 Drizzle ORM + PostgreSQL Schema                                | 数据库模型       | `drizzle-kit push` 成功     |
| 0.4  | 配置 Meilisearch 索引                                               | 搜索引擎         | Meilisearch 容器运行正常    |
| 0.5  | 配置 Qdrant 向量数据库                                              | 向量检索基础     | Qdrant 容器运行正常         |
| 0.6  | 配置 Redis 缓存                                                     | 缓存层           | Redis 容器运行正常          |
| 0.7  | 编写 docker-compose.yml                                             | 开发环境一键启动 | `docker compose up -d` 成功 |
| 0.8  | 配置 .env.example + 环境变量管理                                    | 环境配置         | 所有服务配置项完整          |
| 0.9  | 搭建目录结构                                                        | 项目结构         | 符合文档约定                |
| 0.10 | 封装基础 lib (db.ts / github.ts / search.ts / cache.ts / mirror.ts) | 核心库           | 单元测试通过                |
| 0.11 | 配置 ESLint + Prettier + TypeScript 严格模式                        | 代码规范         | `npm run lint` 无错误       |
| 0.12 | 搭建 CI 基础 (lint + typecheck + build)                             | 质量保障         | GitHub Actions 通过         |

**数据模型 (Drizzle Schema):**

- `users` - 用户与认证
- `collections` - 收藏夹
- `favorites` - 收藏的项目
- `search_history` - 搜索历史
- `filter_presets` - 过滤器预设
- `comments` - 评论
- `hot_searches` - 热门搜索词
- `pinned_repos` - 手动置顶项目

**Meilisearch 索引配置:**

- `primaryKey`: `full_name`
- `searchableAttributes`: `name`, `owner`, `description`, `readme`, `topics`
- `filterableAttributes`: `language`, `stars`, `forks`, `license`, `topics`, `created_at`, `pushed_at`
- `sortableAttributes`: `stars`, `forks`, `updated_at`, `created_at`

---

### Phase 1: 搜索页面 + 过滤器 + 邮箱密码登录 (W2-W3)

**目标:** 实现核心搜索体验，用户可以搜索和过滤 GitHub 项目

| 序号 | 任务                         | 产出       | 验收标准                                                   |
| ---- | ---------------------------- | ---------- | ---------------------------------------------------------- |
| 1.1  | SearchBox 组件               | 搜索框     | Debounce 200ms + 搜索建议下拉 + Tab 补全 + 热门词          |
| 1.2  | 搜索语法解析器               | 语法解析器 | 支持 `in:name`, `language:`, `stars:>n`, `pushed:>date` 等 |
| 1.3  | 搜索 API (`GET /api/search`) | 搜索接口   | Meilisearch 查询 + GitHub API fallback + Redis 缓存        |
| 1.4  | FilterPanel 组件             | 过滤面板   | 语言多选 / Stars 范围滑块 / 更新时间 / 许可协议 / 主题标签 |
| 1.5  | 过滤器预设系统               | 预设系统   | 保存/加载/切换预设 + 公开预设 + 导入导出                   |
| 1.6  | RepoCard 组件                | 结果卡片   | 名称/描述/Stars/Forks/语言/Topics/更新时间                 |
| 1.7  | RepoList 组件                | 结果列表   | 搜索结果列表 + 分页 + 排序                                 |
| 1.8  | 搜索结果页 (`/search`)       | 搜索结果页 | SSR 渲染 + URL 参数同步 + 面包屑                           |
| 1.9  | 邮箱密码登录                 | 认证系统   | NextAuth Credentials Provider + JWT Session                |
| 1.10 | 登录/回调页                  | 登录流程   | `/login`, `/api/auth/callback/github`                      |
| 1.11 | 首页 (`/`)                   | 首页       | 搜索框居中 + 热门标签 + 三种趋势卡片入口                   |
| 1.12 | 全局布局组件                 | 布局       | Header + Footer + 主题切换 (亮/暗/跟随系统)                |

**关键 API:**

```
GET /api/search
  q          string    搜索关键词
  language   string[]  语言过滤
  stars_min  number    最小 stars
  stars_max  number    最大 stars
  updated    string    更新时间
  license    string[]  许可协议
  topic      string[]  主题标签
  sort       string    stars/forks/updated
  order      desc/asc  排序方向
  page       number    页码
  per_page   number    每页数量
```

---

### Phase 2: 项目详情页 (W4)

**目标:** 完整的仓库详情展示，支持 README 渲染和文件浏览

| 序号 | 任务                                        | 产出        | 验收标准                                          |
| ---- | ------------------------------------------- | ----------- | ------------------------------------------------- |
| 2.1  | 仓库详情 API (`GET /api/repo/:owner/:repo`) | 详情接口    | GitHub API 聚合 + Redis 缓存                      |
| 2.2  | ReadmeViewer 组件                           | README 渲染 | GFM 渲染 + 代码高亮 + 目录导航 (H1-H3) + 图片代理 |
| 2.3  | FileTree 组件                               | 文件树      | 树形目录 + 展开/折叠 + 文件大小                   |
| 2.4  | CodeViewer 组件                             | 代码查看器  | 代码高亮 + 行号 + 一键复制                        |
| 2.5  | StatsGraph 组件                             | 数据图表    | Stars 增长曲线图                                  |
| 2.6  | 仓库详情页 (`/repo/:owner/:repo`)           | 详情页      | RSC + ISR + 完整信息展示                          |
| 2.7  | 图片预览                                    | 图片查看    | PNG/JPG/GIF/WebP/SVG 在线查看                     |
| 2.8  | 用户主页 (`/user/:username`)                | 用户页      | 用户公开信息 + 公开收藏                           |

---

### Phase 3: 趋势榜单 + 镜像直链 (W5)

**目标:** 趋势发现 + 镜像加速下载

| 序号 | 任务                                  | 产出         | 验收标准                                                                              |
| ---- | ------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| 3.1  | 趋势数据同步脚本 (`sync-trending.ts`) | 数据同步     | GitHub Trending API + 定时任务                                                        |
| 3.2  | 趋势算法                              | 排序算法     | `trend_score = stars_growth*3 + forks_growth*2 + issues*0.5 + contributors*1 / decay` |
| 3.3  | 趋势 API (`GET /api/trending`)        | 趋势接口     | 日/周/月 + 语言过滤                                                                   |
| 3.4  | TrendCard 组件                        | 趋势卡片     | 排名徽章 + Stars 增量 + 迷你趋势图                                                    |
| 3.5  | 趋势页面 (`/trending`)                | 趋势页       | 三种趋势切换 + 语言筛选 + 分页                                                        |
| 3.6  | 镜像直链 API                          | 镜像接口     | Raw 文件 302 跳转 + CDN 加速                                                          |
| 3.7  | Git Clone 加速                        | Clone 加速   | 国内镜像 clone 地址 + 自动选择最优镜像                                                |
| 3.8  | Release 下载加速                      | Release 加速 | CDN 下载 + 断点续传 + 分片下载                                                        |
| 3.9  | 镜像逻辑封装 (`mirror.ts`)            | 镜像核心     | 302 重定向 + 格式转换 + 内容协商                                                      |

---

### Phase 4: 用户系统 + 收藏 + 历史 (W6)

**目标:** 完善用户体系，支持个性化功能

| 序号 | 任务                                | 产出     | 验收标准                                                   |
| ---- | ----------------------------------- | -------- | ---------------------------------------------------------- |
| 4.1  | 用户仪表盘 (`/dashboard`)           | 仪表盘   | 个人首页 + 统计概览                                        |
| 4.2  | 收藏系统                            | 收藏功能 | 创建/删除收藏夹 + 添加/移除项目 + 公开/私有                |
| 4.3  | 收藏 API                            | 收藏接口 | `POST /api/collections`, `POST /api/collections/:id/repos` |
| 4.4  | 收藏夹页面                          | 收藏页   | `/dashboard/collections`, `/collection/:id`                |
| 4.5  | 搜索历史                            | 历史功能 | 自动保存 + 云端同步 + 清除历史                             |
| 4.6  | 搜索历史 API                        | 历史接口 | `GET /api/search/history`                                  |
| 4.7  | 搜索历史页面 (`/dashboard/history`) | 历史页   | 历史记录列表                                               |
| 4.8  | 账号设置 (`/dashboard/settings`)    | 设置页   | 个人信息 + AI 配置 + API Key                               |
| 4.9  | Star 收藏动画                       | 交互增强 | bounce + 星星飞入微交互                                    |

---

### Phase 5: 评论 + 社区发现 (W7)

**目标:** 社区互动功能

| 序号 | 任务           | 产出     | 验收标准                                  |
| ---- | -------------- | -------- | ----------------------------------------- |
| 5.1  | 评论系统       | 评论功能 | 发表评论 + 评分 (1-5星) + 嵌套回复 + 置顶 |
| 5.2  | 评论 API       | 评论接口 | `GET/POST /api/comments/:repo`            |
| 5.3  | 评论区组件     | 评论组件 | 评论列表 + 回复框 + 评分展示              |
| 5.4  | 热门搜索词     | 热搜     | 统计搜索频次 + 展示热门关键词             |
| 5.5  | 公开过滤器预设 | 社区预设 | 社区优质预设分享 (如"AI 必看项目")        |
| 5.6  | 项目收录申请   | 收录功能 | 用户提交收录申请                          |

---

### Phase 6: AI 智能增强 (W8-W9)

**目标:** 将 AI 能力深度融入搜索、翻译、推荐全链路

| 序号 | 任务               | 产出       | 验收标准                                            |
| ---- | ------------------ | ---------- | --------------------------------------------------- |
| 6.1  | AI Provider 抽象层 | AI 基础    | 支持 Claude/OpenAI/DeepSeek/自定义 + 统一接口       |
| 6.2  | AI 配额系统        | 计费系统   | 按用户级别限流 (游客10次/普通100次/管理员无限)      |
| 6.3  | AI 搜索            | AI 搜索    | 自然语言转 GitHub 语法 + 解析结果展示 + 修改条件    |
| 6.4  | 中文跨语言搜索     | 跨语言搜索 | Embedding 向量检索 + Qdrant 语义扩展 + 多路检索融合 |
| 6.5  | AI README 翻译     | AI 翻译    | 一键翻译 + 双语对照 + 术语表 + 缓存                 |
| 6.6  | AI 项目解读        | AI 解读    | 一句话简介 + 技术栈分析 + 上手难度 + 替代方案       |
| 6.7  | AI 智能推荐        | AI 推荐    | 项目 Embedding + 余弦相似度 Top-K + 协同过滤        |
| 6.8  | AI 代码解释        | AI 代码    | 选中代码 + AI 解释 + 行号对应 + 上下文感知          |
| 6.9  | AI 项目对比        | AI 对比    | 多项目横向对比 + 维度评分 + 场景推荐                |
| 6.10 | AI 趋势解读        | AI 趋势    | 趋势项目简评 + 火热原因分析                         |
| 6.11 | AI 问答 (RAG)      | AI 问答    | README + Issues 检索 + 上下文生成回答               |
| 6.12 | AIPanel 组件       | AI 面板    | 侧滑面板 + 流式响应 + 快捷操作                      |

**AI 环境变量:**

```bash
ANTHROPIC_API_KEY="sk-ant-xxxxx"
OPENAI_API_KEY="sk-xxxxx"
DEEPSEEK_API_KEY="sk-xxxxx"
CUSTOM_AI_BASE_URL="https://your-proxy.com/v1"
CUSTOM_AI_API_KEY="sk-xxxxx"
DEFAULT_AI_PROVIDER="claude"
CLAUDE_MODEL="claude-sonnet-4-20250514"
OPENAI_MODEL="gpt-4o"
DEEPSEEK_MODEL="deepseek-chat"
AI_CACHE_TTL=3600
AI_REQUEST_TIMEOUT=30000
AI_MAX_TOKENS=4096
AI_DAILY_QUOTA_FREE=100
AI_DAILY_QUOTA_GUEST=10
```

---

### Phase 7: 管理后台 + 监控 (W10)

**目标:** 管理员可运营和维护站点

| 序号 | 任务                          | 产出     | 验收标准                           |
| ---- | ----------------------------- | -------- | ---------------------------------- |
| 7.1  | 管理后台布局                  | 后台骨架 | 侧边栏导航 + 权限守卫              |
| 7.2  | 用户管理 (`/admin/users`)     | 用户管理 | 用户列表 + 角色切换 + 封禁         |
| 7.3  | 项目收录管理 (`/admin/repos`) | 项目管理 | 收录审核 + 手动添加 + 置顶         |
| 7.4  | 趋势配置 (`/admin/trending`)  | 趋势管理 | 置顶项目 + 趋势算法参数调整        |
| 7.5  | 评论审核 (`/admin/comments`)  | 评论管理 | 评论列表 + 删除/置顶/隐藏          |
| 7.6  | 数据统计 (`/admin/analytics`) | 数据看板 | 搜索量/用户量/热门项目/缓存命中率  |
| 7.7  | AI 用量监控                   | AI 监控  | 每日调用量 + Token 消耗 + 成本统计 |

---

### Phase 8: 测试 + 优化 + 部署 (W11-W12)

**目标:** 生产就绪

| 序号 | 任务            | 产出     | 验收标准                                                |
| ---- | --------------- | -------- | ------------------------------------------------------- |
| 8.1  | 单元测试        | 测试覆盖 | 核心逻辑 (搜索解析/过滤/趋势算法/AI Provider)           |
| 8.2  | 集成测试        | 集成测试 | API 端点 + 数据库 + 搜索引擎                            |
| 8.3  | E2E 测试        | E2E 测试 | 关键用户流程 (搜索/登录/收藏/镜像下载)                  |
| 8.4  | SEO 优化        | SEO      | Sitemap + Robots.txt + Open Graph + JSON-LD + Meta      |
| 8.5  | 性能优化        | 性能达标 | LCP < 1.5s / TTI < 3s / 搜索 < 500ms / 缓存命中率 > 80% |
| 8.6  | 无障碍优化      | A11y     | ARIA 标签 + 键盘导航 + 焦点管理                         |
| 8.7  | Docker 生产配置 | 部署配置 | Dockerfile + Traefik + HTTPS + Watchtower               |
| 8.8  | 数据库备份脚本  | 备份方案 | pg_dump 定时备份                                        |
| 8.9  | 错误监控        | 监控     | 全局错误边界 + 日志收集                                 |
| 8.10 | 上线前检查      | 上线     | 安全审计 + 环境变量 + 域名 + CDN 配置                   |

**性能目标:**

| 指标              | 目标    |
| ----------------- | ------- |
| LCP               | < 1.5s  |
| TTI               | < 3s    |
| 搜索响应 (95分位) | < 500ms |
| 详情页 LCP        | < 2s    |
| 缓存命中率        | > 80%   |

---

## 四、关键依赖关系

```
Phase 0 (基础架构)
  |
  v
Phase 1 (搜索+认证) ← 核心入口，优先级最高
  |
  v
Phase 2 (详情页) ← 搜索结果的落地页
  |
  v
Phase 3 (趋势+镜像) ← 独立功能模块，可并行
  |
  v
Phase 4 (用户系统) ← 依赖 OAuth (Phase 1)
  |
  v
Phase 5 (评论社区) ← 依赖用户系统 (Phase 4)
  |
  v
Phase 6 (AI 增强) ← 依赖搜索+详情页 (Phase 1-2)，可部分并行
  |
  v
Phase 7 (管理后台) ← 依赖所有业务模块
  |
  v
Phase 8 (测试部署) ← 最终阶段
```

---

## 五、风险与应对

| 风险                 | 影响           | 应对策略                                                                     |
| -------------------- | -------------- | ---------------------------------------------------------------------------- |
| GitHub API 限流      | 搜索功能不可用 | Phase 0 尽早实现 Redis 缓存 + Meilisearch 本地索引，减少对 GitHub API 的依赖 |
| AI 成本控制          | 运营亏损       | Phase 6 优先实现缓存层，相同 query 不重复调用 AI；支持用户自带 API Key       |
| Meilisearch 数据同步 | 搜索结果不完整 | Phase 0 先搭好同步脚本框架，Phase 1 再填充真实数据                           |
| 跨语言搜索复杂度     | 开发周期延长   | 先实现基础的中文→英文映射，向量检索作为增强后续迭代                          |
| 镜像加速合规性       | 法律风险       | 302 直链跳转方式合规风险最低，避免直接代理内容                               |
| 数据安全             | 用户数据泄露   | 数据库连接加密、API Key 加密存储、最小权限原则                               |

---

## 六、页面清单

| 页面       | 路由                     | 权限      | 说明               |
| ---------- | ------------------------ | --------- | ------------------ |
| 首页       | `/`                      | 公开      | 搜索框 + 三种趋势  |
| 搜索结果   | `/search`                | 公开      | 搜索结果列表       |
| 仓库详情   | `/repo/:owner/:repo`     | 公开      | README + 文件树    |
| 用户主页   | `/user/:username`        | 公开      | 用户收藏夹         |
| 趋势榜     | `/trending`              | 公开      | 完整趋势榜单       |
| 收藏夹详情 | `/collection/:id`        | 公开/私有 | 收藏项目列表       |
| 登录页     | `/login`                 | 公开      | 邮箱登录           |
| 个人仪表盘 | `/dashboard`             | 登录      | 收藏 + 历史        |
| 收藏管理   | `/dashboard/collections` | 登录      | 增删改收藏夹       |
| 搜索历史   | `/dashboard/history`     | 登录      | 历史记录           |
| 账号设置   | `/dashboard/settings`    | 登录      | 个人信息 + AI 配置 |
| 管理-用户  | `/admin/users`           | 管理员    | 用户管理           |
| 管理-项目  | `/admin/repos`           | 管理员    | 项目收录管理       |
| 管理-趋势  | `/admin/trending`        | 管理员    | 置顶项目配置       |
| 管理-评论  | `/admin/comments`        | 管理员    | 评论审核           |
| 管理-统计  | `/admin/analytics`       | 管理员    | 数据统计           |

---

## 七、缓存策略

| 数据     | 缓存策略                           |
| -------- | ---------------------------------- |
| 搜索结果 | Redis TTL 5min                     |
| 仓库详情 | Redis TTL 30min (热门) / 2h (冷门) |
| README   | Redis TTL 1h                       |
| 趋势数据 | Redis TTL 1h                       |
| 用户数据 | Session Cache                      |
| 静态资源 | CDN 30d                            |

---

## 八、快捷键

| 快捷键          | 功能              | 适用场景   |
| --------------- | ----------------- | ---------- |
| `⌘K` / `Ctrl+K` | 聚焦搜索框        | 全局       |
| `Escape`        | 关闭弹窗/清除搜索 | 全局       |
| `↑↓`            | 浏览搜索建议      | 搜索框     |
| `Enter`         | 确认搜索/跳转     | 搜索建议   |
| `Tab`           | 快速补全推荐词    | 搜索框     |
| `⌘B`            | 切换侧边过滤面板  | 搜索结果页 |
| `⌘/]`           | 收藏当前项目      | 项目详情页 |
| `G then D`      | 前往 Dashboard    | 全局       |
| `G then S`      | 前往搜索          | 全局       |
| `?`             | 显示快捷键列表    | 全局       |
| `/`             | 聚焦搜索框        | 首页       |
| `O`             | 在新标签打开      | 搜索结果   |
| `C`             | 对比选中项目      | 搜索结果   |

---

_文档版本: v2.0 | 最后更新: 2026-05-04_
