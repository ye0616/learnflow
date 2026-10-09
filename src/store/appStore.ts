import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LearningFlow, FlowVersion, User, LearnMessage, Milestone, PortfolioItem, Badge } from '../types'

// ===== 应用全局状态 =====

interface AppState {
  // 用户
  currentUser: User
  
  // 学习流
  flows: LearningFlow[]
  activeFlowId: string | null
  
  // Learn 对话
  learnMessages: LearnMessage[]
  learnTyping: boolean
  
  // UI
  sidebarCollapsed: boolean
  
  // Actions
  setActiveFlow: (id: string | null) => void
  addFlow: (flow: LearningFlow) => void
  updateFlow: (id: string, updates: Partial<LearningFlow>) => void
  deleteFlow: (id: string) => void
  duplicateFlow: (id: string) => LearningFlow | null
  saveFlowVersion: (flowId: string, label: string) => void
  restoreVersion: (flowId: string, versionId: string) => void
  addLearnMessage: (msg: LearnMessage) => void
  setLearnTyping: (typing: boolean) => void
  toggleSidebar: () => void
  updateUserXP: (xp: number) => void
  updateUser: (updates: Partial<User>) => void
  importFlow: (data: Partial<LearningFlow>) => LearningFlow
  exportFlowData: (id: string) => Partial<LearningFlow> | null
}

const DEMO_USER: User = {
  id: 'user-1',
  name: 'Ariel',
  avatar: '',
  bio: '热爱学习的前端开发者，正在探索 AI 与数据科学的交叉领域 🌱',
  level: 'intermediate',
  xp: 680,
  streak: 7,
  totalStudyTime: 3240,
  joinedAt: '2026-05-01',
  skills: {
    'Python': 72,
    '数据分析': 58,
    '算法': 45,
    '前端开发': 80,
    '机器学习': 30,
    '英语写作': 65,
  },
  milestones: [
    {
      id: 'ms-1',
      date: '2026-03-15',
      title: '完成《Python入门到实践》',
      description: '系统学习了 Python 基础、函数、面向对象编程和文件操作',
      icon: '🐍',
      category: 'course',
    },
    {
      id: 'ms-2',
      date: '2026-04-02',
      title: '第一个个人项目上线',
      description: '用 React + Node.js 搭建了个人博客，部署到 Vercel',
      icon: '🚀',
      category: 'project',
    },
    {
      id: 'ms-3',
      date: '2026-04-20',
      title: '前端开发技能点亮',
      description: 'React、TypeScript、CSS 熟练度达到 80%',
      icon: '⚡',
      category: 'skill',
    },
    {
      id: 'ms-4',
      date: '2026-05-01',
      title: '加入 LearnFlow',
      description: '开始使用 AI 驱动的学习流规划自己的学习路径',
      icon: '🌟',
      category: 'achievement',
    },
    {
      id: 'ms-5',
      date: '2026-05-18',
      title: '数据分析入门完成',
      description: '掌握了 Pandas、NumPy 和基础数据可视化技能',
      icon: '📊',
      category: 'skill',
    },
    {
      id: 'ms-6',
      date: '2026-06-01',
      title: '创建第一个学习协作小组',
      description: '发起「AI 学习互助组」学习室，邀请 3 位同学加入',
      icon: '👥',
      category: 'achievement',
    },
    {
      id: 'ms-7',
      date: '2026-06-10',
      title: '机器学习入门',
      description: '完成 Andrew Ng 机器学习课程前 4 周，掌握线性回归和逻辑回归',
      icon: '🤖',
      category: 'course',
    },
  ],
  portfolio: [
    {
      id: 'pf-1',
      title: '个人博客',
      description: '基于 React 18 + Vite 构建的个人技术博客，支持 Markdown 渲染和暗色模式',
      techStack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
      demoUrl: 'https://example-blog.vercel.app',
      repoUrl: 'https://github.com/ariel/my-blog',
      coverEmoji: '📝',
      date: '2026-04-02',
    },
    {
      id: 'pf-2',
      title: '数据看板',
      description: '使用 ECharts 可视化学生成绩数据的交互式看板，支持多维度筛选',
      techStack: ['React', 'ECharts', 'Python', 'Flask'],
      demoUrl: 'https://data-dashboard-demo.vercel.app',
      coverEmoji: '📈',
      date: '2026-05-20',
    },
    {
      id: 'pf-3',
      title: '番茄钟学习计时器',
      description: '一个精美的番茄工作法计时器，支持自定义时长、白噪音和统计报表',
      techStack: ['Vue 3', 'TypeScript', 'SCSS'],
      demoUrl: 'https://pomodoro-timer.vercel.app',
      repoUrl: 'https://github.com/ariel/pomodoro',
      coverEmoji: '🍅',
      date: '2026-06-05',
    },
  ],
  badges: [
    { id: 'bd-1', name: '初露锋芒', description: '完成第一个学习流', icon: '🌱', category: 'study', unlockedAt: '2026-05-02' },
    { id: 'bd-2', name: '连续7天', description: '连续打卡 7 天', icon: '🔥', category: 'streak', unlockedAt: '2026-05-08' },
    { id: 'bd-3', name: '代码能手', description: '前端开发技能达到 80%', icon: '💻', category: 'skill', unlockedAt: '2026-05-15' },
    { id: 'bd-4', name: '项目先锋', description: '完成 3 个个人项目', icon: '🏆', category: 'project', unlockedAt: '2026-06-05' },
    { id: 'bd-5', name: '社交达人', description: '创建第一个学习协作小组', icon: '🤝', category: 'social', unlockedAt: '2026-06-01' },
    { id: 'bd-6', name: '学习之星', description: '累计学习 50 小时', icon: '⭐', category: 'study', unlockedAt: undefined },
    { id: 'bd-7', name: '全栈之路', description: '完成前后端各一个项目', icon: '🔗', category: 'skill', unlockedAt: undefined },
    { id: 'bd-8', name: '连续30天', description: '连续打卡 30 天', icon: '💎', category: 'streak', unlockedAt: undefined },
  ],
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: DEMO_USER,
      flows: [],
      activeFlowId: null,
      learnMessages: [],
      learnTyping: false,
      sidebarCollapsed: false,
      
      setActiveFlow: (id) => set({ activeFlowId: id }),
      
      addFlow: (flow) => set((state) => ({
        flows: [...state.flows, flow],
        activeFlowId: flow.id,
      })),
      
      updateFlow: (id, updates) => set((state) => ({
        flows: state.flows.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f)
      })),
      
      deleteFlow: (id) => set((state) => ({
        flows: state.flows.filter(f => f.id !== id),
        activeFlowId: state.activeFlowId === id ? null : state.activeFlowId,
      })),
      
      duplicateFlow: (id) => {
        const flow = get().flows.find(f => f.id === id)
        if (!flow) return null
        const newFlow: LearningFlow = {
          ...flow,
          id: `flow-${Date.now()}`,
          title: `${flow.title} (副本)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: 0,
          versions: [],
          shareLink: undefined,
          nodes: flow.nodes.map(n => ({
            ...n,
            data: { ...n.data, status: 'not_started' as const, progress: 0, duration: undefined },
          })),
          edges: flow.edges.map(e => ({ ...e, animated: false })),
        }
        set((state) => ({ flows: [...state.flows, newFlow] }))
        return newFlow
      },
      
      saveFlowVersion: (flowId, label) => {
        const flow = get().flows.find(f => f.id === flowId)
        if (!flow) return
        const version: FlowVersion = {
          id: `v-${Date.now()}`,
          flowId,
          version: (flow.versions?.length || 0) + 1,
          label,
          nodes: JSON.parse(JSON.stringify(flow.nodes)),
          edges: JSON.parse(JSON.stringify(flow.edges)),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          flows: state.flows.map(f =>
            f.id === flowId
              ? { ...f, versions: [...(f.versions || []), version] }
              : f
          )
        }))
      },
      
      restoreVersion: (flowId, versionId) => {
        const flow = get().flows.find(f => f.id === flowId)
        if (!flow) return
        const version = flow.versions?.find(v => v.id === versionId)
        if (!version) return
        set((state) => ({
          flows: state.flows.map(f =>
            f.id === flowId
              ? {
                  ...f,
                  nodes: JSON.parse(JSON.stringify(version.nodes)),
                  edges: JSON.parse(JSON.stringify(version.edges)),
                  updatedAt: new Date().toISOString(),
                }
              : f
          )
        }))
      },

      importFlow: (data) => {
        const newFlow: LearningFlow = {
          id: `flow-${Date.now()}`,
          title: data.title || '导入的学习流',
          description: data.description,
          coverColor: data.coverColor,
          nodes: (data.nodes || []) as LearningFlow['nodes'],
          edges: (data.edges || []) as LearningFlow['edges'],
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublic: false,
          tags: data.tags,
          totalEstimatedTime: data.totalEstimatedTime,
          versions: [],
        }
        set((state) => ({
          flows: [...state.flows, newFlow],
          activeFlowId: newFlow.id,
        }))
        return newFlow
      },

      exportFlowData: (id) => {
        const flow = get().flows.find(f => f.id === id)
        if (!flow) return null
        return {
          title: flow.title,
          description: flow.description,
          coverColor: flow.coverColor,
          tags: flow.tags,
          nodes: flow.nodes,
          edges: flow.edges,
          totalEstimatedTime: flow.totalEstimatedTime,
        }
      },
      
      addLearnMessage: (msg) => set((state) => ({
        learnMessages: [...state.learnMessages, msg]
      })),
      
      setLearnTyping: (typing) => set({ learnTyping: typing }),
      
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      updateUserXP: (xp) => set((state) => ({
        currentUser: { ...state.currentUser, xp: state.currentUser.xp + xp }
      })),

      updateUser: (updates) => set((state) => ({
        currentUser: { ...state.currentUser, ...updates }
      })),
    }),
    {
      name: 'learnflow-storage',
      partialize: (state) => ({
        flows: state.flows,
        activeFlowId: state.activeFlowId,
        currentUser: state.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        // 迁移：移除已删除的示例学习流（React全栈、算法与数据结构）
        if (state) {
          const removedDemoIds = ['flow-react', 'flow-algo']
          state.flows = state.flows.filter(f => !removedDemoIds.includes(f.id))
          if (state.activeFlowId && removedDemoIds.includes(state.activeFlowId)) {
            state.activeFlowId = null
          }
        }
      },
    }
  )
)
