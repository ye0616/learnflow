// ===== 节点相关类型 =====

export type NodeType = 'knowledge' | 'practice' | 'quiz' | 'project' | 'custom'
export type NodeStatus = 'not_started' | 'in_progress' | 'completed'

// 推荐资料项
export interface RecommendationItem {
  type: 'book' | 'website' | 'video' | 'course' | 'tool' | 'other'
  title: string
  url?: string
  description?: string
}

export interface FlowNodeData extends Record<string, unknown> {
  id: string
  type: NodeType
  label: string
  description?: string
  estimatedTime?: number  // 分钟（仅后台记录，卡片上不显示）
  resourceUrl?: string
  tags?: string[]
  status: NodeStatus
  progress?: number       // 0-100
  quizScore?: number
  startTime?: string
  endTime?: string
  duration?: number       // 实际耗时（分钟）
  // AI 生成的推荐内容（在详情面板中展示）
  recommendations?: RecommendationItem[]
}

// ===== 学习流相关类型 =====

export interface FlowVersion {
  id: string
  flowId: string
  version: number
  label: string
  nodes: import('@xyflow/react').Node<FlowNodeData>[]
  edges: import('@xyflow/react').Edge[]
  createdAt: string
}

export interface LearningFlow {
  id: string
  title: string
  description?: string
  coverColor?: string
  nodes: import('@xyflow/react').Node<FlowNodeData>[]
  edges: import('@xyflow/react').Edge[]
  totalEstimatedTime?: number  // 分钟
  progress: number             // 0-100
  createdAt: string
  updatedAt: string
  isPublic: boolean
  tags?: string[]
  versions?: FlowVersion[]
  shareLink?: string
}

// ===== 用户相关类型 =====

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'

export interface User {
  id: string
  name: string
  avatar?: string
  email?: string
  bio?: string
  level: UserLevel
  xp: number              // 学力值
  streak: number          // 连续打卡天数
  totalStudyTime: number  // 总学习时长（分钟）
  joinedAt: string
  skills?: Record<string, number>  // 技能 -> 熟练度
  milestones?: Milestone[]
  portfolio?: PortfolioItem[]
  badges?: Badge[]
}

// ===== 个人主页相关类型 =====

export interface Milestone {
  id: string
  date: string
  title: string
  description: string
  icon: string
  category: 'course' | 'project' | 'achievement' | 'skill'
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  techStack: string[]
  demoUrl?: string
  repoUrl?: string
  coverEmoji: string
  date: string
}

export type BadgeCategory = 'study' | 'streak' | 'project' | 'social' | 'skill'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  category: BadgeCategory
}

// ===== 任务看板相关类型 =====

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface KanbanTask {
  id: string
  title: string
  description?: string
  assignees: string[]
  status: TaskStatus
  nodeId?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
}

// ===== 学习报告相关类型 =====

export interface DailyStats {
  date: string
  studyTime: number      // 分钟
  nodesCompleted: number
  focusScore: number     // 0-100
  xpGained: number
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  totalTime: number
  nodesCompleted: number
  subjectDistribution: Record<string, number>
  completionRate: number
  skillRadar: Record<string, number>
  learnSummary: string
}

// ===== Learn AI 相关类型 =====

export interface LearnMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  flowSuggestion?: Partial<LearningFlow>
}

// ===== 学习地图相关类型 =====

export interface MapPoint {
  id: string
  userId: string
  name: string        // 匿名昵称
  x: number
  y: number
  topic: string
  topicCategory: 'programming' | 'language' | 'design' | 'exam' | 'other'
  progress: number
  studyDay: number
}

// ===== 学习室相关类型 =====

export type MemberTaskStatus = 'todo' | 'in_progress' | 'done'

export interface MemberTask {
  id: string
  title: string
  description?: string
  status: MemberTaskStatus
  note?: string  // 备注
  dueDate?: string  // ISO日期，如 "2026-06-23"，用于按日期分组
}

export interface RoomMember {
  id: string
  name: string
  avatar?: string
  color: string    // 人物颜色标识
  tasks: MemberTask[]
  deskIndex: number // 分配到哪个工位（0-5）
}

export type RoomStatus = 'idle' | 'studying'

// ══════════════════════════════════════
// 资源书架类型
// ══════════════════════════════════════
export type ResourceType = 'pdf' | 'video' | 'doc' | 'repo'

export type ResourceCategory = 'frontend' | 'backend' | 'ai' | 'design' | 'math' | 'language' | 'exam' | 'other'

export interface SharedResource {
  id: string
  title: string
  type: ResourceType
  url: string
  description?: string
  tags: string[]           // AI 自动标签
  category: ResourceCategory // AI 主题分类
  addedBy: string          // 添加者 memberId
  addedByName: string
  createdAt: string
  aiTagged: boolean        // 是否已 AI 打标
}

export interface ResourceBookmark {
  memberId: string
  resourceId: string
  bookmarkedAt: string
}

export interface StudyRoom {
  id: string
  title: string
  description?: string
  members: RoomMember[]
  status: RoomStatus
  createdAt: string
  updatedAt: string
  whiteboard?: WhiteboardData
  sharedResources?: SharedResource[]
  bookmarks?: ResourceBookmark[]
}

// ══════════════════════════════════════
// 白板类型
// ══════════════════════════════════════
export type WhiteboardTool = 'pen' | 'rect' | 'circle' | 'text' | 'mindmap'

export interface WhiteboardStroke {
  id: string
  memberId: string
  memberColor: string
  type: 'pen' | 'rect' | 'circle'
  points: { x: number; y: number }[]  // pen: 多段线条，rect/circle: [start, end]
  color: string
  lineWidth: number
}

export interface WhiteboardTextNote {
  id: string
  memberId: string
  memberColor: string
  x: number
  y: number
  text: string
  fontSize: number
  color: string
}

export interface WhiteboardMindNode {
  id: string
  memberId: string
  memberColor: string
  x: number
  y: number
  text: string
  color: string
}

export interface WhiteboardMindEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  color: string
}

export interface WhiteboardData {
  strokes: WhiteboardStroke[]
  texts: WhiteboardTextNote[]
  mindNodes: WhiteboardMindNode[]
  mindEdges: WhiteboardMindEdge[]
}

// ===== AI 每日计划 =====

export interface DailyPlanItem {
  task: string        // 任务标题
  type: 'study' | 'practice' | 'review'
  detail: string      // 详细说明
  priority: 'high' | 'medium' | 'low'
  fromFlow?: string   // 关联的学习流标题
  fromRoom?: string   // 关联的学习室
}

export interface DailyPlan {
  items: DailyPlanItem[]
  summary: string     // 今日总结语
  totalMinutes: number
}

// 预设工位坐标（6个工位）
export const DESK_POSITIONS = [
  { cx: -14, cz: -6, label: 'A1' },
  { cx:   0, cz: -6, label: 'A2' },
  { cx:  14, cz: -6, label: 'A3' },
  { cx: -14, cz: 10, label: 'B1' },
  { cx:   0, cz: 10, label: 'B2' },
  { cx:  14, cz: 10, label: 'B3' },
] as const
