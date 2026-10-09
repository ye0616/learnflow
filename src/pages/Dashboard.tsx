import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '../store/appStore'
import { useRoomStore } from '../store/roomStore'
import { LearningFlow, DailyPlan } from '../types'
import { generateLearnFlow } from '../utils/mockData'
import { Send, Loader2, Sparkles, RefreshCw, Target, BookOpen, Check } from 'lucide-react'
import { chatWithLearn, hasApiKey, LearnContext, cleanMarkdown, generateFlowWithAI, convertToFlowData, generateDailyPlan } from '../services/aiService'

// ═══════════════════════════════════════════
// SVG 涂鸦装饰组件
// ═══════════════════════════════════════════

function DoodleStar({ style = {}, className = '' }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className} style={style}>
      <path d="M9 1.5 L10.5 6.5 L15.5 7 L11.5 10.5 L12.8 15.5 L9 12.8 L5.2 15.5 L6.5 10.5 L2.5 7 L7.5 6.5 Z"
        stroke="var(--color-sketch)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DoodleHeart({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={style}>
      <path d="M8 14 Q3 9 3 5 Q3 2 6 2 Q8 2 8 4.5 Q8 2 10 2 Q13 2 13 5 Q13 9 8 14Z"
        stroke="var(--color-accent)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DoodleLeaf({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 22" fill="none" style={style}>
      <path d="M9 20 L9 10 Q9 4 5 2" stroke="#5A9E7A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M9 10 Q13 6 16 4" stroke="#5A9E7A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M6 6 Q4 4 6 2" stroke="#5A9E7A" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DoodleCoffee({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M4 20 L4 8 Q4 6 6 6 L16 6 Q18 6 18 8 L18 18 Q18 20 16 20 L6 20 Q4 20 4 18Z" stroke="var(--color-sketch)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M18 9 Q21 9 21 11.5 Q21 14 18 14" stroke="var(--color-sketch)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M8 3 Q9 1 10 3" stroke="var(--color-sketch)" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M12 2.5 Q13 0 14 2.5" stroke="var(--color-sketch)" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DoodlePencil({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={style}>
      <path d="M3 17 L1 15 L12 4 L14 6 Z" stroke="var(--color-sketch)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6 L14 2 L16 4 L12 8" stroke="var(--color-sketch)" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}


// ═══════════════════════════════════════════
// Marvis 头像组件 — 带脉动动画
// ═══════════════════════════════════════════

function MarvisAvatar() {
  return (
    <div
      className="avatar-pulse"
      style={{
        width: 56, height: 56,
        borderRadius: '52% 48% 56% 44%',
        border: '2px solid var(--color-accent-light)',
        background: 'linear-gradient(135deg, #FDF8F0, #FAF0E0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        boxShadow: '0 2px 8px rgba(184,149,106,0.12)',
      }}
    >
      {/* Marvis 脸 */}
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        {/* 头部 */}
        <ellipse cx="15" cy="12" rx="10" ry="9" fill="#F5EDE0" stroke="var(--color-accent)" strokeWidth="1.5" />
        {/* 眼睛 */}
        <circle cx="11" cy="12" r="2" fill="var(--color-accent)" opacity="0.8" />
        <circle cx="19" cy="12" r="2" fill="var(--color-accent)" opacity="0.8" />
        <circle cx="11" cy="11.5" r="0.7" fill="#FFF" />
        <circle cx="19" cy="11.5" r="0.7" fill="#FFF" />
        {/* 微笑 */}
        <path d="M10 16 Q12.5 19 15 17 Q17.5 19 20 16" stroke="var(--color-accent)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* 腮红 */}
        <ellipse cx="8" cy="15" rx="2.5" ry="1.5" fill="rgba(200,128,112,0.15)" />
        <ellipse cx="22" cy="15" rx="2.5" ry="1.5" fill="rgba(200,128,112,0.15)" />
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════
// 快速回复
// ═══════════════════════════════════════════

const QUICK_REPLIES = [
  '我今天想学什么好呢？',
  '帮我规划一个学习计划',
  '推荐一些入门资源',
  '怎么保持学习动力？',
]

// ═══════════════════════════════════════════
// 主仪表盘
// ═══════════════════════════════════════════

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, flows, addFlow, updateFlow } = useAppStore()
  const rooms = useRoomStore(s => s.rooms)

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // AI 每日计划
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

  const toggleChecked = useCallback((idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])

  // 构建 AI 每日计划
  const buildAndGeneratePlan = useCallback(async () => {
    if (!hasApiKey()) {
      setPlanError('请先在设置中配置 API Key')
      return
    }
    setPlanLoading(true)
    setPlanError('')
    try {
      const today = new Date()
      const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 星期${['日','一','二','三','四','五','六'][today.getDay()]}`

      // 收集学习流信息
      const flowsInfo = flows.map(f => {
        const allNodes = f.nodes || []
        const completed = allNodes.filter(n => n.data?.status === 'completed').length
        const recentTopics = allNodes
          .filter(n => n.data?.status === 'in_progress')
          .slice(0, 3)
          .map(n => n.data?.label || '')
          .filter(Boolean)
        return {
          title: f.title,
          progress: allNodes.length > 0 ? Math.round((completed / allNodes.length) * 100) : 0,
          totalNodes: allNodes.length,
          completedNodes: completed,
          recentTopics,
        }
      })

      // 收集学习室小组任务
      const roomTasks = rooms.flatMap(r =>
        r.members.map(m => ({
          roomTitle: r.title,
          memberName: m.name,
          tasks: m.tasks.map(t => ({
            title: t.title,
            status: t.status,
            dueDate: t.dueDate,
          })),
        }))
      ).filter(r => r.tasks.length > 0)

      const plan = await generateDailyPlan({
        userName: currentUser.name,
        skills: currentUser.skills,
        flows: flowsInfo.length > 0 ? flowsInfo : undefined,
        roomTasks: roomTasks.length > 0 ? roomTasks : undefined,
        today: todayStr,
      })
      setDailyPlan(plan)
      setCheckedItems(new Set())
    } catch (e: any) {
      setPlanError(e?.message || '生成失败')
    } finally {
      setPlanLoading(false)
    }
  }, [flows, rooms, currentUser])

  // 自动生成计划
  useEffect(() => {
    if (hasApiKey()) {
      buildAndGeneratePlan()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 触发词正则（含学习流/计划/规划）
  const isCreateFlowTrigger = (msg: string): boolean => {
    return /学习(规划|计划|流)|帮我.*规划|创建.*学习|新建.*流|做个.*学习|生成.*学习/.test(msg)
  }

  // 执行创建学习流 + AI 生成内容 + 跳转
  const doCreateFlowAndNavigate = async (userMsg: string) => {
    const topic = extractTopic(userMsg)
    let nodes: any[] = []
    let edges: any[] = []
    let totalEstimatedTime = 0

    if (hasApiKey()) {
      try {
        setMessages(prev => [...prev, { role: 'assistant', content: `正在用 AI 为你生成「${topic}」学习流，稍等几秒...` }])
        const generated = await generateFlowWithAI(topic)
        const converted = convertToFlowData(generated, topic)
        nodes = converted.nodes as any
        edges = converted.edges as any
        totalEstimatedTime = nodes.reduce((sum: number, n: any) => sum + (n.data?.estimatedTime || 30), 0)
      } catch (e: any) {
        // AI 生成失败，展示错误并终止跳转
        const errMsg = e?.message || e?.toString() || '未知错误'
        console.error('[doCreateFlowAndNavigate] AI 生成失败:', e)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ AI 生成失败（${errMsg}）

你可以：
1. 检查设置中的 API Key 是否正确
2. 点击「测试连接」确认可用性
3. 或者我可以用模板先帮你生成一个？`,
        }])
        setLoading(false)
        return  // 终止，不跳转
      }
    } else {
      // 无 API Key，用模板生成
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `已用模板为你生成「${topic}」学习流（配置 API Key 后可获得 AI 定制内容）～`,
      }])
      const fallback = generateLearnFlow(topic)
      nodes = fallback.nodes as any
      edges = fallback.edges as any
      totalEstimatedTime = nodes.reduce((sum: number, n: any) => sum + (n.data?.estimatedTime || 30), 0)
    }

    // 创建 flow 并跳转（节点先生成再 addFlow，一步到位）
    const flowId = `flow-${Date.now()}`
    const newFlow: LearningFlow = {
      id: flowId,
      title: topic,
      description: `${topic} 学习流`,
      nodes, edges,
      totalEstimatedTime,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      tags: [],
      versions: [],
    }
    addFlow(newFlow)
    // 存到 localStorage 作为备用（解决时序问题）
    localStorage.setItem('learnflow_pending_editor', JSON.stringify({ flowId, title: topic, nodes, edges }))
    navigate(`/editor?id=${flowId}&new=true`)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    // ★ 优先检测触发词：直接创建学习流，不依赖 AI 回复中的标记
    if (isCreateFlowTrigger(userMsg)) {
      try {
        // 先让 AI 生成一句简短确认语
        if (hasApiKey()) {
          const ack = await chatWithLearn(
            `用户说：${userMsg}。请只用一句话确认你要为他创建学习流，不要给具体建议，不要超过30字。`,
            messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          )
          setMessages(prev => [...prev, { role: 'assistant', content: cleanMarkdown(ack) }])
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `好的，我来为你创建「${extractTopic(userMsg)}」学习流！` }])
        }
        await doCreateFlowAndNavigate(userMsg)
      } catch {
        // 确认语生成失败，仍然创建
        setMessages(prev => [...prev, { role: 'assistant', content: `好的，我来为你创建学习流！` }])
        await doCreateFlowAndNavigate(userMsg)
      } finally {
        setLoading(false)
      }
      return
    }

    // 普通对话
    const allNodes = flows.flatMap(f => f.nodes || [])
    const completedNodes = allNodes.filter(n => n.data?.status === 'completed').length
    const totalNodes = allNodes.length
    const topics = [...new Set(flows.map(f => f.title))]
    const context: LearnContext = {
      userName: currentUser?.name,
      totalFlows: flows.length,
      completedNodes,
      totalNodes,
      recentTopics: topics,
    }

    try {
      if (hasApiKey()) {
        const history = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        const reply = await chatWithLearn(userMsg, history, context)
        setMessages(prev => [...prev, { role: 'assistant', content: cleanMarkdown(reply) }])
      } else {
        await new Promise(r => setTimeout(r, 600))
        const replies = [
          '好主意！先从基础开始，每天坚持一点点，进步最快 ~',
          '学习最重要的是找到节奏，不用太急。慢慢来，比较快。',
          '休息也是学习的一部分哦！今天的你已经很棒了 ~',
        ]
        setMessages(prev => [...prev, { role: 'assistant', content: replies[Math.floor(Math.random() * replies.length)] }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '哎呀出了一点小问题，待会儿再试试吧~' }])
    } finally {
      setLoading(false)
    }
  }

  // 提取学习主题（去掉触发词）
  // 从用户消息中提取学习主题（去掉触发词和口语前缀）
  const extractTopic = (msg: string): string => {
    let s = msg.trim()
    // 第一步：去掉前缀动词+量词（精确匹配，不用 \S* 防止贪婪吃掉主题）
    s = s.replace(
      /^(帮我|我要|我想|请帮我)(做|规划|创建|建|生成|设计|制定|搞|学)?\s*(一个|一份|一门|个)?\s*/,
      ''
    )
    // 第二步：去掉其他前缀
    s = s.replace(
      /^(创建|新建|做个|来个)\s*(一个|一份|一门|个)?\s*/,
      ''
    )
    // 第三步：去掉后缀（从结尾匹配）——只去末尾的动作词，保留中间的主题词
    s = s.replace(/\s*(学习(规划|计划|流)?|计划|规划|方案|内容)$/, '')
    // 第四步：去掉开头残留的「学习」
    s = s.replace(/^学习\s*/, '')
    // 第五步：去掉末尾残留量词/助词
    s = s.replace(/\s*(一个|一份|一门|的)$/, '')
    const result = s.trim()
    // 如果提取为空或太短，用最后手段
    if (!result || result.length < 2) {
      const core = msg
        .replace(/学习(规划|计划|流)?.*$/, '')
        .replace(/^(帮我|我要|我想|请帮我|帮我规划|帮我创建|帮我做|我要做一个|我想做一个|帮我搞|帮我设计|帮我制定|创建|新建|做个)\s*/, '')
        .replace(/^(一个|一份|一门|个)\s*/, '')
        .trim()
      return core || '新学习流'
    }
    return result
  }

  // 根据实际数据计算本周活动
  const weeklyActivity = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay() // 0=周日
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)) // 周一
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const weekData: number[] = [0, 0, 0, 0, 0, 0, 0] // 周一到周日

    // 1. 学习流数据：已完成节点的 estimatedTime
    flows.forEach(flow => {
      const nodes = flow.nodes || []
      nodes.forEach(node => {
        const data = node.data
        if (data && (data.status === 'completed' || data.status === 'in_progress')) {
          const time = (typeof data.estimatedTime === 'number' ? data.estimatedTime : 0) || 30
          // 分布到当天，如果一个节点是最近完成的，按比例分布
          const dayIdx = Math.min(currentDay, 6)
          weekData[dayIdx] += time
        }
      })
    })

    // 2. 学习室任务数据
    const todayStr = today.toISOString().split('T')[0]
    rooms.forEach(room => {
      room.members.forEach(member => {
        member.tasks.forEach(task => {
          if (task.status === 'done') {
            const dueDate = task.dueDate
            if (dueDate) {
              const due = new Date(dueDate)
              if (due >= startOfWeek && due <= endOfWeek) {
                const dayIdx = due.getDay() === 0 ? 6 : due.getDay() - 1
                weekData[dayIdx] += 25 // 每个完成的任务算25分钟
              }
            } else {
              // 没有日期，算到今天
              const dayIdx = currentDay === 0 ? 6 : currentDay - 1
              weekData[dayIdx] += 25
            }
          }
          if (task.status === 'in_progress') {
            const dayIdx = currentDay === 0 ? 6 : currentDay - 1
            weekData[dayIdx] += 15
          }
        })
      })
    })

    // 转换为小时，保留1位小数
    return weekData.map(m => Math.round(m / 6) / 10)
  }, [flows, rooms])

  // 根据学习室数据计算每个成员的任务进度
  const memberProgress = useMemo(() => {
    const progressMap: Record<string, { name: string; done: number; total: number; color: string }> = {}

    rooms.forEach(room => {
      room.members.forEach(member => {
        if (!progressMap[member.name]) {
          progressMap[member.name] = { name: member.name, done: 0, total: 0, color: member.color }
        }
        member.tasks.forEach(task => {
          progressMap[member.name].total++
          if (task.status === 'done') {
            progressMap[member.name].done++
          } else if (task.status === 'in_progress') {
            progressMap[member.name].done += 0.5 // 进行中算一半
          }
        })
      })
    })

    return Object.values(progressMap)
      .map(m => ({
        name: m.name,
        percent: m.total > 0 ? Math.round((m.done / m.total) * 100) : 0,
        color: m.color,
      }))
      .sort((a, b) => b.percent - a.percent) // 按进度降序排列
  }, [rooms])

  // ECharts 本周活动配置
  const weeklyOption = useMemo(() => ({
    grid: { top: 14, right: 8, bottom: 22, left: 28 },
    xAxis: {
      type: 'category' as const,
      data: ['一', '二', '三', '四', '五', '六', '日'],
      axisLabel: { fontSize: 12, color: '#9C8878', fontFamily: 'Caveat, cursive' },
      axisLine: { lineStyle: { color: '#D8CEBC', width: 1.2 } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      name: '小时',
      nameTextStyle: { fontSize: 10, color: '#B0A090', fontFamily: 'Caveat, cursive' },
      axisLabel: { fontSize: 10, color: '#B0A090', fontFamily: 'Caveat, cursive' },
      splitLine: { lineStyle: { color: '#EDE8DF', type: 'dashed' as const } },
    },
    series: [{
      type: 'bar' as const,
      data: weeklyActivity.length > 0 ? weeklyActivity : [0, 0, 0, 0, 0, 0, 0],
      itemStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#D4B38C' }, { offset: 1, color: '#C9A46A' }],
        },
        borderRadius: [5, 3, 0, 0],
      },
      barWidth: 20,
      barCategoryGap: '35%',
      animationDuration: 800,
      animationEasing: 'elasticOut' as const,
    }],
    tooltip: {
      trigger: 'axis' as const,
      formatter: (p: { name: string; value: number }[]) => `星期${p[0].name}: ${p[0].value.toFixed(1)} 小时`,
      backgroundColor: '#FDFBF8',
      borderColor: 'var(--color-sketch)',
      borderWidth: 1.5,
      textStyle: { color: '#3A342A', fontSize: 12, fontFamily: 'Caveat, cursive' },
      extraCssText: 'border-radius: 8px 4px 10px 3px;',
    },
  }), [weeklyActivity])

  return (
    <div
      ref={scrollContainerRef}
      id="dashboard-scroll"
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="relative" style={{ maxWidth: 920, margin: '0 auto', padding: '28px 32px 40px' }}>

        {/* ═══ 背景装饰 ═══ */}
        <DoodleStar className="star-twinkle-1" style={{ position: 'absolute', top: 24, right: 160 }} />
        <DoodleStar className="star-twinkle-2" style={{ position: 'absolute', top: 70, right: 60 }} />
        <DoodleStar className="star-twinkle-3" style={{ position: 'absolute', bottom: 140, left: 14 }} />
        <DoodleHeart style={{ position: 'absolute', top: 52, right: 100, opacity: 0.09 }} />
        <DoodleLeaf style={{ position: 'absolute', top: 44, left: 14, opacity: 0.08 }} />
        <DoodleCoffee style={{ position: 'absolute', bottom: 80, right: 22, opacity: 0.07 }} />
        <DoodlePencil style={{ position: 'absolute', top: 110, right: 44, opacity: 0.07, transform: 'rotate(-30deg)' }} />

        {/* ═══════════════════════════════════════════
            顶部栏 — 标题
           ═══════════════════════════════════════════ */}
        <div className="flex items-center mb-7 relative" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-3">
            <h1
              className="font-sketch breath-hover"
              style={{ fontSize: 38, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-1px' }}
            >
              LearnFlow
            </h1>
            <span
              className="font-sketch hidden sm:inline"
              style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 4, transform: 'rotate(-0.5deg)' }}
            >
              智能学习规划
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            核心引导区 — Marvis 问候 + AI 对话 + 快捷入口
           ═══════════════════════════════════════════ */}
        <div
          className="animate-stagger relative mb-7"
          style={{
            background: 'linear-gradient(135deg, #FDF9F2 0%, #F5EDDC 60%, #FCF6EC 100%)',
            border: '1.5px solid var(--color-sketch)',
            borderRadius: 'var(--radius-sketch-b)',
            padding: '22px 24px 18px',
            boxShadow: '3px 4px 0 rgba(160,140,110,0.06)',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
          }}
        >
          {/* 装饰纸纹 */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 20% 30%, rgba(210,195,170,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(200,180,150,0.08) 0%, transparent 50%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)',
            backgroundSize: '3px 3px',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* 头部：问候语 */}
            <div className="flex items-start gap-4 mb-4">
              <MarvisAvatar />
              <div className="flex-1">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="font-sketch" style={{ fontSize: 22, color: 'var(--color-text-primary)' }}>
                      嗨，{currentUser?.name || '学习者'}
                    </h2>
                    <span className="type-cursor" />
                  </div>
                  {!hasApiKey() && (
                    <span
                      className="font-sketch cursor-pointer animate-stagger animate-stagger-delay-2"
                      style={{ fontSize: 12, color: 'var(--color-accent)', opacity: 0.7 }}
                      onClick={() => navigate('/settings')}
                    >
                      配置 AI →
                    </span>
                  )}
                </div>
                <p className="font-sketch" style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  今天想学点什么呢？直接在下面跟我对话吧，我可以帮你规划学习路径、推荐资源、或者聊聊你的学习进展~
                </p>
              </div>
            </div>

            {/* 对话区域 */}
            <div style={{ marginBottom: 4, position: 'relative' }}>
              {/* 消息列表 */}
              <div
                ref={chatScrollRef}
                className="chat-scroll"
                style={{
                  maxHeight: 200, overflowY: 'auto', marginBottom: 14, paddingRight: 4,
                  scrollBehavior: 'smooth',
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="msg-enter"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        style={{
                          width: 28, height: 28, flexShrink: 0,
                          borderRadius: '50%',
                          background: '#F5EDE0',
                          border: '1.5px solid var(--color-accent-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontFamily: 'Caveat, cursive', color: 'var(--color-accent)',
                          fontWeight: 'bold', marginBottom: 1,
                        }}
                      >
                        M
                      </div>
                    )}
                    <div
                      className="chat-bubble"
                      style={{
                        maxWidth: msg.role === 'user' ? '65%' : '72%',
                        padding: msg.role === 'user' ? '9px 14px' : '10px 14px',
                        borderRadius: msg.role === 'user'
                          ? '14px 14px 4px 14px'
                          : '14px 14px 14px 4px',
                        background: msg.role === 'user'
                          ? 'var(--color-accent)'
                          : '#FDFBF8',
                        color: msg.role === 'user' ? '#FFFBF5' : 'var(--color-text-primary)',
                        fontSize: 13.5, fontFamily: 'Caveat, cursive', lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                        border: msg.role === 'user'
                          ? 'none'
                          : '1.5px solid var(--color-sketch)',
                        boxShadow: msg.role === 'user'
                          ? '0 2px 6px rgba(160,120,70,0.2)'
                          : '0 1px 3px rgba(140,120,90,0.06)',
                      }}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div
                        style={{
                          width: 28, height: 28, flexShrink: 0,
                          borderRadius: '50%',
                          border: '1.5px solid var(--color-sketch)',
                          background: '#FDFBF8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 1,
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 28 28" fill="none">
                          <circle cx="14" cy="9" r="5" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" />
                          <path d="M6 25 Q10 18 14 18 Q18 18 22 25" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="msg-enter" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 28, height: 28, flexShrink: 0,
                        borderRadius: '50%',
                        background: '#F5EDE0',
                        border: '1.5px solid var(--color-accent-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontFamily: 'Caveat, cursive', color: 'var(--color-accent)',
                        fontWeight: 'bold',
                      }}
                    >
                      M
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '11px 15px',
                      borderRadius: '14px 14px 14px 4px',
                      background: '#FDFBF8',
                      border: '1.5px solid var(--color-sketch)',
                      boxShadow: '0 1px 3px rgba(140,120,90,0.06)',
                    }}>
                      {[0, 0.15, 0.3].map((delay, j) => (
                        <div
                          key={j}
                          style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: 'var(--color-accent)', opacity: 0.5,
                            animation: `typingBounce 0.8s ease ${delay}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 输入区 */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="跟我说说你想学什么..."
                  style={{
                    flex: 1, padding: '10px 14px',
                    borderRadius: 'var(--radius-sketch-e)',
                    background: '#FDFBF8',
                    fontSize: 14, fontFamily: 'Caveat, cursive',
                    color: 'var(--color-text-primary)', outline: 'none',
                  }}
                />
                <button
                  onClick={handleSend} disabled={loading}
                  className="send-btn"
                  style={{
                    width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    borderRadius: '50%',
                    border: 'none',
                    background: loading ? '#C5BAA8' : 'var(--color-accent)',
                    cursor: loading ? 'default' : 'pointer',
                    transition: 'all 0.22s ease',
                    opacity: loading ? 0.55 : 1,
                    boxShadow: '0 2px 6px rgba(160,120,70,0.2)',
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.transform = 'scale(1.08)'
                      el.style.boxShadow = '0 3px 10px rgba(160,120,70,0.3)'
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.transform = ''
                    el.style.boxShadow = '0 2px 6px rgba(160,120,70,0.2)'
                  }}
                >
                  <Send size={15} style={{ color: '#FFFBF5' }} />
                </button>
              </div>
              {/* 快捷回复 */}
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUICK_REPLIES.map((q, i) => (
                  <button
                    key={i} onClick={() => setInput(q)}
                    style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-sketch-e)',
                      border: '1px solid var(--color-sketch)',
                      background: 'transparent',
                      fontSize: 11.5, fontFamily: 'Caveat, cursive',
                      color: 'var(--color-text-muted)', cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.background = 'var(--color-accent-bg)'
                      el.style.borderColor = 'var(--color-accent-light)'
                      el.style.color = 'var(--color-accent)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.background = 'transparent'
                      el.style.borderColor = 'var(--color-sketch)'
                      el.style.color = 'var(--color-text-muted)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            主内容 — 左右两列不对称布局
           ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7" style={{ position: 'relative', zIndex: 1 }}>

          {/* ═══ 左列 — AI 今日计划 ═══ */}
          <div className="space-y-6">

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-sketch breath-hover" style={{ fontSize: 20, color: 'var(--color-text-primary)' }}>
                    AI 今日计划
                  </h2>
                  <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
                </div>
                <button
                  onClick={buildAndGeneratePlan}
                  disabled={planLoading}
                  className="font-sketch"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer',
                    background: 'none', border: 'none', opacity: planLoading ? 0.5 : 1,
                  }}
                >
                  <RefreshCw size={13} className={planLoading ? 'animate-spin' : ''} />
                  重新生成
                </button>
              </div>

              {/* 计划摘要 */}
              {dailyPlan && (
                <p
                  className="font-sketch mb-3"
                  style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, paddingLeft: 4 }}
                >
                  {dailyPlan.summary} · 预计 {Math.round(dailyPlan.totalMinutes / 60)}小时
                </p>
              )}

              {/* 计划列表 */}
              <div className="space-y-2">
                {planLoading ? (
                  <div className="flex items-center gap-3 px-4 py-10 justify-center"
                    style={{
                      background: 'var(--color-card)',
                      border: '1.5px solid var(--color-sketch)',
                      borderRadius: 'var(--radius-sketch-b)',
                    }}>
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                    <span className="font-sketch text-sm" style={{ color: 'var(--color-text-muted)' }}>AI 正在为你规划今日学习...</span>
                  </div>
                ) : planError && !dailyPlan ? (
                  <div className="text-center py-10"
                    style={{
                      background: 'var(--color-card)',
                      border: '1.5px solid var(--color-sketch)',
                      borderRadius: 'var(--radius-sketch-b)',
                    }}>
                    <Target size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>{planError}</p>
                    <button
                      onClick={buildAndGeneratePlan}
                      className="btn-primary font-sketch text-xs"
                    >点击生成</button>
                  </div>
                ) : !dailyPlan ? (
                  <div className="text-center py-10"
                    style={{
                      background: 'var(--color-card)',
                      border: '1.5px solid var(--color-sketch)',
                      borderRadius: 'var(--radius-sketch-b)',
                    }}>
                    <Sparkles size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      {hasApiKey() ? '点击生成今日学习计划' : '配置 API Key 后自动生成'}
                    </p>
                    {hasApiKey() ? (
                      <button
                        onClick={buildAndGeneratePlan}
                        className="btn-primary font-sketch text-xs"
                      >AI 生成今日计划</button>
                    ) : (
                      <button
                        onClick={() => navigate('/settings')}
                        className="btn-primary font-sketch text-xs"
                      >去配置 AI →</button>
                    )}
                  </div>
                ) : (
                  dailyPlan.items
                    .filter(item => (item.type as string) !== 'rest')
                    .map((item, i) => {
                      const checked = checkedItems.has(i)
                      return (
                  <div
                    key={i}
                    className="animate-stagger card-lift-hover"
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      background: 'var(--color-card)',
                      border: '1.5px solid var(--color-sketch)',
                      borderRadius: 'var(--radius-sketch-c)',
                      padding: '12px 15px',
                      boxShadow: '1px 2px 0 rgba(160,140,110,0.04)',
                      borderLeft: item.priority === 'high'
                        ? '3px solid var(--color-accent)'
                        : item.priority === 'medium'
                          ? '3px solid #C9A46A'
                          : '3px solid transparent',
                      opacity: checked ? 0.45 : 1,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* 勾选框 */}
                      <button
                        onClick={() => toggleChecked(i)}
                        className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
                        style={{
                          width: 22, height: 22,
                          borderRadius: '45% 50% 48% 55%',
                          border: checked ? '2px solid #5A9E7A' : '1.5px solid var(--color-sketch)',
                          background: checked ? '#5A9E7A' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        {checked && <Check size={12} style={{ color: '#FFF' }} strokeWidth={3} />}
                      </button>

                      {/* 类型图标 */}
                      {item.type === 'study' && <BookOpen size={15} style={{ color: '#7A6BAA', flexShrink: 0 }} />}
                      {item.type === 'practice' && <Target size={15} style={{ color: '#5A9E7A', flexShrink: 0 }} />}
                      {item.type === 'review' && <RefreshCw size={15} style={{ color: '#C9A46A', flexShrink: 0 }} />}

                      {/* 任务内容 */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-sketch"
                          style={{
                            fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.3,
                            textDecoration: checked ? 'line-through' : 'none',
                          }}
                        >
                          {item.task}
                        </div>
                        {item.detail && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {item.detail}
                          </div>
                        )}
                        {(item.fromFlow || item.fromRoom) && (
                          <div className="flex items-center gap-2 mt-1">
                            {item.fromFlow && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background: '#EDE8DF', color: '#8B7355' }}>
                                {item.fromFlow}
                              </span>
                            )}
                            {item.fromRoom && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background: '#E8E0F0', color: '#7A6BAA' }}>
                                {item.fromRoom}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )})
              )}
              </div>
            </div>

          </div>

          {/* ═══ 右列 ═══ */}
          <div className="space-y-6" style={{ marginTop: 4 }}>

            {/* 本周活动 */}
            <div className="animate-stagger animate-stagger-delay-5">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-sketch breath-hover" style={{ fontSize: 20, color: 'var(--color-text-primary)' }}>
                  本周活动
                </h2>
                <DoodleLeaf style={{ width: 14, height: 16 }} />
              </div>
              <div
                style={{
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-sketch)',
                  borderRadius: 'var(--radius-sketch-d)',
                  padding: '12px 8px 8px',
                  boxShadow: '2px 3px 0 rgba(160,140,110,0.05)',
                  position: 'relative',
                }}
              >
                <svg
                  style={{ position: 'absolute', bottom: 28, left: 28, right: 8, height: 40, width: '75%', opacity: 0.1 }}
                  viewBox="0 0 300 40" fill="none" preserveAspectRatio="none"
                >
                  <path d="M0 40 Q30 10 60 25 T120 15 T180 20 T240 10 T300 18 L300 40Z" fill="#C9A46A" />
                </svg>
                <ReactECharts option={weeklyOption} style={{ height: 170 }} />
              </div>
            </div>

            {/* 小组进度 */}
            <div className="animate-stagger animate-stagger-delay-6">
              <h2 className="font-sketch breath-hover mb-3" style={{ fontSize: 20, color: 'var(--color-text-primary)' }}>
                小组进度
              </h2>
              <div
                style={{
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-sketch)',
                  borderRadius: 'var(--radius-sketch-d)',
                  padding: '16px 20px',
                  boxShadow: '2px 3px 0 rgba(160,140,110,0.05)',
                }}
              >
                {memberProgress.length === 0 ? (
                  <p className="font-sketch text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    暂无小组数据
                  </p>
                ) : (
                  <div className="space-y-3">
                    {memberProgress.map((member, i) => {
                      const isMe = member.name === (currentUser?.name || '你')
                      const isLeading = i === 0 && member.percent > 0
                      const needsHelp = member.percent < 50 && member.percent > 0
                      const barColor = isMe
                        ? 'var(--color-accent)'
                        : ['#C9A46A', '#5A9E7A', '#7A6BAA', '#B86050'][i % 4]

                      return (
                        <div key={member.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="font-sketch"
                              style={{
                                fontSize: 14,
                                color: isMe ? 'var(--color-accent)' : 'var(--color-text-primary)',
                                fontWeight: isMe ? 600 : 400,
                              }}
                            >
                              {isMe ? '你' : member.name}
                            </span>
                            <div className="flex items-center gap-2">
                              {isLeading && (
                                <span
                                  className="font-sketch"
                                  style={{
                                    fontSize: 11,
                                    color: '#5A9E7A',
                                    background: '#E8F5EC',
                                    borderRadius: '4px 2px 6px 3px',
                                    padding: '1px 7px',
                                    border: '1px solid #B8D8C0',
                                  }}
                                >
                                  领先  🏆
                                </span>
                              )}
                              {needsHelp && (
                                <span
                                  className="font-sketch"
                                  style={{
                                    fontSize: 11,
                                    color: '#B86050',
                                    background: '#FDF2ED',
                                    borderRadius: '4px 2px 6px 3px',
                                    padding: '1px 7px',
                                    border: '1px solid #E8C8BE',
                                  }}
                                >
                                  需要帮助
                                </span>
                              )}
                              <span
                                className="font-sketch"
                                style={{ fontSize: 13, color: 'var(--color-text-muted)', minWidth: 32, textAlign: 'right' }}
                              >
                                {member.percent}%
                              </span>
                            </div>
                          </div>
                          {/* 进度条 */}
                          <div
                            style={{
                              height: 10,
                              background: 'var(--color-bg)',
                              borderRadius: 'var(--radius-sketch-e)',
                              overflow: 'hidden',
                              border: '1px solid #E8DFCC',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${member.percent}%`,
                                background: `linear-gradient(90deg, ${barColor}CC, ${barColor})`,
                                borderRadius: 'var(--radius-sketch-e)',
                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                              }}
                            >
                              {/* 进度条上的手绘纹理 */}
                              <svg
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
                                viewBox="0 0 200 10" preserveAspectRatio="none"
                              >
                                <path
                                  d="M0 5 Q20 2 40 5 T80 5 T120 5 T160 5 T200 5"
                                  stroke="white" strokeWidth="1" fill="none" strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 底部手绘装饰线 ═══ */}
        <div style={{ marginTop: 36, height: 20, position: 'relative', zIndex: 1, opacity: 0.12 }}>
          <svg width="100%" height="12" viewBox="0 0 600 12" preserveAspectRatio="none" fill="none">
            <path d="M0 6 Q50 2 100 6 T200 6 T300 6 T400 6 T500 6 T600 6"
              stroke="var(--color-accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
