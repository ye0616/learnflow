import { LearningFlow, FlowNodeData, NodeType, NodeStatus } from '../types'
import { Node, Edge, MarkerType } from '@xyflow/react'

// ===== Mock 数据 =====

export const DEMO_FLOWS: LearningFlow[] = [
  {
    id: 'flow-python-data',
    title: 'Python 数据分析入门',
    description: '从 Python 基础语法到完成豆瓣电影数据可视化分析项目',
    coverColor: '#3b82f6',
    progress: 45,
    isPublic: true,
    tags: ['Python', '数据分析', '可视化'],
    totalEstimatedTime: 4800, // 80小时
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-06-01T14:30:00Z',
    nodes: [
      {
        id: 'n1', type: 'flowNode', position: { x: 50, y: 200 },
        data: { id: 'n1', type: 'knowledge', label: '变量与数据类型', description: '掌握 Python 基本数据类型和变量声明', estimatedTime: 90, status: 'completed', progress: 100, tags: ['Python基础'] }
      },
      {
        id: 'n2', type: 'flowNode', position: { x: 280, y: 100 },
        data: { id: 'n2', type: 'knowledge', label: 'Python 学习资源', description: 'B站 Python 基础教程系列（莫烦 Python）', estimatedTime: 120, status: 'completed', progress: 100, tags: ['视频资源'] }
      },
      {
        id: 'n3', type: 'flowNode', position: { x: 280, y: 320 },
        data: { id: 'n3', type: 'practice', label: '数据类型练习', description: '完成 15 道数据类型和变量练习题', estimatedTime: 60, status: 'completed', progress: 100, tags: ['练习'] }
      },
      {
        id: 'n4', type: 'flowNode', position: { x: 510, y: 200 },
        data: { id: 'n4', type: 'knowledge', label: '循环与条件', description: 'for/while 循环和 if/else 条件语句', estimatedTime: 120, status: 'completed', progress: 100, tags: ['Python基础'] }
      },
      {
        id: 'n5', type: 'flowNode', position: { x: 740, y: 200 },
        data: { id: 'n5', type: 'knowledge', label: '函数定义', description: '函数参数、返回值、作用域', estimatedTime: 120, status: 'in_progress', progress: 60, tags: ['Python基础'] }
      },
      {
        id: 'n6', type: 'flowNode', position: { x: 970, y: 200 },
        data: { id: 'n6', type: 'quiz', label: '阶段一测验', description: 'Python 基础语法综合测验，10 道题', estimatedTime: 30, status: 'not_started', progress: 0, tags: ['测验'] }
      },
      {
        id: 'n7', type: 'flowNode', position: { x: 1200, y: 100 },
        data: { id: 'n7', type: 'knowledge', label: 'Pandas 基础', description: 'DataFrame 创建、读取、基本操作', estimatedTime: 150, status: 'not_started', progress: 0, tags: ['Pandas'] }
      },
      {
        id: 'n8', type: 'flowNode', position: { x: 1200, y: 300 },
        data: { id: 'n8', type: 'knowledge', label: '数据清洗', description: '缺失值处理、异常值检测、数据类型转换', estimatedTime: 120, status: 'not_started', progress: 0, tags: ['数据清洗'] }
      },
      {
        id: 'n9', type: 'flowNode', position: { x: 1430, y: 200 },
        data: { id: 'n9', type: 'knowledge', label: 'Matplotlib 可视化', description: '折线图、柱状图、散点图绘制', estimatedTime: 120, status: 'not_started', progress: 0, tags: ['可视化'] }
      },
      {
        id: 'n10', type: 'flowNode', position: { x: 1660, y: 200 },
        data: { id: 'n10', type: 'project', label: '豆瓣电影数据分析', description: '综合项目：爬取、清洗、分析、可视化豆瓣 Top250 数据', estimatedTime: 480, status: 'not_started', progress: 0, tags: ['项目实战'] }
      },
    ] as Node<FlowNodeData>[],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2', animated: false },
      { id: 'e1-3', source: 'n1', target: 'n3', animated: false },
      { id: 'e2-4', source: 'n2', target: 'n4', animated: false },
      { id: 'e3-4', source: 'n3', target: 'n4', animated: false },
      { id: 'e4-5', source: 'n4', target: 'n5', animated: true },
      { id: 'e5-6', source: 'n5', target: 'n6' },
      { id: 'e6-7', source: 'n6', target: 'n7' },
      { id: 'e6-8', source: 'n6', target: 'n8' },
      { id: 'e7-9', source: 'n7', target: 'n9' },
      { id: 'e8-9', source: 'n8', target: 'n9' },
      { id: 'e9-10', source: 'n9', target: 'n10' },
    ] as Edge[],
  },
]

// 每日学习统计 mock
export const DAILY_STATS = Array.from({ length: 56 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (55 - i))
  return {
    date: date.toISOString().split('T')[0],
    studyTime: Math.random() > 0.3 ? Math.floor(Math.random() * 180 + 30) : 0,
    nodesCompleted: Math.floor(Math.random() * 3),
    focusScore: Math.floor(Math.random() * 40 + 60),
    xpGained: Math.floor(Math.random() * 50),
  }
})

// 学习地图光点 mock
export const MAP_POINTS = [
  { id: 'p1', userId: 'u1', name: '学习小能手', x: 15, y: 25, topic: 'Python数据分析', topicCategory: 'programming' as const, progress: 68, studyDay: 12 },
  { id: 'p2', userId: 'u2', name: '代码诗人', x: 35, y: 40, topic: 'React全栈', topicCategory: 'programming' as const, progress: 45, studyDay: 8 },
  { id: 'p3', userId: 'u3', name: '算法达人', x: 55, y: 20, topic: '算法入门', topicCategory: 'programming' as const, progress: 30, studyDay: 5 },
  { id: 'p4', userId: 'u4', name: '英语进修中', x: 25, y: 60, topic: 'IELTS备考', topicCategory: 'language' as const, progress: 72, studyDay: 30 },
  { id: 'p5', userId: 'u5', name: '设计大佬', x: 70, y: 45, topic: 'UI/UX设计', topicCategory: 'design' as const, progress: 55, studyDay: 15 },
  { id: 'p6', userId: 'u6', name: '考研战士', x: 80, y: 70, topic: '数学考研', topicCategory: 'exam' as const, progress: 40, studyDay: 60 },
  { id: 'p7', userId: 'u7', name: '前端小白', x: 45, y: 75, topic: 'Vue3学习', topicCategory: 'programming' as const, progress: 20, studyDay: 3 },
  { id: 'p8', userId: 'u8', name: '机器学习er', x: 60, y: 35, topic: '机器学习', topicCategory: 'programming' as const, progress: 85, studyDay: 45 },
]

// Learn 预设回复
export const LEARN_RESPONSES: Record<string, string> = {
  python: '好的！我来帮你规划一条 Python 数据分析的学习路径。\n\n根据你的目标，我推荐以下学习流：\n\n**阶段一（2周）：Python 基础语法**\n- 变量与数据类型 (1.5h)\n- 循环与条件 (2h)\n- 函数与模块 (2h)\n- 阶段测验 (0.5h)\n\n**阶段二（2周）：数据处理**\n- Pandas 基础 (3h)\n- 数据清洗 (2h)\n- NumPy 数值计算 (2h)\n\n**阶段三（1周）：数据可视化**\n- Matplotlib (2h)\n- Seaborn (1.5h)\n\n**最终项目**：豆瓣电影数据分析 (8h)\n\n要我直接生成这个学习流吗？',
  react: '好的！React 是一个非常值得学习的前端框架。我为你设计了一条系统的学习路径：\n\n**阶段一：React 基础（2周）**\n- JSX 语法\n- 组件与 Props\n- State 与生命周期\n- Hooks (useState, useEffect)\n\n**阶段二：进阶（2周）**\n- Context 与状态管理\n- React Router\n- 性能优化\n\n**阶段三：全栈（3周）**\n- Node.js 基础\n- REST API 设计\n- 数据库连接\n\n**项目实战**：全栈 Todo 应用\n\n整个学习流预计 100 小时，按你的节奏可在 2 个月内完成。要生成完整学习流吗？',
  javascript: 'JavaScript 是 Web 开发的基石！我为你规划了以下学习路径：\n\n**阶段一：ES6+ 核心（1周）**\n- let/const 与作用域 (1h)\n- 箭头函数 (1h)\n- 解构与展开 (1h)\n- Promise & async/await (2h)\n\n**阶段二：DOM 与浏览器（1周）**\n- DOM 操作基础 (2h)\n- 事件处理 (1.5h)\n- 异步请求 (1.5h)\n\n**阶段三：工具链（1周）**\n- npm 包管理 (1h)\n- Webpack/Vite 基础 (1.5h)\n- ESLint + Prettier (0.5h)\n\n**项目实战**：Todo 应用 + 天气应用\n\n准备好开始了吗？要我生成学习流吗？',
  typescript: 'TypeScript 是提升代码质量的重要工具，以下是系统学习路径：\n\n**阶段一：类型基础（1周）**\n- 基础类型与接口 (2h)\n- 泛型入门 (2h)\n- 类型推导 (1h)\n\n**阶段二：进阶类型（2周）**\n- 高级类型（联合/交叉/条件）(3h)\n- 工具类型 (2h)\n- 声明文件 (1h)\n\n**阶段三：实战（1周）**\n- React + TS 项目搭建 (3h)\n- Node.js + TS 后端 (2h)\n\n**项目实战**：用 TS 重写一个中等规模的应用\n\n要我帮你生成完整学习流吗？',
  node: 'Node.js 后端开发是成为全栈工程师的必经之路：\n\n**阶段一：Node.js 核心（1周）**\n- 事件循环与异步 (2h)\n- 文件系统与流 (1.5h)\n- HTTP 模块 (1.5h)\n\n**阶段二：Express 框架（1周）**\n- 路由与中间件 (2h)\n- RESTful API 设计 (2h)\n- 错误处理 (1h)\n\n**阶段三：数据持久化（1周）**\n- MongoDB / PostgreSQL (3h)\n- ORM (Prisma/Mongoose) (2h)\n\n**项目实战**：博客 API 服务\n\n想直接生成这个学习流吗？',
  algorithm: '算法与数据结构是编程内功，我建议这样学：\n\n**阶段一：数据结构（1周）**\n- 数组与链表 (2h)\n- 栈与队列 (1.5h)\n- 哈希表 (1.5h)\n\n**阶段二：基础算法（2周）**\n- 排序算法 (3h)\n- 二分查找 (1h)\n- 递归与分治 (2h)\n\n**阶段三：进阶算法（2周）**\n- 动态规划 (4h)\n- 图算法 (3h)\n- 贪心算法 (2h)\n\n**刷题计划**：LeetCode 每日一题 (60天)\n\n要我生成这个学习流吗？',
  ai: 'AI / 机器学习入门路径：\n\n**阶段一：数学基础（2周）**\n- 线性代数核心概念 (3h)\n- 概率论基础 (2h)\n- 微积分回顾 (2h)\n\n**阶段二：工具链（1周）**\n- Python NumPy/Pandas (3h)\n- Matplotlib 可视化 (2h)\n\n**阶段三：机器学习（3周）**\n- 监督学习 (4h)\n- 无监督学习 (3h)\n- 模型评估 (2h)\n\n**项目实战**：房价预测 / 图像分类\n\n要生成完整学习流吗？',
  design: 'UI/UX 设计学习路径：\n\n**阶段一：设计基础（1周）**\n- 色彩理论 (2h)\n- 排版设计 (1.5h)\n- 布局原则 (1.5h)\n\n**阶段二：设计工具（1周）**\n- Figma 核心功能 (3h)\n- 组件与设计系统 (2h)\n\n**阶段三：用户体验（2周）**\n- 用户研究方法 (3h)\n- 交互设计模式 (2h)\n- 原型制作 (2h)\n\n**作品集项目**：App 完整设计\n\n要我帮你生成学习流吗？',
  english: '英语学习系统路线：\n\n**阶段一：基础搭建（2周）**\n- 核心词汇 2000 (每天 30 分钟)\n- 基础语法梳理 (3h)\n- 发音练习 (2h)\n\n**阶段二：听说训练（3周）**\n- 听力精听 (每天 20 分钟)\n- 口语跟读 (每天 15 分钟)\n- 情景对话 (2h)\n\n**阶段三：读写进阶（2周）**\n- 精读文章 (每天 20 分钟)\n- 写作模板 (2h)\n- 技术文档阅读 (每天 15 分钟)\n\n要生成完整学习流吗？',
  default: '我理解你的学习目标！让我来分析一下最适合你的学习路径。\n\n首先，告诉我几个关键信息：\n1. 你目前的基础程度如何？\n2. 每天能投入多少学习时间？\n3. 有具体的截止时间吗？\n\n有了这些信息，我可以为你量身定制一条最高效的学习流 ✨'
}

// Learn AI 动态生成学习流

interface FlowTemplate {
  topic: string
  nodes: { label: string; type: NodeType; description: string; estimatedTime: number }[]
}

const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    topic: 'Python 数据分析',
    nodes: [
      { label: 'Python 环境搭建', type: 'knowledge', description: '安装 Python 和 IDE（VS Code/PyCharm）', estimatedTime: 30 },
      { label: '变量与数据类型', type: 'knowledge', description: '数字、字符串、列表、字典等基础数据类型', estimatedTime: 90 },
      { label: '数据类型练习', type: 'practice', description: '完成 20 道基础练习题', estimatedTime: 60 },
      { label: '循环与条件语句', type: 'knowledge', description: 'for/while 循环, if/else 条件判断', estimatedTime: 120 },
      { label: '函数与模块', type: 'knowledge', description: '自定义函数、参数、返回值、import', estimatedTime: 120 },
      { label: 'Python 语法测验', type: 'quiz', description: '基础语法综合测试，通过分数 80', estimatedTime: 30 },
      { label: 'Pandas 数据处理', type: 'knowledge', description: 'DataFrame、数据读取与预处理', estimatedTime: 180 },
      { label: 'Pandas 实操练习', type: 'practice', description: '用 Pandas 分析真实数据集', estimatedTime: 120 },
      { label: 'NumPy 数值计算', type: 'knowledge', description: '数组运算、矩阵操作、统计函数', estimatedTime: 120 },
      { label: '数据可视化', type: 'knowledge', description: 'Matplotlib + Seaborn 图表绘制', estimatedTime: 120 },
      { label: '可视化作品集', type: 'project', description: '选取一个数据集，制作 3 个可视化图表', estimatedTime: 180 },
      { label: '豆瓣电影分析', type: 'project', description: '完整的豆瓣电影数据分析项目', estimatedTime: 480 },
    ]
  },
]

export function generateLearnFlow(topic: string): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const template = FLOW_TEMPLATES[0]
  
  const cols = 4
  const rowHeight = 160
  const colWidth = 260
  const startX = 50
  const startY = 60
  
  const nodes: Node<FlowNodeData>[] = template.nodes.map((item, i) => ({
    id: `ai-${i}`,
    type: 'flowNode',
    position: { x: startX + (i % cols) * colWidth, y: startY + Math.floor(i / cols) * rowHeight },
    data: {
      id: `ai-${i}`,
      type: item.type,
      label: item.label,
      description: item.description,
      estimatedTime: item.estimatedTime,
      status: i < 3 ? 'completed' as const : i === 3 ? 'in_progress' as const : 'not_started' as const,
      progress: i < 3 ? 100 : 0,
      tags: [template.topic],
    },
  }))

  const edges: Edge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `ai-e-${i}-${i + 1}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94a3b8' },
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      interactionWidth: 20,
    })
  }

  return { nodes, edges }
}
