# 🔍 GitMirror - GitHub 搜索镜像站 · 项目开发文档

> 版本: v2.0 | 日期: 2026-05-04 | 定位: GitHub 搜索加速 + 镜像加速 + 社区发现 + AI 智能增强
> **重大更新**: 全新技术栈 (Drizzle ORM + UnoCSS + Qdrant + Docker 全栈部署) + 中文跨语言搜索 + 强化 UI/UX 交互

---

## 一、项目概述

### 1.1 核心价值

| 维度 | 现状痛点 | 我们的方案 |
|---|---|---|
| **搜索慢** | GitHub 搜索在国内加载慢、不稳定 | 全量镜像 + 国内 CDN 加速 |
| **过滤难** | GitHub 搜索语法复杂，普通用户难上手 | 可视化过滤面板 + 保存预设 |
| **找资源** | 难以发现优质项目，热度信息不及时 | 实时趋势榜单 + 社区推荐 |
| **访问难** | GitHub 访问时不时抽风 | 302 直链跳转 + 文件镜像下载 |
| **私有化** | 无法保存自己的搜索偏好 | GitHub 登录 + 个人收藏 + 历史 |

### 1.2 目标用户

| 用户群体 | 核心需求 |
|---|---|
| **开发者** | 快速搜索优质开源项目，找轮子，找灵感 |
| **技术学习者** | 发现热门项目，追踪技术趋势 |
| **开源贡献者** | 推广自己的项目，了解竞争对手 |
| **企业用户** | 技术选型调研，竞品分析 |

### 1.3 名词定义

| 术语 | 说明 |
|---|---|
| **镜像站** | 完整克隆 GitHub 数据，支持国内访问 |
| **302 直链** | 通过 302 重定向实现真实资源直链访问 |
| **搜索加速** | 国内自建搜索索引，毫秒级返回结果 |
| **STRM** | Symbolic TRiM，本项目中指文件直链方案 |
| **Trending** | 趋势榜单 (日/周/月热度排行) |
| **过滤器预设** | 用户保存的搜索过滤条件组合 |

---

## 二、核心功能模块

### 2.1 首页搜索 (Search Hub) — ⭐核心

#### 2.1.1 搜索框设计

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              🔍  搜索 GitHub 项目...                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🔎 Search repositories...                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  热门:  vue   react   python   docker   ai   typescript  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 🌟 日趋势 │  │ 📈 周趋势 │  │ 🗓️ 月趋势 │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 2.1.2 搜索能力

| 能力 | 说明 |
|---|---|
| **实时搜索** | 输入即搜 (Debounce 200ms)，无需回车 |
| **中文语义搜索** | 用中文搜索，自动匹配所有语言的相关项目 |
| **模糊匹配** | 支持项目名/描述/作者名的模糊匹配 |
| **搜索建议** | 实时下拉联想词提示，支持 Tab 快捷补全 |
| **历史记录** | 搜索历史自动保存 (登录后同步云端) |
| **拼音搜索** | 支持拼音首字母和全拼搜索中文相关项目 |

#### 2.1.3 搜索语法兼容

| 语法 | 示例 | 说明 |
|---|---|---|
| `in:name` | `vue in:name` | 仅匹配项目名 |
| `in:description` | `cli in:description` | 仅匹配描述 |
| `in:readme` | `algorithm in:readme` | 仅匹配 README |
| `language:` | `language:typescript` | 编程语言 |
| `stars:>n` | `stars:>1000` | 最小 stars 数 |
| `forks:>n` | `forks:>100` | 最小 forks 数 |
| `pushed:>date` | `pushed:>2026-01-01` | 最近更新 |
| `created:>date` | `created:>2025-01-01` | 创建时间范围 |
| `license:` | `license:MIT` | 开源协议 |
| `topic:` | `topic:machine-learning` | 主题标签 |
| `user:` | `user:facebook` | 特定作者 |
| `org:` | `org:vercel` | 特定组织 |

#### 2.1.4 中文跨语言搜索 — ⭐核心差异化能力

> 用户用中文搜索，系统自动找到英文、日文、中文等所有语言的相关项目

```
用户输入: "好看的后台管理模板"
         ↓
┌──────────────────────────────────────────────┐
│        AI 跨语言语义映射引擎                    │
│  中文词 → 英文词 → 项目名/描述/Topics 匹配     │
│                                              │
│  "后台管理模板"                               │
│    → admin template                          │
│    → dashboard template                      │
│    → admin panel                            │
│    → 后台管理                                │
│    → 管理后台                                │
│                                              │
│  "好看的" → beautiful / nice / pretty / modern │
│  "前端" → frontend / front-end / UI          │
└──────────────────────────────────────────────┘
         ↓
跨语言检索: [中文词 + 英文词 + 日文词] 组合查询
         ↓
返回: vue-admin-template (描述: Beautiful admin...)
      react-dashboard (描述: Elegant dashboard...)
      element-admin (描述: 后台管理系统...)
      angular-admin (描述: 管理后台模板...)
```

**技术实现方案:**

| 层级 | 技术 | 说明 |
|---|---|---|
| **语义映射** | Embedding 向量检索 | 中文 query → 多语言 query 扩展 |
| **双语索引** | Meilisearch + Qdrant | 同步存储中英文描述 |
| **翻译增强** | Claude API | 批量翻译项目名/描述/Topics |
| **模糊匹配** | 同音字/形近字 | 拼音纠错、简繁体转换 |
| **热门对齐** | 趋势词表 | 常见中文词 → 英文对应词缓存 |

**跨语言搜索流程:**

```typescript
// 1. 中文 query 输入
const query = "好看的后台管理模板"

// 2. 本地预处理
const sanitized = pinyin.normalize(query) // 拼音纠错

// 3. 向量扩展 (Qdrant)
// 用中文 Embedding 模型编码 query
const queryEmbedding = await embed(sanitized)

// 4. 语义扩展 (Claude)
const expanded = await claude.expandQuery(sanitized)
// 返回: {
//   zh: ["后台管理模板", "管理后台"],
//   en: ["admin template", "dashboard panel", "control panel"],
//   ja: ["管理テンプレート", "ダッシュボード"]
// }

// 5. 多路检索
const results = await Promise.all([
  meilisearch.search(expanded.en.join(" OR ")),
  qdrant.search(queryEmbedding, { limit: 20 }),
  github.search(expanded.en.join(" ")),
])

// 6. 结果融合 + 去重 + 排序
const fused = fuseAndDedup(results)
```

### 2.2 可视化过滤器 (Filter Panel)

#### 2.2.1 过滤器分类

| 过滤器 | 类型 | 说明 |
|---|---|---|
| **编程语言** | 多选 | Vue/React/Python/Go/Java/... (支持"全选/取消") |
| **Stars 数量** | 范围滑块 | 0~∞，支持预设快捷区间 (100+, 500+, 1000+) |
| **Forks 数量** | 范围滑块 | 0~∞ |
| **更新时间** | 日期选择 | 最近活跃时间过滤 |
| **创建时间** | 日期范围 | 创建时间过滤 |
| **开源协议** | 多选 | MIT/GPL/Apache/BSD/... |
| **主题标签** | 多选+搜索 | topic 标签过滤 |
| **仓库大小** | 范围选择 | KB/MB 为单位 |
| **仓库可见性** | 单选 | 全部 / 公开 / 仅私有 (需登录) |
| **代码行数** | 范围 | 过滤代码规模 |

#### 2.2.2 过滤器预设

| 功能 | 说明 |
|---|---|
| **保存预设** | 将当前过滤条件保存为命名预设 |
| **快速切换** | 顶部快捷切换已保存预设 |
| **公开预设** | 社区公开的优质预设 (如"AI 必看项目") |
| **默认预设** | 可设置一个默认预设，每次打开自动应用 |
| **导入/导出** | JSON 格式导入导出预设 |

#### 2.2.3 过滤 UI

```
┌────────────────────────────────────────────────────────────┐
│  筛选条件                                                     │
│                                                             │
│  语言                                                         │
│  ┌─────────────────────────────────────────┐               │
│  │ [×] 全选  [×] TypeScript  [×] Python     │               │
│  │ [×] Go         [×] Vue      [ ] React   │               │
│  │ [ ] Java       [ ] Rust    [ ] C++      │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Stars                                                       │
│  □─────────────────────────────────────────●  min ── max   │
│  0                              100k+                       │
│  快捷: [100+] [500+] [1k+] [5k+] [10k+] [不限]             │
│                                                             │
│  更新时间                                                     │
│  ○ 全部  ○ 今天  ○ 本周  ○ 本月  ● 3个月内  ○ 自定义 [📅]  │
│                                                             │
│  许可协议                                                     │
│  ┌─────────────────────────────────────────┐               │
│  │ [×] MIT  [×] Apache-2.0  [ ] GPL-3.0    │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  标签                                                         │
│  ┌────────────────────┐ ┌────────────────────────────────┐ │
│  │ 🔍 搜索标签...     │ │ 推荐: ai  machine-learning vue │ │
│  └────────────────────┘ └────────────────────────────────┘ │
│                                                             │
│  ┌────────────────┐  ┌─────────────────────────────────┐    │
│  │ 💾 保存当前筛选 │  │ 🔄 重置  │  ✅ 应用 (显示 328 个) │    │
│  └────────────────┘  └─────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### 2.3 趋势榜单 (Trending) — ⭐核心

#### 2.3.1 三种趋势

| 榜单 | 刷新频率 | 数据维度 | 展示内容 |
|---|---|---|---|
| **日趋势** | 每小时更新 | 当日新增 Stars + 当日 PR + Issues | 今日黑马 |
| **周趋势** | 每6小时更新 | 7天累计 Stars + forks + issues | 本周热门 |
| **月趋势** | 每日更新 | 30天累计 Stars + 贡献者 | 本月必看 |

#### 2.3.2 趋势榜单卡片

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  🌟 日趋势                          [查看更多 →]  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🔥 01  starship/starship                     │ │
│  │     🚀 The cross-shell prompt for any shell  │ │
│  │     ⭐ 32.8k  🍴 2.1k  📝 更新于 3小时前     │ │
│  │     💬 238  [typescript] [cli] [prompt]     │ │
│  ├──────────────────────────────────────────────┤ │
│  │ 🔥 02  ogklaus/preact                       │ │
│  │     ⚡ Fast 3kB alternative to React with    │ │
│  │     ⭐ 15.2k  🍴 1.1k  📝 更新于 8小时前     │ │
│  │     [preact] [javascript] [frontend]        │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### 2.3.3 趋势算法

```python
# 趋势分数 = w1*stars增长 + w2*forks增长 + w3*issues增长 + w4*contributors增长
# 参数可调 (管理员后台配置)
trend_score = (
    stars_growth * 3.0 +
    forks_growth * 2.0 +
    issues_closed * 0.5 +
    contributors_new * 1.0
) / days_decay
```

### 2.4 项目详情页 (Repo Page) — ⭐核心

#### 2.4.1 页面结构

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ogklaus/preact  ⭐ 15.2k 🍴 1.1k 📝 1.2k  👀 2.1k    │
│                                                         │
│  ⚡ Fast 3kB alternative to React with the same API    │
│                                                         │
│  📅 创建于 2015-08-20  │  🕐 最后更新 2026-05-01       │
│  📍 MIT License  │  🏷️ preact, javascript, frontend   │
│  👤 @ogklaus     │  📂 Python / TypeScript / Go        │
│                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────┐  │
│  │ ⭐ Star 收藏    │ │ 🔀 Fork 复制    │ │ 📥 下载 │  │
│  └─────────────────┘ └─────────────────┘ └─────────┘  │
│                                                         │
│  ┌─────┬──────┬────────┬──────────┬──────────┐        │
│  │ 代码 │ README│ Issues│ Pulls    │ Actions  │        │
│  └─────┴──────┴────────┴──────────┴──────────┘        │
│                                                         │
│  📊 Stars 趋势                                           │
│  ┌─────────────────────────────────────────┐          │
│  │     📈                                        │    │
│  │   📈 📈                                      │    │
│  │ 📈 📈 📈 📈                                  │    │
│  │ 0  3k  6k  9k  12k  15k                     │    │
│  └─────────────────────────────────────────┘          │
│                                                         │
│  📄 README 预览 (渲染 Markdown)                         │
│  (完整渲染，支持代码高亮、目录导航)                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 2.4.2 README 渲染

| 能力 | 说明 |
|---|---|
| **完整渲染** | 支持 GFM (表格/代码块/任务列表/脚注) |
| **代码高亮** | 支持所有主流语言代码高亮 |
| **目录导航** | 自动提取 H1-H3 生成侧边目录 |
| **图片代理** | GitHub 图片自动替换为国内 CDN 链接 |
| **视频播放** | 支持 HTML5 视频直接播放 |
| **链接处理** | 外链自动添加 `target="_blank"` |
| **TOC 锚点** | 目录可点击跳转 |

#### 2.4.3 文件浏览

| 能力 | 说明 |
|---|---|
| **目录树** | 树形结构展示，支持展开/折叠 |
| **文件预览** | 代码文件在线预览 (高亮+行号) |
| **图片预览** | 在线查看 PNG/JPG/GIF/WebP/SVG |
| **大小显示** | 显示文件大小和行数 |
| **复制代码** | 一键复制文件内容 |
| **下载文件** | 单文件直链下载 |

### 2.5 镜像加速 (Mirror Acceleration) — ⭐核心

#### 2.5.1 文件直链 (STRM 方案)

| 功能 | 说明 |
|---|---|
| **Raw 文件直链** | `https://mirror.xxx/r/{owner}/{repo}/raw/{branch}/path/to/file` |
| **CDN 加速** | 文件走国内 CDN，秒开不卡顿 |
| **302 跳转** | 直链到真实源站 (GitHub/Gitee/Mirror) |
| **格式转换** | 自动转换换行符 (LF/CRLF) |
| **内容协商** | 支持 `?raw=1` 参数强制原始内容 |

#### 2.5.2 Git Clone 加速

| 功能 | 说明 |
|---|---|
| **镜像克隆** | 提供国内镜像 clone 地址 |
| **协议支持** | HTTPS / HTTP / Git Protocol |
| **自动选择** | 根据用户网络自动选择最优镜像 |
| **断点续传** | 支持大仓库断点续传 |
| **子模块** | 自动处理 Git Submodules |

#### 2.5.3 Release 下载加速

| 功能 | 说明 |
|---|---|
| **CDN 下载** | Releases 走国内 CDN 加速下载 |
| **多格式** | 自动补充 .sig / .sha256 文件 |
| **分片下载** | 支持大文件断点续传 |
| **直链下载** | `https://mirror.xxx/r/{owner}/{repo}/releases/download/{tag}/{file}` |

### 2.6 用户系统 (Auth & Profile)

#### 2.6.1 GitHub OAuth 登录

| 步骤 | 说明 |
|---|---|
| 1. 点击"GitHub 登录" | 跳转 GitHub OAuth 授权页 |
| 2. 授权确认 | 用户确认授权范围 |
| 3. 返回 Token | GitHub OAuth Token 存储 |
| 4. 获取用户信息 | 同步 GitHub 头像和昵称 |
| 5. 创建本地账户 | 关联 GitHub ID + 本地用户 |
| 6. 登录完成 | JWT Session + Cookie |

#### 2.6.2 GitHub Token 权限说明

| Scope | 用途 | 必要性 |
|---|---|---|
| `read:user` | 读取用户公开信息 | 必须 |
| `public_repo` | 访问用户公开仓库 | 可选 |
| `repo` | 访问用户私有仓库 | 可选 (需付费账户) |
| `read:org` | 读取组织信息 | 可选 |
| `gist` | 访问 Gist | 可选 |

#### 2.6.3 登录后功能

| 功能 | 条件 | 说明 |
|---|---|---|
| 收藏项目 | 登录 | Star 自己的收藏列表 |
| 关注用户 | 登录 | 关注 GitHub 用户 |
| 保存预设 | 登录 | 云端保存搜索预设 |
| 搜索历史 | 登录 | 云端同步搜索历史 |
| 查看私有仓库 | 登录+token | 需授权 `repo` scope |
| 发布项目 | 登录 | 提交收录申请 |
| 评论评分 | 登录 | 项目评论区打分 |

### 2.7 收藏与历史 (Collections)

#### 2.7.1 收藏列表

| 功能 | 说明 |
|---|---|
| **收藏项目** | 一键收藏，当前页面即可操作 |
| **收藏夹** | 可创建多个收藏夹 (如"AI 项目"、"工具库") |
| **分组管理** | 收藏夹增删改 + 项目拖拽分组 |
| **公开/私密** | 收藏夹可设为公开，供社区浏览 |
| **分享** | 一键生成分享链接 |
| **批量导出** | JSON/Markdown 格式导出 |

#### 2.7.2 搜索历史

| 功能 | 说明 |
|---|---|
| **云端同步** | 登录后搜索历史同步云端 |
| **时间轴展示** | 按日/周分组展示历史记录 |
| **快速重搜** | 一键用历史条件重新搜索 |
| **搜索发现** | 基于历史记录推荐相似项目 |
| **清理历史** | 批量删除 / 全部清理 |

### 2.8 社区与发现 (Community)

#### 2.8.1 项目评分与评论

| 功能 | 说明 |
|---|---|
| **评分** | 1-5 星评分系统 |
| **评论** | 支持 Markdown 富文本评论 |
| **回复** | 评论支持嵌套回复 |
| **精华评论** | 管理员/高质量评论置顶 |
| **评论举报** | 举报不当内容 |

#### 2.8.2 公开收藏夹推荐

| 功能 | 说明 |
|---|---|
| **社区收藏** | 优质公开收藏夹推荐 |
| **分类浏览** | 按类别浏览 (AI/Web/Desktop/...) |
| **编辑推荐** | 管理员推荐优质收藏 |
| **作者页** | 展示用户公开收藏夹 |

#### 2.8.3 项目提交

| 功能 | 说明 |
|---|---|
| **提交收录** | 用户提交 GitHub 项目申请收录 |
| **认领项目** | 项目Owner认领自己的项目 |
| **更新信息** | 认领后可更新项目描述、标签 |
| **置顶项目** | 管理员可置顶优质项目 |

### 2.9 个人仪表盘 (Dashboard)

#### 2.9.1 用户首页

| 模块 | 内容 |
|---|---|
| **收藏概览** | 收藏数量 + 本周新增 |
| **搜索统计** | 搜索次数 + 高频搜索词 |
| **浏览历史** | 最近浏览的项目 |
| **关注动态** | 关注用户的最新动态 |
| **趋势推荐** | 基于兴趣的个性化推荐 |

#### 2.9.2 数据可视化

| 图表 | 说明 |
|---|---|
| **Stars 趋势图** | 收藏项目的 Stars 变化曲线 |
| **搜索热词图** | 个人搜索高频词词云 |
| **收藏语言分布** | 饼图展示收藏项目语言占比 |
| **活跃时间图** | 柱状图展示使用时间段 |

### 2.10 高级搜索 (Advanced Search)

#### 2.10.1 代码搜索

| 功能 | 说明 |
|---|---|
| **全文检索** | 在仓库代码中搜索关键词 |
| **文件路径** | 在特定路径下搜索 |
| **语言过滤** | 指定代码语言 |
| **分支过滤** | 在特定分支搜索 |
| **行号定位** | 直接定位到匹配行 |

#### 2.10.2 搜索模板

| 模板 | 说明 |
|---|---|
| **新手项目** | Stars 高 + Issues 少 + 文档全 |
| **活跃项目** | 最近更新 + 高 PR 合并率 |
| **小型项目** | 代码量少 (<10k 行) |
| **零依赖项目** | package.json 依赖少 |
| **中文项目** | README 含中文 |
| **学习项目** | 教程完备 + 例子多 |

### 2.11 管理后台 (Admin Dashboard)

#### 2.11.1 功能模块

| 模块 | 功能 |
|---|---|
| **用户管理** | 用户列表 / 禁用 / 角色管理 |
| **项目收录** | 审核提交 / 置顶管理 / 推荐管理 |
| **搜索管理** | 热门搜索词 / 搜索屏蔽词 |
| **趋势管理** | 趋势算法调参 / 手动置顶 |
| **评论管理** | 评论审核 / 举报处理 / 精华管理 |
| **系统监控** | 搜索 QPS / 缓存命中率 / API 调用量 |
| **配置管理** | SEO 配置 / 邮件配置 / CDN 配置 |

#### 2.11.2 数据统计

| 指标 | 说明 |
|---|---|
| **DAU/MAU** | 日活/月活用户数 |
| **搜索量** | 每日/每周/每月搜索次数 |
| **收藏量** | 收藏数/收藏转化率 |
| **访问量** | PV/UV/跳出率 |
| **API 调用** | GitHub API 配额使用情况 |

---

### 2.12 AI 智能增强 (AI Intelligence) — ⭐新增

> 本章节为 v1.2 新增 — 将 AI 能力深度融入搜索、翻译、推荐全链路

#### 2.12.1 AI 功能总览

| 功能模块 | AI 能力 | 用户价值 |
|---|---|---|
| **AI 搜索** | 自然语言转 GitHub 语法 | 说话就能搜，无需记忆搜索语法 |
| **README 翻译** | 中英双语翻译 | 一键翻译，跨境项目无障碍阅读 |
| **项目解读** | 自动生成项目摘要 | 3 秒读懂一个项目 |
| **智能推荐** | Embedding 向量相似度推荐 | 发现更多相关项目 |
| **代码解释** | 选中代码 AI 解释 | 不懂某段代码？AI 帮你看 |
| **项目对比** | 多项目横向 AI 对比 | 对比 Stars、架构、依赖、优缺点 |
| **趋势解读** | 趋势项目 AI 简评 | 为什么这个项目今天火了？ |
| **AI 问答** | RAG 项目文档问答 | 问任何关于项目的问题 |

#### 2.12.2 AI 搜索示例

```
用户输入: "找一个适合做后台管理的 Vue3 框架，要免费开源，更新频繁"
         ↓
AI 解析: language:Vue stars:>500 pushed:>2025-01-01 in:description:admin,dashboard,template
         ↓
展示搜索结果 + AI 解释文案:
"✨ AI 已将您的描述转换为: 语言=Vue, Stars>500, 最近3个月更新活跃,
  README 或描述中包含 admin/dashboard 等关键词"
```

#### 2.12.3 AI 翻译双语对照

```
┌──────────────────────────────────────────────────────────────┐
│  📄 README.md    [EN] [中英对照 ▼] [中]                      │
│                                                              │
│  English          │  中文                                    │
│  ─────────────────┼───────────────────────────────────────   │
│  # Vue Admin Pro  │  # Vue Admin Pro                         │
│                  │                                          │
│  A beautiful...   │  一个美观的后台管理模板，基于 Vue3...    │
│                  │                                          │
│  ## Install      │  ## 安装                                  │
│  ```bash         │  ```bash                                  │
│  npm install     │  npm install                               │
│  ```             │  ```                                      │
└──────────────────────────────────────────────────────────────┘
```

#### 2.12.4 AI 问答入口

```
项目详情页底部:
┌────────────────────────────────────────────────────────────┐
│  💬 问关于这个项目的问题                                   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 这个项目支持 SSR 吗？需要 Node 多少版本？           │   │
│  └────────────────────────────────────────────────────┘   │
│  [💬 提问]  [查看所有问答 (12)]                             │
│                                                            │
│  💬 AI 回答:                                               │
│  "是的，支持 SSR。需要在 Node 16 以上版本运行..."         │
└────────────────────────────────────────────────────────────┘
```

---

## 三、技术架构

### 3.1 技术栈

| 层级 | 技术 | 版本 | 说明 |
|---|---|---|---|
| **前端框架** | Next.js 15 | 15.x (App Router) | SSR + RSC + Turbopack |
| **语言** | TypeScript | 5.x | 类型安全 + 严格模式 |
| **样式** | UnoCSS | 0.60+ | 原子化 CSS，更快更轻量 |
| **UI 组件** | shadcn/ui + Radix UI | latest | 无头组件，高度可定制 |
| **动画** | Motion (Framer Motion) | 12.x | 交互动画标杆 |
| **图标** | Lucide React | latest | 一致性图标库 |
| **搜索索引** | Meilisearch | 1.x | 毫秒级全文搜索 |
| **向量检索** | Qdrant | 1.x | 向量相似度搜索 (AI 推荐) |
| **数据库** | PostgreSQL | 16.x | 主存储 |
| **ORM** | Drizzle ORM | 0.30+ | 类型安全 ORM，比 Prisma 更快 |
| **缓存** | Redis / Upstash | 7.x | 搜索结果缓存 + 会话 |
| **对象存储** | Cloudflare R2 / S3 | — | 文件/CDN 存储 |
| **认证** | Auth.js v5 | 5.x | GitHub OAuth + JWT |
| **容器化** | Docker + Docker Compose | 24.x | 一键部署 (必须) |
| **反向代理** | Traefik / Caddy | 3.x / 2.x | 自动 HTTPS + 负载均衡 |
| **监控** | Sentry + Grafana | — | 错误追踪 + 性能监控 |
| **CI/CD** | GitHub Actions | — | 自动构建 + 部署 |

> **关于 Drizzle ORM vs Prisma**: 本项目推荐 **Drizzle ORM** — 类型安全、性能更好、迁移透明、无 vendor lock-in，维护性更强。

### 3.2 Docker 部署方案 — ⭐必须

#### 3.2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                Docker Compose 全栈部署                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Traefik (反向代理)                    │  │
│  │            自动 HTTPS + 域名路由 + 负载均衡            │  │
│  └─────────────────────────┬───────────────────────────────┘  │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐              │
│         ↓                 ↓                 ↓               │
│  ┌──────────┐     ┌──────────┐     ┌────────────┐        │
│  │ Next.js  │     │ Meilisearch│   │ PostgreSQL │        │
│  │ App      │     │ 搜索服务  │     │ 数据库     │        │
│  │ (Node 22)│     │ (1.x)    │     │ (16.x)     │        │
│  └──────────┘     └──────────┘     └─────┬──────┘        │
│         │                                   │              │
│  ┌──────┴───────┐                   ┌──────┴──────┐      │
│  │  Redis       │                   │  Qdrant      │      │
│  │ (7.x)        │                   │  向量数据库  │      │
│  └──────────────┘                   └─────────────┘      │
│                                                             │
│  可选:                                                       │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │  Watchtower   │  │  Grafana   │  │  MinIO (S3兼容) │  │
│  │  自动更新容器 │  │  监控面板  │  │  对象存储替代    │  │
│  └──────────────┘  └────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 docker-compose.yml 核心配置

```yaml
# docker-compose.yml
version: '3.9'

services:
  # ── 前端 + API ──────────────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://gitmirror:changeme@db:5432/gitmirror
      - REDIS_URL=redis://cache:6379
      - MEILISEARCH_HOST=http://search:7700
      - QDRANT_HOST=http://vector:6333
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - AUTH_SECRET=${AUTH_SECRET}
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
      search:
        condition: service_started
    networks:
      - gitmirror

  # ── 搜索索引 ──────────────────────────────────────────────
  search:
    image: getmeili/meilisearch:latest
    restart: unless-stopped
    environment:
      - MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
      - MEILI_ENV=production
      - MEILI_DB_PATH=/meili_data
    volumes:
      - meili_data:/meili_data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - gitmirror

  # ── 向量数据库 (AI 推荐) ─────────────────────────────────
  vector:
    image: qdrant/qdrant:latest
    restart: unless-stopped
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/readyz"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - gitmirror

  # ── 数据库 ──────────────────────────────────────────────
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: gitmirror
      POSTGRES_USER: gitmirror
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gitmirror"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - gitmirror

  # ── Redis ──────────────────────────────────────────────
  cache:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb
    volumes:
      - redis_data:/data
    networks:
      - gitmirror

  # ── 反向代理 + HTTPS ──────────────────────────────────
  proxy:
    image: traefik:v3.0
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - TRAEFIK_CERTIFICATESRESOLVERS=letsencrypt
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik/dynamic.yml:/etc/traefik/dynamic.yml:ro
      - traefik_acme:/acme
    networks:
      - gitmirror

  # ── 可选: 自动更新 ──────────────────────────────────
  watchtower:
    image: containrrr/watchtower:latest
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: --interval 3600 app search db cache proxy
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_STOPPED=false
    networks:
      - gitmirror

networks:
  gitmirror:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  meili_data:
  qdrant_data:
  traefik_acme:
```

#### 3.2.3 部署命令

```bash
# 1. 一键启动所有服务 (生产环境)
docker compose -f docker-compose.yml up -d

# 2. 查看服务状态
docker compose ps

# 3. 查看日志
docker compose logs -f app

# 4. 数据库迁移
docker compose exec app npx drizzle-kit migrate

# 5. 初始化搜索索引
docker compose exec app npm run search:sync

# 6. 更新服务 (Watchtower 自动更新，或手动)
docker compose pull && docker compose up -d

# 7. 备份数据库
docker compose exec db pg_dump -U gitmirror gitmirror > backup_$(date +%Y%m%d).sql

# 8. 停止服务
docker compose down
```

#### 3.2.4 Traefik 配置 (自动 HTTPS)

```yaml
# traefik/traefik.yml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@gitmirror.com
      storage: /acme/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    directory: /etc/traefik/dynamic.yml
    watch: true
```

### 3.3 数据架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户请求                                 │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js SSR / RSC                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  搜索页面     │  │  详情页      │  │  管理后台        │    │
│  │  (SSR)       │  │  (RSC+ISR)   │  │  (CSR)          │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                       数据层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐│
│  │ Meilisearch│ │ PostgreSQL│  │   Redis   │  │   Qdrant     ││
│  │  (搜索索引) │ │ (Drizzle) │  │  (缓存)   │  │  (向量)      ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘│
│         ↑               ↑                                    │
│         │               │                                    │
│  ┌──────┴───────────────┴──────────────────────────────┐    │
│  │           GitHub API (官方 GraphQL/REST)             │    │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────────────┐    │    │
│  │  │ 搜索 API   │ │  Repo API  │ │  Trending 数据  │    │    │
│  │  └────────────┘ └────────────┘ └─────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 搜索数据流

```
用户输入 "vue admin template"
         ↓
    Debounce 300ms
         ↓
    解析搜索语法 (in:name, language: 等)
         ↓
    ┌─────────────────┐
    │  查询 Meilisearch │ ← 本地搜索索引 (毫秒级)
    └────────┬─────────┘
             ↓ 有缓存?
          是 → 直接返回 (命中 Redis)
             ↓ 无
    ┌─────────────────────────┐
    │ 查询 GitHub Search API │ (限流保护)
    └────────┬────────────────┘
             ↓
    写入 Meilisearch 索引 (异步)
             ↓
    写入 Redis 缓存 (TTL 5分钟)
             ↓
         返回结果
```

### 3.4 目录结构

```
github-search-mirror/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # 公开页面
│   │   │   ├── page.tsx          # 首页搜索
│   │   │   ├── search/page.tsx   # 搜索结果页
│   │   │   ├── repo/[owner]/[repo]/page.tsx  # 仓库详情
│   │   │   ├── user/[username]/page.tsx      # 用户主页
│   │   │   ├── trending/page.tsx # 趋势榜
│   │   │   └── collection/[id]/page.tsx      # 收藏夹
│   │   ├── (auth)/               # 认证页面
│   │   │   ├── login/page.tsx
│   │   │   └── callback/page.tsx
│   │   ├── dashboard/            # 用户仪表盘 (需登录)
│   │   │   ├── page.tsx          # 个人首页
│   │   │   ├── collections/      # 收藏夹管理
│   │   │   ├── history/          # 搜索历史
│   │   │   └── settings/        # 账号设置
│   │   ├── admin/               # 管理后台 (需管理员)
│   │   │   ├── users/
│   │   │   ├── repos/
│   │   │   ├── trending/
│   │   │   ├── comments/
│   │   │   └── analytics/
│   │   ├── api/                 # API Routes
│   │   │   ├── search/          # 搜索 API
│   │   │   ├── repo/            # 仓库数据 API
│   │   │   ├── trending/        # 趋势 API
│   │   │   ├── auth/             # 认证 API
│   │   │   ├── mirror/          # 镜像直链 API
│   │   │   └── webhook/         # GitHub Webhook
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 基础组件
│   │   ├── search/              # 搜索相关组件
│   │   │   ├── SearchBox.tsx     # 搜索框
│   │   │   ├── FilterPanel.tsx   # 过滤器面板
│   │   │   ├── RepoCard.tsx      # 结果卡片
│   │   │   ├── RepoList.tsx      # 结果列表
│   │   │   └── TrendingCard.tsx  # 趋势卡片
│   │   ├── repo/                # 仓库详情组件
│   │   │   ├── ReadmeViewer.tsx  # README 渲染
│   │   │   ├── FileTree.tsx      # 文件树
│   │   │   ├── CodeViewer.tsx    # 代码查看器
│   │   │   └── StatsGraph.tsx    # 数据图表
│   │   ├── auth/                # 认证组件
│   │   ├── dashboard/           # 仪表盘组件
│   │   └── layout/              # 布局组件
│   ├── lib/
│   │   ├── db.ts                # Drizzle ORM 客户端
│   │   ├── auth.ts              # Auth.js 配置
│   │   ├── github.ts            # GitHub API 封装
│   │   ├── search.ts            # 搜索索引封装
│   │   ├── mirror.ts            # 镜像直链逻辑
│   │   └── cache.ts             # Redis 缓存封装
│   ├── server/
│   │   ├── search.actions.ts   # 搜索 Server Actions
│   │   ├── repo.actions.ts     # 仓库 Server Actions
│   │   ├── collection.actions.ts # 收藏 Server Actions
│   │   └── trending.actions.ts # 趋势 Server Actions
│   ├── hooks/                   # 自定义 Hooks
│   ├── stores/                 # Zustand Stores
│   └── types/                  # TypeScript 类型
├── drizzle/
│   └── schema.ts              # Drizzle ORM 数据模型
├── scripts/
│   ├── sync-trending.ts        # 趋势数据同步脚本
│   ├── sync-repos.ts          # 仓库数据同步脚本
│   └── seed.ts                # 种子数据
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── .env.example
├── docker-compose.yml          # 开发环境
├── Dockerfile
└── package.json
```

---

## 四、数据模型 (Drizzle ORM Schema 概要)

```prisma
// 用户与认证
model User {
  id            String   @id @default(uuid())
  githubId      String?  @unique        // GitHub OAuth ID
  githubToken  String?                // GitHub OAuth Token (加密存储)
  email        String?  @unique
  name         String?
  avatar       String?
  role         UserRole @default(USER)
  createdAt    DateTime @default(now())

  collections  Collection[]
  favorites    Favorite[]
  comments     Comment[]
  searchHistory SearchHistory[]
  filterPresets FilterPreset[]
}

// 收藏夹
model Collection {
  id        String   @id @default(uuid())
  name      String
  isPublic  Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  repos     Favorite[]
  createdAt DateTime @default(now())
}

// 收藏的项目
model Favorite {
  id          String    @id @default(uuid())
  repoFullName String              // "owner/repo"
  repoMeta    Json?                  // 缓存的仓库元数据
  collectionId String
  collection  Collection @relation(fields: [collectionId], references: [id])
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  note       String?               // 个人备注
  createdAt  DateTime @default(now())

  @@unique([userId, repoFullName])
}

// 搜索历史
model SearchHistory {
  id        String   @id @default(uuid())
  query     String
  filters   Json?                 // 保存的过滤条件
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}

// 过滤器预设
model FilterPreset {
  id          String   @id @default(uuid())
  name        String
  filters     Json                    // 过滤条件 JSON
  isPublic    Boolean  @default(false)
  usageCount  Int      @default(0)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())

  @@index([userId])
}

// 评论
model Comment {
  id        String   @id @default(uuid())
  repoFullName String
  content   String
  rating    Int?                    // 1-5 星
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  parentId  String?
  parent    Comment? @relation("CommentReplies")
  replies   Comment[] @relation("CommentReplies")
  isPinned  Boolean @default(false)
  isDeleted Boolean @default(false)
  createdAt DateTime @default(now())

  @@index([repoFullName, createdAt])
}

// 热门搜索词
model HotSearch {
  id        String   @id @default(uuid())
  keyword   String   @unique
  count     Int      @default(1)
  updatedAt DateTime @updatedAt
}

// 手动置顶的项目
model PinnedRepo {
  id          String   @id @default(uuid())
  repoFullName String @unique
  reason     String?               // 置顶原因
  position   Int      @default(0)  // 排序位置
  type       String   @default("trending") // trending / featured / ...
  expiresAt  DateTime?             // 过期时间
  createdAt  DateTime @default(now())
}
```

---

## 五、AI 智能增强 (AI Intelligence)

> 新增章节 — 将 AI 能力深度融入搜索、翻译、推荐全链路

### 5.1 AI 功能全景

| 功能模块 | AI 能力 | 技术方案 | 用户价值 |
|---|---|---|---|
| **AI 搜索** | 自然语言转 GitHub 语法 | Claude / GPT-4 | "找一个好看的 Vue 后台模板" → 自动解析 |
| **README 翻译** | 中英互译 | Claude / GPT-4 | 一键翻译 README 为中文 |
| **项目解读** | 项目摘要 + 技术分析 | Claude | 3 秒读懂一个项目 |
| **智能推荐** | 相似项目推荐 | Embedding + 向量检索 | 发现更多相关项目 |
| **代码解释** | 代码片段注释生成 | Claude | 不懂某段代码？AI 帮你看 |
| **项目对比** | 多项目横向对比 | Claude | 对比 Stars、架构、依赖、优缺点 |
| **趋势解读** | 趋势项目简评 | Claude | 这个项目为什么今天火了？ |
| **过滤建议** | 智能过滤推荐 | Claude | 根据你的兴趣推荐过滤条件 |
| **AI 问答** | 项目相关问题解答 | RAG + Claude | 问任何关于项目的问题 |

### 5.2 AI 搜索 (AI Search)

#### 5.2.1 核心流程

```
用户输入: "找一个适合做后台管理的 Vue3 框架，要免费开源，更新频繁"
         ↓
┌────────────────────────────────────┐
│    AI 自然语言解析引擎              │
│  ┌────────────────────────────────┐ │
│  │ 1. 意图识别: 项目搜索           │ │
│  │ 2. 实体提取:                   │ │
│  │    - 语言: Vue / Vue3          │ │
│  │    - 类型: 后台管理框架        │ │
│  │    - 需求: 免费 / 开源          │ │
│  │    - 偏好: 更新频繁            │ │
│  │ 3. GitHub 语法转换:            │ │
│  │    language:Vue stars:>500     │ │
│  │    pushed:>2025-01-01          │ │
│  │ 4. 返回搜索结果 + 解释文案      │ │
│  └────────────────────────────────┘ │
└────────────────────────────────────┘
         ↓
    展示搜索结果 + "AI 已将您的描述转换为以下搜索条件"
```

#### 5.2.2 解析示例

| 用户自然语言 | AI 解析后的 GitHub 语法 |
|---|---|
| "好看的 React 后台模板" | `language:React stars:>500 pushed:>2025-01-01 in:description,readme:admin,dashboard,template` |
| "适合入门的机器学习项目" | `topic:machine-learning stars:>100 stars:<500 language:Python` |
| "最近火的 AI 项目" | `pushed:>2026-04-01 topic:artificial-intelligence OR topic:llm` |
| "Stars 最多的 JS 工具库" | `language:JavaScript stars:>5000 sort:stars` |
| "可以写在简历里的项目" | `language:Python OR JavaScript stars:>1000 in:readme:impressive,demo` |
| "小程序开发框架" | `in:name,description:miniprogram OR weapp OR 小程序` |

#### 5.2.3 Prompt 设计

```typescript
// AI 搜索解析 Prompt
const SEARCH_PARSE_PROMPT = `
你是一个 GitHub 搜索助手。用户输入了一段自然语言描述，请将其转换为 GitHub 搜索语法。

## 输出格式 (JSON):
{
  "query": "转换后的搜索关键词",
  "filters": {
    "language": ["JavaScript"],         // 编程语言
    "stars_min": 500,                  // 最小 Stars
    "stars_max": null,                 // 最大 Stars
    "topics": ["vue"],                 // GitHub Topics
    "license": "MIT",                 // 许可证
    "pushed_after": "2025-01-01",      // 最近更新时间
    "created_after": null,             // 创建时间
    "in": ["name", "description"]      // 搜索位置
  },
  "reasoning": "解析推理过程",          // 解释为什么这样转换
  "alternatives": ["备选搜索词1", "备选搜索词2"] // 备选方案
}

## 用户输入:
{user_input}

## 注意事项:
- Stars 数低于 100 的项目通常不适合推荐，跳过
- "最近" 定义为最近 3 个月内更新的项目
- "免费开源" 自动添加 license 字段 (MIT/Apache/GPL/BSD)
- 如果描述模糊，自动补充合理的 Stars 下限 (如 500+)
- 返回完整 JSON，不要有额外的注释文字
`
```

#### 5.2.4 AI 搜索 UI

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 🔍  找一个适合做后台管理的 Vue3 框架...             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 AI 解析结果:                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  🔧 language: Vue + JavaScript                     │   │
│  │  ⭐ stars > 500                                    │   │
│  │  📅 最近 3 个月有更新                               │   │
│  │  📝 描述或 README 中包含 admin/dashboard           │   │
│  │  📄 许可协议: MIT/Apache/GPL                       │   │
│  │                                                      │   │
│  │  [🔄 修改搜索条件]  [✨ AI 搜索]  [直接搜索 →]      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ⭐ 找到 328 个项目    [🌟 日趋势] [📈 周趋势] [🗓️ 月趋势] │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 5.3 AI README 翻译 (AI Translation)

#### 5.3.1 功能设计

| 能力 | 说明 |
|---|---|
| **一键翻译** | 按钮点击，全文翻译为中文 |
| **双语对照** | 左英右中对照视图，方便对照阅读 |
| **选择翻译** | 选中部分段落单独翻译 |
| **保留格式** | 表格/代码块/MD 格式完整保留 |
| **术语表** | 专有名词使用标准中文译名 (如 Vue→Vue.js) |
| **缓存翻译** | 已翻译内容缓存，避免重复付费 |

#### 5.3.2 翻译 Prompt

```typescript
const TRANSLATION_PROMPT = `
你是一个专业的开源项目文档翻译专家。请将以下 README 翻译成中文。

## 翻译要求:
1. 保持 Markdown 格式完全不变 (表格/代码块/标题/链接等)
2. 专有名词使用约定俗成的中文译名:
   - Vue → Vue.js
   - React → React
   - Node.js → Node.js
   - JavaScript → JavaScript
   - repository → 仓库
   - stars → Star (保留英文)
   - issues → Issue (保留英文)
3. 代码块内容不翻译，只翻译注释和说明文字
4. README 中的 README.md 等自引用不翻译
5. 语气自然，像中国人写的技术博客，避免翻译腔
6. 如果是中文 README，则翻译成英文 (双向)

## 项目信息:
- 项目名: {repo_name}
- 描述: {repo_description}
- 主要语言: {primary_language}

## 原文:
{readme_content}

## 输出:
直接输出翻译后的 Markdown，不要有额外的解释文字。
`

// 术语表 (部分)
const TERM_GLOSSARY = {
  'README': 'README',
  'MIT License': 'MIT 开源协议',
  'Apache License': 'Apache 开源协议',
  'installation': '安装',
  'configuration': '配置',
  'contributing': '贡献代码',
  'getting started': '快速开始',
  'dependencies': '依赖项',
  'framework': '框架',
  'library': '库',
  'plugin': '插件',
  'middleware': '中间件',
  'API': 'API',
  'CLI': '命令行工具',
  'documentation': '文档',
}
```

#### 5.3.3 翻译 UI

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  📄 README.md                          [🌐 中文] [🌐 English] │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  English                              |  中文         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  # Vue Admin Pro                     |  # Vue Admin  │  │
│  │                                      |  Pro          │  │
│  │  A beautiful admin template         |  一个美观的    │  │
│  │  built with Vue3...                 |  后台管理模板  │  │
│  │                                      |  基于 Vue3... │  │
│  │  ## Installation                    |  ## 安装      │  │
│  │  ```bash                           |  ```bash      │  │
│  │  npm install                       |  npm install  │  │
│  │  ```                               |  ```          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [📋 复制翻译结果]  [📥 导出 Markdown]  [🔄 重新翻译]      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.4 AI 项目解读 (AI Project Summary)

#### 5.4.1 解读内容

| 信息 | AI 生成内容 |
|---|---|
| **一句话简介** | 用一句话描述项目是做什么的 |
| **适合人群** | 初学者 / 进阶开发者 / 团队使用 |
| **核心特点** | 3-5 个亮点，用 emoji 列表 |
| **技术栈分析** | 前端/后端/数据库/部署方式的完整分析 |
| **代码质量评估** | 代码规范性、注释覆盖率、测试覆盖 |
| **依赖安全** | 是否有过期依赖/已知漏洞 |
| **适合做哪些项目** | 哪些类型的项目适合基于此项目开发 |
| **上手难度** | 1-5 星评分 + 原因说明 |
| **替代方案** | 3 个同类竞品对比 |

#### 5.4.2 项目解读 Prompt

```typescript
const PROJECT_SUMMARY_PROMPT = `
你是一个资深开源项目分析师。请分析以下 GitHub 仓库，给出完整的项目评估报告。

## 项目信息:
- 仓库: {owner}/{repo}
- 描述: {description}
- 主要语言: {language}
- Stars: {stars}
- Forks: {forks}
- 最新更新: {pushed_at}
- 开源协议: {license}
- Topics: {topics}
- README 内容: {readme_content}

## 输出格式 (JSON):
{
  "one_liner": "一句话描述项目 (不超过30字)",
  "target_audience": "适合人群描述",
  "highlights": [
    { "emoji": "⚡", "text": "亮点1" },
    { "emoji": "🎨", "text": "亮点2" }
  ],
  "tech_stack": {
    "frontend": "前端技术",
    "backend": "后端技术",
    "database": "数据库",
    "deployment": "部署方式"
  },
  "code_quality": {
    "rating": 4,           // 1-5
    "has_tests": true,
    "has_docs": true,
    "has_ci": true,
    "comments": "简短评价"
  },
  "security": {
    "status": "safe",      // safe / warning / danger
    "issues": ["问题描述"],
    "recommendations": ["建议"]
  },
  "use_cases": ["适用场景1", "适用场景2"],
  "difficulty": {
    "rating": 3,           // 1-5 (5=最难)
    "reason": "上手难度原因"
  },
  "alternatives": [
    { "name": "项目名", "stars": "Stars", "diff": "主要区别" }
  ],
  "recommendation": "最终推荐理由"
}
`
```

### 5.5 AI 智能推荐 (AI Recommendation)

#### 5.5.1 推荐策略

| 推荐类型 | 数据来源 | 算法 |
|---|---|---|
| **相似项目** | 项目 Embedding 向量 | 余弦相似度 Top-K |
| **隐式偏好** | 收藏 + 浏览 + 搜索历史 | 协同过滤 |
| **趋势关联** | 当前趋势项目 | 图关联分析 |
| **冷启动** | 新用户热门收藏 | Popular-based |
| **上下文** | 当前浏览项目 | 上下文相关 |

#### 5.5.2 Embedding 生成

```typescript
// 项目 Embedding 生成
const EMBEDDING_PROMPT = `
你是一个项目分类专家。请为以下 GitHub 项目生成一段 512 维的语义描述向量。

项目信息:
- 名称: {name}
- 描述: {description}
- README: {readme_summary}
- 语言: {language}
- Topics: {topics}

请用一段 200 字左右的文字描述这个项目的核心特征、适用场景、技术特点和使用人群。这段文字将用于后续的语义相似度计算。

输出: 直接输出描述文字，不要有任何前缀。
`

// 向量存储方案
// 1. 本地: Qdrant / Milvus 向量数据库
// 2. 轻量: PostgreSQL + pgvector
// 3. 云端: Pinecone / Supabase Vector
```

#### 5.5.3 推荐展示 UI

```
┌────────────────────────────────────────────────────────────┐
│  ✨ 你可能也会喜欢                                         │
│                                                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ ogklaus │ │ ogklaus │ │ ogklaus │ │ ogklaus │        │
│  │ /vue3-  │ │ /admin- │ │ /react- │ │ /next-  │        │
│  │ admin   │ │ pro     │ │ admin   │ │ admin   │        │
│  │ ⭐ 8.2k │ │ ⭐ 5.1k │ │ ⭐ 3.8k │ │ ⭐ 2.4k │        │
│  │ 相似度  │ │ 相似度  │ │ 相似度  │ │ 相似度  │        │
│  │  98%    │ │  95%    │ │  91%    │  87%    │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                            │
│  💬 "基于您收藏的 vue3-admin 项目推荐"                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.6 AI 代码解释 (AI Code Explain)

#### 5.6.1 功能设计

| 功能 | 说明 |
|---|---|
| **选中解释** | 在代码查看器中选中代码，一键 AI 解释 |
| **行号高亮** | 解释结果与代码行号对应 |
| **多语言支持** | 支持解释任意编程语言的代码 |
| **上下文感知** | 自动读取文件的 import 和依赖理解上下文 |

#### 5.6.2 代码解释 Prompt

```typescript
const CODE_EXPLAIN_PROMPT = `
你是一个资深的 {language} 开发专家。请解释以下代码片段。

## 上下文信息:
- 文件路径: {file_path}
- 项目名: {repo_name}
- 主要语言: {primary_language}

## 代码片段:
\`\`\`{language}
{selected_code}
\`\`\`

## 解释要求:
1. 用简洁易懂的中文解释这段代码做了什么 (不超过 100 字)
2. 解释关键变量和函数的作用
3. 如有复杂逻辑，简要说明算法思路
4. 如果有潜在问题 (Bug / 性能 / 安全)，指出并给出建议

## 输出格式:
解释: [核心功能解释]
关键点:
- [关键点1]
- [关键点2]
建议: [如果有的话]
`

// 代码查看器中的 AI 解释 UI
/*
┌────────────────────────────────────────────────────────────┐
│  📄 src/utils/auth.ts                       [📋 复制] [💬 AI]│
│                                                            │
│   1  │ import { User, auth } from '@/lib/auth'             │
│   2  │ import { db } from '@/lib/db'                       │
│   3  │                                                     │
│   4  │ export async function getSession() { ─────┐        │
│   5  │   const token = await auth()                  │ AI │
│   6  │   if (!token) return null                    │ →  │
│   7  │   return db.user.findUnique({                │    │
│   8  │     where: { githubId: token.sub } ─────────┘    │
│   9  │   })                                           │
│  10  │ }                                              │
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 💬 AI 解释:                                          │   │
│  │                                                      │   │
│  │ 解释: 获取当前用户登录态的异步函数。                  │   │
│  │                                                      │   │
│  │ 关键点:                                             │   │
│  │  • Line 4: 定义 getSession 异步函数                  │   │
│  │  • Line 5: 调用 auth() 获取 GitHub OAuth Token       │   │
│  │  • Line 6-8: Token 不存在返回 null，否则查数据库     │   │
│  │                                                      │   │
│  │ 建议: 可以加缓存避免频繁查库 ~                      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│  [🔄 重新解释]  [📋 复制解释]                               │
└────────────────────────────────────────────────────────────┘
*/
```

### 5.7 AI 项目对比 (AI Comparison)

```typescript
const COMPARISON_PROMPT = `
你是一个开源项目对比分析专家。请对比以下 {count} 个项目，给出详细的横向对比报告。

## 项目列表:
{projects.map((p, i) => `${i+1}. ${p.full_name} (⭐ ${p.stars}, ${p.language}, ${p.description})`).join('\n')}

## 输出格式 (JSON):
{
  "summary": "一句话总结这 {count} 个项目的整体特点",
  "comparison_table": {
    "维度": ["对比维度名称"],
    "{project1}": ["项目1在这个维度的表现"],
    "{project2}": ["项目2在这个维度的表现"],
    ...
  },
  "dimensions": [
    {
      "name": "Stars 数量",
      "winner": "stars 最多的项目名",
      "detail": "具体数据对比"
    },
    {
      "name": "活跃度",
      "winner": "项目名",
      "detail": "最近更新/PR 合并率对比"
    },
    {
      "name": "上手难度",
      "winner": "项目名",
      "detail": "文档完备度、学习曲线对比"
    },
    {
      "name": "代码质量",
      "winner": "项目名",
      "detail": "测试覆盖率、CI 配置对比"
    },
    {
      "name": "社区生态",
      "winner": "项目名",
      "detail": "贡献者数量、Issue 响应速度"
    }
  ],
  "scenarios": [
    {
      "scenario": "如果你是初学者",
      "recommendation": "推荐哪个项目，原因"
    },
    {
      "scenario": "如果要快速上线",
      "recommendation": "推荐哪个项目，原因"
    },
    {
      "scenario": "如果要做二次开发",
      "recommendation": "推荐哪个项目，原因"
    }
  ],
  "final_recommendation": "综合推荐及理由"
}
```

### 5.8 AI 趋势解读 (AI Trend Commentary)

```typescript
const TREND_COMMENTARY_PROMPT = `
你是一个技术趋势分析师。请分析今天 GitHub 趋势榜单，给出简短的热门原因解读。

## 趋势项目:
- 项目名: {repo_name}
- Stars: {stars}
- 今日新增 Stars: {today_stars}
- 描述: {description}
- 最近提交: {last_commit}
- PR 合并率: {pr_merge_rate}

## 输出格式:
### 📈 {repo_name} 为什么今天这么火？

[3-5 句话的简短解读，内容包括:]
- 今天大火的核心原因 (社区热点/版本发布/大V推荐等)
- 这个项目的核心亮点
- 适合哪些人关注

[100 字以内，简洁有力]
`
```

### 5.9 AI 问答 (AI Q&A / RAG)

#### 5.9.1 架构设计

```
用户问题: "这个项目支持 SSR 吗？需要 Node 多少版本？"
         ↓
┌────────────────────────────────────────────────────┐
│            RAG 检索增强生成                        │
│  1. 检索: 从 README + Issues + Discussions        │
│  2. 上下文: 找到最相关的段落                       │
│  3. 生成: Claude 结合上下文回答                   │
└────────────────────────────────────────────────────┘
         ↓
     💬 "是的，该项目支持 SSR..."
```

#### 5.9.2 RAG 检索 Prompt

```typescript
const QA_PROMPT = `
你是一个开源项目问答助手。请基于以下项目文档回答用户问题。

## 项目信息:
- 仓库: {owner}/{repo}
- 技术栈: {language}
- 文档来源: {source}

## 相关文档片段:
{retrieved_contexts}

## 用户问题:
{user_question}

## 回答要求:
1. 直接回答问题，不要重复"根据文档"之类的话
2. 如文档中有明确答案，引用具体内容
3. 如文档中没有明确答案，诚实说明"文档中未提及"
4. 如需要额外信息，给出查看建议

## 回答:
`
```

### 5.10 AI 服务配置

#### 5.10.1 AI Provider 配置

```typescript
// 支持的 AI Provider
type AIProvider = 'claude' | 'openai' | 'deepseek' | 'custom'

interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string        // 自定义 API 地址 (如兼容 OpenAI 格式的代理)
  model: string           // 模型名称
  temperature: number     // 温度参数 (0-1)
  maxTokens: number        // 最大 Token 数
  cacheTTL: number        // 缓存时间 (秒)
  quotaPerDay: number      // 每日调用配额
}

// 用户级别配置
interface AIUserConfig {
  enable: boolean         // 是否开启 AI 功能
  provider: AIProvider    // 使用的 AI 服务商
  apiKey?: string         // 用户自己的 API Key (可选)
  features: {
    search: boolean       // AI 搜索
    translation: boolean  // AI 翻译
    summary: boolean      // AI 项目解读
    recommendation: boolean // AI 推荐
    codeExplain: boolean  // AI 代码解释
  }
  dailyQuota: number      // 每日免费配额
}
```

#### 5.10.2 AI 计费策略

| 用户级别 | 每日配额 | 超额处理 |
|---|---|---|
| **未登录** | 10 次/天 | 提示登录 |
| **普通用户** | 100 次/天 | 使用自己的 API Key 或购买积分 |
| **付费用户** | 1000 次/天 | 折扣价购买积分 |
| **管理员** | 无限制 | 免费 |

#### 5.10.3 环境变量配置

```bash
# AI 服务配置
# 支持 Claude / OpenAI Compatible API

# Claude API (Anthropic)
ANTHROPIC_API_KEY="sk-ant-xxxxx"

# OpenAI API
OPENAI_API_KEY="sk-xxxxx"

# DeepSeek API (性价比高，推荐)
DEEPSEEK_API_KEY="sk-xxxxx"

# 自定义兼容 API (如 VLLM / LocalAI)
CUSTOM_AI_BASE_URL="https://your-proxy.com/v1"
CUSTOM_AI_API_KEY="sk-xxxxx"

# AI 默认 Provider
DEFAULT_AI_PROVIDER="claude"   # claude | openai | deepseek | custom

# AI 模型配置
CLAUDE_MODEL="claude-sonnet-4-20250514"
OPENAI_MODEL="gpt-4o"
DEEPSEEK_MODEL="deepseek-chat"

# AI 请求配置
AI_CACHE_TTL=3600              # 缓存 1 小时
AI_REQUEST_TIMEOUT=30000        # 超时 30 秒
AI_MAX_TOKENS=4096             # 最大输出 4096 Token

# AI 计费配置
AI_DAILY_QUOTA_FREE=100        # 普通用户每日配额
AI_DAILY_QUOTA_GUEST=10        # 游客每日配额
```

### 5.11 AI 功能用户体验设计

#### 5.11.1 AI 开关 (用户可控)

```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ AI 功能设置                                            │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 🌐 AI 翻译                                            │   │
│  │    [━━━━━━━━━━●━━━━━]  已开启                        │   │
│  │    默认语言: [中文 ▼]                                 │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 🔍 AI 搜索                                            │   │
│  │    [━━━━━━━━━━●━━━━━]  已开启                        │   │
│  │    显示解析结果: [● 是  ○ 否]                         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 💬 AI 问答                                            │   │
│  │    [━━━━━━━━━━●━━━━━]  已开启                        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 💡 AI 服务商                                          │   │
│  │                                                       │   │
│  │  ○ Anthropic Claude (推荐)                            │   │
│  │  ○ OpenAI GPT-4                                      │   │
│  │  ○ DeepSeek (性价比高)                               │   │
│  │  ● 使用我自己的 API Key                               │   │
│  │    ┌────────────────────────────────────────────┐   │   │
│  │    │ sk-ant-xxxxx...                           │   │   │
│  │    └────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  📊 今日剩余次数: 87 / 100                           │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

#### 5.11.2 AI 计费页面

| 功能 | 免费次数 | 付费定价 | 说明 |
|---|---|---|---|
| AI 搜索 | 20次/天 | 1元/100次 | 按次计费 |
| README 翻译 | 10次/天 | 1元/50次 | 按翻译页计费 |
| AI 项目解读 | 5次/天 | 2元/10次 | 按项目计费 |
| AI 代码解释 | 30次/天 | 0.5元/100次 | 按解释次数计费 |
| AI 问答 | 20次/天 | 1元/100次 | 按问答次数计费 |
| AI 项目对比 | 3次/天 | 5元/20次 | 按对比组计费 |

---

## 五、API 设计

### 5.1 搜索 API

```
GET /api/search
Query:
  q          string    搜索关键词
  language   string[]  语言过滤 (可多个)
  stars_min  number    最小 stars
  stars_max  number    最大 stars
  updated    string    更新时间 (2026-05-01)
  license    string[]  许可协议
  topic      string[]  主题标签
  sort       string    stars/forks/updated (默认 stars)
  order      desc/asc  排序方向
  page       number    页码 (默认 1)
  per_page   number    每页数量 (默认 20)

Response:
{
  total: number,
  page: number,
  per_page: number,
  results: RepoItem[],
  facets: {
    language: { name: string, count: number }[],
    license: { name: string, count: number }[],
    topic: { name: string, count: number }[]
  }
}
```

### 5.2 趋势 API

```
GET /api/trending
Query:
  range   daily | weekly | monthly  (默认 daily)
  lang    string  语言过滤 (可选)
  page    number
  per_page number

Response:
{
  repos: TrendingRepo[],
  updated_at: string,
  next_update: string
}
```

### 5.3 仓库详情 API

```
GET /api/repo/:owner/:repo
Response:
{
  full_name: string,
  description: string,
  stars: number,
  forks: number,
  open_issues: number,
  watchers: number,
  language: string,
  topics: string[],
  license: { name: string },
  created_at: string,
  pushed_at: string,
  homepage: string,
  readme: string,          // 渲染后的 HTML
  file_tree: FileNode[],
  languages: { [lang: string]: number }
}
```

### 5.4 镜像直链 API

```
GET /api/mirror/raw/:owner/:repo/*filepath
Response: 302 Redirect to CDN URL

GET /api/mirror/clone/:owner/:repo
Response: { clone_url: string } // 国内镜像 clone 地址

GET /api/mirror/download/:owner/:repo/:tag/:filename
Response: 302 Redirect to CDN download URL
```

### 5.5 用户 API

```
GET /api/user/me
POST /api/collections
POST /api/collections/:id/repos
GET /api/search/history
POST /api/search/filters/preset
GET /api/comments/:repo
POST /api/comments/:repo
```

---

## 六、搜索索引设计 (Meilisearch)

### 6.1 索引配置

```json
{
  "index": "repos",
  "primaryKey": "full_name",
  "searchableAttributes": [
    "name",
    "owner",
    "description",
    "readme",
    "topics"
  ],
  "filterableAttributes": [
    "language",
    "stars",
    "forks",
    "license",
    "topics",
    "created_at",
    "pushed_at"
  ],
  "sortableAttributes": [
    "stars",
    "forks",
    "updated_at",
    "created_at"
  ],
  "rankingRules": [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness"
  ]
}
```

### 6.2 同步策略

| 数据源 | 同步方式 | 频率 |
|---|---|---|
| GitHub Trending | 直连 GitHub API | 每小时 |
| 热门项目 | 后台任务 + 增量更新 | 每日 |
| 全量索引 | 手动触发 + 定时全量 | 按需 |
| 用户收藏 | 实时写入 | 即时 |

---

## 七、GitHub OAuth 配置

### 7.1 GitHub App 注册

```
1. 访问 https://github.com/settings/applications/new
2. 填写以下信息:
   - Application name: GitMirror
   - Homepage URL: https://mirror.xxx
   - Authorization callback URL: https://mirror.xxx/api/auth/callback/github
3. 获取 Client ID 和 Client Secret
4. 填入 .env.local:
   AUTH_GITHUB_ID=your_client_id
   AUTH_GITHUB_SECRET=your_client_secret
```

### 7.2 Token 权限说明

```typescript
// NextAuth GitHub Provider 配置
{
  clientId: process.env.AUTH_GITHUB_ID,
  clientSecret: process.env.AUTH_GITHUB_SECRET,
  authorization: {
    params: {
      scope: [
        'read:user',        // 读取用户信息
        'public_repo',     // 访问公开仓库 (可选)
        'read:org',         // 读取组织信息 (可选)
      ].join(' ')
    }
  }
}
```

---

## 八、SEO 与性能

### 8.1 SEO 配置

| 项目 | 配置 |
|---|---|
| **Sitemap** | 动态生成 `/sitemap.xml`，包含所有收录项目页 |
| **Robots.txt** | 允许爬虫访问公开页面，屏蔽后台 |
| **Open Graph** | 每个页面设置 og:title, og:description, og:image |
| **结构化数据** | JSON-LD Schema (Article, BreadcrumbList) |
| **Meta Tags** | 每个页面独立 title + description |
| **Canonical URL** | 防止重复内容 SEO 分散 |

### 8.2 性能指标

| 指标 | 目标 |
|---|---|
| **LCP** | < 1.5s |
| **TTI** | < 3s |
| **搜索响应** | < 500ms (95分位) |
| **详情页 LCP** | < 2s |
| **缓存命中率** | > 80% |

### 8.3 缓存策略

| 数据 | 缓存策略 |
|---|---|
| 搜索结果 | Redis TTL 5min |
| 仓库详情 | Redis TTL 30min (热门) / 2h (冷门) |
| README | Redis TTL 1h |
| 趋势数据 | Redis TTL 1h |
| 用户数据 | Session Cache |
| 静态资源 | CDN 30d |

---

## 九、开发阶段规划

| 阶段 | 周期 | 里程碑 |
|---|---|---|
| **Phase 0** | W1 | 项目初始化 + 搜索基础架构 |
| **Phase 1** | W2-W3 | 搜索页面 + 过滤器 + GitHub OAuth |
| **Phase 2** | W4 | 项目详情页 (README 渲染 + 文件浏览) |
| **Phase 3** | W5 | 趋势榜单 + 镜像直链 |
| **Phase 4** | W6 | 用户系统 + 收藏 + 历史 |
| **Phase 5** | W7 | 评论 + 社区发现 |
| **Phase 6** | W8 | 管理后台 + 监控 |
| **Phase 7** | W9-W10 | 测试 + 优化 + 部署 |

---

## 十、其他功能建议 (我帮你想的增强点)

### 10.1 智能推荐
基于收藏记录和搜索历史，自动推荐相似项目。可以打标签做聚类，用协同过滤做推荐。

### 10.2 代码片段预览
搜索结果直接展示代码片段，不需要点进去就能看到核心代码逻辑。

### 10.3 Stars 历史图
每个项目详情页展示 Stars 增长曲线图，判断项目是上升期还是夕阳项目。

### 10.4 中文翻译
README 自动翻译按钮，点击将英文 README 翻译成中文，方便阅读。

### 10.5 依赖分析
分析项目的 package.json / requirements.txt，识别核心依赖和技术栈。

### 10.6 相似项目推荐
每个项目详情页底部推荐功能/定位相似的其他项目。

### 10.7 VSCode 插件
发布 VSCode 插件，在编辑器内直接搜索 GitMirror，减少切换成本。

### 10.8 Chrome 插件
发布 Chrome 插件，在 GitHub 页面显示"已在 GitMirror 收录"标识，一键跳转。

### 10.9 API 市场
开放 API 给第三方开发者，支持嵌入搜索能力 (需申请 API Key)。

### 10.10 RSS 订阅
支持订阅搜索结果和趋势榜单的 RSS，提速聚合阅读。

---

## 十一、UI/UX 设计规范 — ⭐交互体验核心

### 11.1 设计原则

| 原则 | 说明 | 交互体现 |
|---|---|---|
| **即时反馈** | 每个操作都有即时视觉反馈 | 搜索时结果渐入/加载骨架屏/无结果提示 |
| **流畅过渡** | 页面切换和状态变化有动画 | Framer Motion 驱动，卡片悬停微动效 |
| **渐进增强** | 核心功能不依赖 JS | 搜索结果 SSR，交互降级优雅 |
| **无障碍优先** | 键盘可操作，屏幕阅读器友好 | ARIA 标签，所有交互有焦点管理 |
| **移动优先** | 手机体验和 PC 一致 | 响应式设计，移动端手势支持 |

### 11.2 动画与微交互规范

| 场景 | 动画 | 时长 | 缓动函数 |
|---|---|---|---|
| 页面进入 | fade + slide-up | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 卡片悬停 | scale(1.02) + shadow | 200ms | `ease-out` |
| 搜索建议下拉 | fade + slide-down | 150ms | `ease-out` |
| 按钮点击 | scale(0.97) | 100ms | `ease-in-out` |
| 收藏 Star | bounce + 星星飞入 | 400ms | spring 弹性 |
| 过滤面板展开 | height 过渡 + fade | 250ms | `ease-in-out` |
| 结果加载 | 骨架屏 shimmer | 持续 | linear 循环 |
| 页面切换 | crossfade | 200ms | `ease-in-out` |
| Toast 通知 | slide-in-right | 300ms | spring |
| Modal | scale + fade | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

**关键微交互:**
- 搜索框聚焦 → 边框高亮 + 推荐词滑出 + 历史记录淡入
- 搜索中 → 骨架屏替代结果 + 加载图标
- 搜索完成 → 结果卡片依次弹入 (stagger 100ms)
- 空结果 → 友好插画 + 搜索建议
- 收藏 → 星星填满动画 + 心跳抖动
- 滚动到底 → "加载更多"按钮淡入 + loading 动画
- 趋势切换 → 卡片翻转动画
- 筛选变化 → 结果区 fade 刷新

### 11.3 色彩系统

```css
/* 主题色 */
:root {
  /* GitHub 风格主色 */
  --color-primary: #0969DA;      /* GitHub 蓝 */
  --color-primary-hover: #0860CA;
  --color-primary-active: #0650A5;

  /* 功能色 */
  --color-success: #1A7F37;       /* Stars 绿 */
  --color-warning: #BF8700;       /* 警告橙 */
  --color-danger: #CF222E;        /* 错误红 */
  --color-purple: #8250DF;        /* AI 紫色 */

  /* 中性色 */
  --color-bg: #F6F8FA;            /* 页面背景 */
  --color-surface: #FFFFFF;      /* 卡片背景 */
  --color-border: #D0D7DE;        /* 边框 */
  --color-text: #1F2328;          /* 主文字 */
  --color-text-muted: #656D76;    /* 次文字 */

  /* 暗色模式 */
  --color-dark-bg: #0D1117;
  --color-dark-surface: #161B22;
  --color-dark-border: #30363D;
  --color-dark-text: #E6EDF3;
  --color-dark-text-muted: #7D8590;
}
```

### 11.4 组件库清单

| 组件 | 来源 | 变体数量 | 交互特点 |
|---|---|---|---|
| **Button** | shadcn/ui | 8+ | hover/active/loading/disabled states |
| **Input** | shadcn/ui | 4+ | focus ring / error / search prefix |
| **Card** | shadcn/ui | 3+ | hover lift / selected / featured |
| **Badge** | shadcn/ui | 6+ | language colors / trend indicators |
| **Dialog/Modal** | shadcn/ui | 3+ | backdrop blur / spring scale |
| **Dropdown** | shadcn/ui | 5+ | slide animation / keyboard nav |
| **Select** | shadcn/ui | 2+ | custom option render |
| **Tabs** | shadcn/ui | 4+ | indicator slide animation |
| **Command** | shadcn/ui | — | ⌘K 命令面板，支持搜索 |
| **DataTable** | shadcn/ui | — | sortable / selectable / pagination |
| **Sheet** | shadcn/ui | — | 移动端侧滑抽屉 |
| **Toast** | Sonner | — | positionable / action / AI special |
| **Skeleton** | 自定义 | 5+ | shimmer loading states |
| **EmptyState** | 自定义 | 3+ | 插画 + 友好文案 |
| **RepoCard** | 自定义 | 3+ | hover reveal actions / star animation |
| **TrendCard** | 自定义 | 2+ | rank badge / sparkline mini chart |
| **FilterPanel** | 自定义 | — | slide-down / chip tags |
| **SearchBox** | 自定义 | 2+ | expandable / cmd+k focus |
| **AIPanel** | 自定义 | — | slide-over / streaming response |
| **CodeViewer** | 自定义 | — | syntax highlight + line numbers |
| **ReadmeViewer** | 自定义 | — | markdown render + TOC sidebar |

### 11.5 快捷键与键盘交互

| 快捷键 | 功能 | 适用场景 |
|---|---|---|
| `⌘K` / `Ctrl+K` | 聚焦搜索框 | 全局 |
| `Escape` | 关闭弹窗/清除搜索 | 全局 |
| `↑↓` | 浏览搜索建议 | 搜索框 |
| `Enter` | 确认搜索/跳转 | 搜索建议 |
| `Tab` | 快速补全推荐词 | 搜索框 |
| `⌘B` | 切换侧边过滤面板 | 搜索结果页 |
| `⌘/]` | 收藏当前项目 | 项目详情页 |
| `G then D` | 前往 Dashboard | 全局 (vim style) |
| `G then S` | 前往搜索 | 全局 |
| `?` | 显示快捷键列表 | 全局 |
| `/` | 聚焦搜索框 | 首页 |
| `O` | 在新标签打开 | 搜索结果 |
| `C` | 对比选中项目 | 搜索结果 (多选) |

### 11.6 图片资源需求清单

| 类型 | 用途 | 规格要求 | 推荐来源 |
|---|---|---|---|
| **Logo** | 导航栏/网站图标 | SVG + PNG (512px) | 自定义设计 |
| **OG 封面图** | 社交分享 | 1200×630 PNG/JPG | 自定义 + 动态生成 |
| **Favicon** | 浏览器标签 | SVG + ICO (32px) | Logo 简化版 |
| **空状态插画** | 无搜索结果/无收藏 | 300×300 SVG (轻量) | Storyset / Undraw |
| **趋势卡片背景** | 趋势榜单装饰 | 1920×1080 JPG | 渐变 + GitHub Octocat |
| **项目语言 Logo** | 编程语言标识 | 48×48 PNG (各语言) | Simple Icons CDN |
| **用户头像** | 评论区/收藏夹 | 48/64/96/128px | GitHub OAuth 同步 |
| **README 视频封面** | 视频缩略图 | 320×180 JPG | GitHub 视频帧提取 |
| **AI 功能图标** | AI 面板/翻译按钮 | 24×24 SVG | 自定义 + Lucide |
| **加载骨架屏** | 占位加载 | 组件级 SVG | shimmer 动画 |
| **趋势背景** | 趋势页装饰 | CSS 渐变 + 噪点 | 自定义 CSS |
| **404/错误页** | 错误提示 | 500×400 SVG | 自定义插画 |
| **Empty Favicon** | 无项目时 | 48×48 SVG | Logo 简化 |
| **Stars 动画** | 收藏动画 | Lottie JSON | LottieFiles |
| **Loading 动画** | 加载状态 | Lottie JSON / SVG | 自定义 SVG |

**CDN 加速图片:**
```typescript
// 图片 CDN 配置 — 所有 GitHub 头像/项目图片走 CDN 代理
const IMAGE_CDN_BASE = process.env.IMAGE_CDN_URL || ''

// 语言 Logo (Simple Icons CDN — 自动走 Cloudflare)
const langIcon = (lang: string) =>
  `https://cdn.simpleicons.org/${lang}/black/${lang}.svg`
```

### 11.7 响应式断点

| 断点 | 宽度 | 布局策略 |
|---|---|---|
| **Mobile** | < 640px | 单列，底部导航，过滤面板 drawer |
| **Tablet** | 640-1024px | 双列，简化侧边栏 |
| **Desktop** | 1024-1280px | 三列，侧边栏固定 |
| **Wide** | > 1280px | 四列，最大宽度 1440px |

### 11.8 主题切换

- [x] 亮色模式 (默认，GitHub 风格)
- [x] 暗色模式 (深色，开发者友好)
- [x] 系统跟随 (`prefers-color-scheme`)
- [x] 本地持久化 (`localStorage`)
- [x] 切换动画 (smooth transition)

---

## 十二、页面清单

| 页面 | 路由 | 权限 | 说明 |
|---|---|---|---|
| **首页** | `/` | 公开 | 搜索框 + 三种趋势 |
| **搜索结果** | `/search` | 公开 | 搜索结果列表 |
| **仓库详情** | `/repo/:owner/:repo` | 公开 | README + 文件树 |
| **用户主页** | `/user/:username` | 公开 | 用户收藏夹 |
| **趋势榜** | `/trending` | 公开 | 完整趋势榜单 |
| **收藏夹详情** | `/collection/:id` | 公开/私有 | 收藏项目列表 |
| **登录页** | `/login` | 公开 | GitHub 登录 |
| **个人仪表盘** | `/dashboard` | 登录 | 收藏 + 历史 |
| **收藏管理** | `/dashboard/collections` | 登录 | 增删改收藏夹 |
| **搜索历史** | `/dashboard/history` | 登录 | 历史记录 |
| **账号设置** | `/dashboard/settings` | 登录 | 个人信息 |
| **管理-用户** | `/admin/users` | 管理员 | 用户管理 |
| **管理-项目** | `/admin/repos` | 管理员 | 项目收录管理 |
| **管理-趋势** | `/admin/trending` | 管理员 | 置顶项目配置 |
| **管理-评论** | `/admin/comments` | 管理员 | 评论审核 |
| **管理-统计** | `/admin/analytics` | 管理员 | 数据统计 |

---

*好耶！项目文档完成喵~ 主人快看看有没有要补充的！o( =∩ω∩= )m*
