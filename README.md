# LearnFlow · 智能学习规划

把手绘笔记风格的学习平台做成两件实用的事：**自己画出学习路径** + **拉人一起学**。

学习流用流程图表达，节点之间用连线标出依赖关系；AI 负责根据一个主题直接生成整张图，或者按你当前的进度排今天该干什么。

---

## 功能

| 模块 | 路由 | 能力 |
| --- | --- | --- |
| 仪表盘 | `/` | AI 助手 Marvis 问候、对话式生成学习流、AI 生成今日学习计划（按优先级排序并标注关联的学习流/学习室任务） |
| 学习流编辑器 | `/editor` | 基于 React Flow 的画布，5 种节点（知识 / 练习 / 测验 / 项目 / 自定义），可拖拽、连线、改配置，支持版本快照 |
| 我的课程 | `/flows` | 学习流列表、进度、分享开关 |
| 学习室 | `/room` | 多人协作空间：3D 虚拟工位（6 个座位）、协作白板、共享资源书架、任务看板 |
| 学习室 · 白板 | `/room/:id` | 画笔 / 矩形 / 圆 / 文本 / 思维导图五种工具，按成员分色 |
| 学习室 · 书架 | `/room/:id` | 成员共建资源库，AI 自动分类 + 打标签，支持收藏 |
| 学习室 · 猫老师 | `/room/:id` | AI 助教「橘橘」，橘猫人设，负责答疑、推荐资源、劝你休息 |
| 个人主页 | `/profile` | 等级 / 学力值 / 连续打卡 / 技能熟练度 / 徽章 / 里程碑时间线 |
| 作品集构建 | `/portfolio/builder` | 一句话描述项目，AI 提取标题、描述、技术栈、链接，生成作品集条目 |
| 作品集展示 | `/portfolio/showcase` | 独立展示页（无侧边栏），可直接分享 |
| 设置 | `/settings` | API Key 录入 / 测试 / 清除 |
| 学习地图 / 工坊 / 报告 | `/map` `/workshop` `/report` | 占位页，待实现 |

---

## 技术栈

`Vite 6` · `React 18` · `TypeScript 5` · `Tailwind CSS 3` · `Zustand 5` · `React Flow (@xyflow/react 12)` · `ECharts 5` · `React Router 6` · `lucide-react`

数据全部存 **localStorage**，没有后端、没有数据库、不需要登录。三维学习室是 `public/` 下的独立单文件页面，通过 iframe 嵌入，内部用 CDN 加载 Three.js。

---

## 快速开始

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 输出到 dist/
npm run preview   # 预览构建产物
```

进入后先去 **设置** 页填一个 API Key，AI 相关功能才会启用（没配 Key 时界面会提示，其余功能照常可用）。

---

## AI 配置

大模型走 [硅基流动 SiliconFlow](https://siliconflow.cn)，模型 `Qwen/Qwen2.5-14B-Instruct`，支持浏览器直连，所以不需要任何服务端。

1. 注册硅基流动，在控制台创建 API Key
2. LearnFlow 的 **设置** 页粘贴进去 → 点「测试连接」
3. Key 存在浏览器 `localStorage`（键名 `learnflow_ai_key`），**不会上传到任何服务器**，请求由你的浏览器直接发给模型厂商

AI 被用在 5 个地方：对话助手 Learn、学习流生成、每日计划生成、学习资源自动打标、作品集条目生成。每个都有独立的 System Prompt，定义在 `src/services/aiService.ts`。

> `proxy/worker.js` 是一份 Cloudflare Worker 中转代码（用于绕开浏览器 CORS），当前前端**没有接它** —— `aiService.ts` 里 `BASE_URL` 是硬编码的硅基流动地址。留着备用。

---

## 目录结构

```
src/
├── pages/                  页面级组件
│   ├── Dashboard.tsx       仪表盘（AI 计划 + 对话 + 快捷入口）
│   ├── FlowEditor.tsx      学习流编辑器
│   ├── StudyRoomPage.tsx   学习室（3D 工位 + 白板 + 书架 + 看板）
│   ├── ProfilePage.tsx     个人主页
│   ├── PortfolioBuilderPage.tsx / PortfolioShowcase.tsx
│   └── PlaceholderPages.tsx
├── components/
│   ├── editor/             编辑器三件套：FlowNode / NodeConfigPanel / NodePalette
│   ├── studyroom/          Bookshelf 资源书架
│   ├── whiteboard/         白板画布 + 工具栏
│   └── layout/             Sidebar 手绘风侧边栏
├── services/aiService.ts   全部 AI 调用 + Prompt + 结果校验
├── store/                  appStore（用户/学习流）、roomStore（学习室）
├── types/index.ts          全局类型定义
└── utils/                  mock 数据

public/marvis-office-3d.html  三维虚拟学习室（独立单文件）
proxy/worker.js               Cloudflare Worker CORS 中转（暂未启用）
```

---

## 设计风格

刻意做旧的**手绘笔记本**质感，主要靠 `src/index.css` 里的 CSS 变量 + `index.html` 里的 SVG 滤镜实现：

- 字体：英文 `Caveat`（手写体），正文 `Inter`
- 三个 SVG 滤镜：`paper-noise`（纸纹噪点）、`pencil-texture`（铅笔笔触位移）、`watercolor-wash`（水彩晕染）
- 侧边栏右侧用 `clipPath` 做撕纸边，卡片圆角是不规则的（`50% 42% 58% 45%` 这种），按钮带 0.3–0.5 度的随机旋转
- 配色以暖米色 / 赭石棕为底，`--color-accent` 是主强调色

---

## 现状与已知问题

- **无后端**：所有数据在浏览器本地，换设备/清缓存即丢失，多人学习室目前是本地模拟
- **`public/vite.svg` 缺失**：`index.html` 里 `favicon` 指向它，控制台会有一次 404，不影响功能
- **学习地图 / 工坊 / 报告** 三个页面是占位符
- **作品集展示页** 数据依赖本地 store，分享链接给他人时对方看不到内容
- AI 输出做了容错（`fixGarbledText` 修生僻字与叠字、`cleanMarkdown` 清格式、JSON 结构校验与兜底），但模型仍可能返回不符合预期的内容

---

## 许可

个人项目，未附许可协议。如需引用请先联系作者。
