import { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Target, CheckCircle, Clock, Circle, Edit3, Plus, X, MessageSquare, Layout, PenTool, BookOpen, Send, Loader2 } from 'lucide-react'
import { useRoomStore } from '../store/roomStore'
import { StudyRoom, RoomMember, MemberTask, DESK_POSITIONS } from '../types'
import Whiteboard from '../components/whiteboard/Whiteboard'
import Bookshelf from '../components/studyroom/Bookshelf'
import { chatWithCat } from '../services/aiService'

export default function StudyRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const store = useRoomStore()
  const room = store.rooms.find(r => r.id === id) ?? null
  const selectedDesk = store.selectedDeskIndex

  const [taskPanelMemberId, setTaskPanelMemberId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<{ taskId: string; value: string } | null>(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskDate, setNewTaskDate] = useState<'today' | 'tomorrow' | 'custom'>('today')
  const [customDate, setCustomDate] = useState('')
  const [viewMode, setViewMode] = useState<'3d' | 'whiteboard' | 'bookshelf'>('3d')

  // 🐱 AI猫老师聊天状态
  const [isCatChatOpen, setIsCatChatOpen] = useState(false)
  const [catMessages, setCatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [catInput, setCatInput] = useState('')
  const [catLoading, setCatLoading] = useState(false)
  const catChatRef = useRef<HTMLDivElement>(null)

  const sendCatMessage = useCallback(async () => {
    const text = catInput.trim()
    if (!text || catLoading) return
    setCatInput('')
    const newMessages = [...catMessages, { role: 'user' as const, content: text }]
    setCatMessages(newMessages)
    setCatLoading(true)
    try {
      const reply = await chatWithCat(text, catMessages)
      setCatMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setCatMessages([...newMessages, { role: 'assistant', content: '喵~抱歉，我好像断网了…等会儿再试试吧 🐾' }])
    } finally {
      setCatLoading(false)
    }
  }, [catInput, catMessages, catLoading])

  // 自动滚动到底部
  useEffect(() => {
    if (catChatRef.current) {
      catChatRef.current.scrollTop = catChatRef.current.scrollHeight
    }
  }, [catMessages])

  // 实时从 room.members 派生当前成员（避免 stale closure 导致打勾无效）
  const activeMember = room && taskPanelMemberId
    ? room.members.find(m => m.id === taskPanelMemberId) ?? null
    : null

  const openTaskPanel = useCallback((deskIndex: number) => {
    if (!room) return
    const member = room.members.find(m => m.deskIndex === deskIndex)
    setTaskPanelMemberId(member?.id ?? null)
    store.selectDesk(deskIndex)
  }, [room, store])

  const closeTaskPanel = useCallback(() => {
    setTaskPanelMemberId(null)
    store.selectDesk(null)
    setEditingNote(null)
  }, [store])

  // 更新任务状态
  const toggleTaskStatus = (memberId: string, task: MemberTask) => {
    if (!room) return
    const nextStatus = task.status === 'done' ? 'todo' : 'done'
    store.updateTaskStatus(room.id, memberId, task.id, nextStatus as MemberTask['status'])
  }

  // 添加任务（带日期）
  const addTaskWithDate = useCallback((memberId: string) => {
    if (!room || !newTaskText.trim()) return
    if (newTaskDate === 'custom' && !customDate) return
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    let dueDate: string
    if (newTaskDate === 'today') dueDate = today
    else if (newTaskDate === 'tomorrow') dueDate = tomorrow
    else dueDate = customDate
    store.addTaskWithDate(room.id, memberId, newTaskText.trim(), dueDate)
    setNewTaskText('')
    setCustomDate('')
  }, [room, newTaskText, newTaskDate, customDate, store])

  // 按日期分组任务
  const groupTasksByDate = useCallback((tasks: MemberTask[]) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const todayLabel = `${now.getMonth() + 1}月${now.getDate()}日`
    const tomorrowDate = new Date(Date.now() + 86400000)
    const tomorrowLabel = `${tomorrowDate.getMonth() + 1}月${tomorrowDate.getDate()}日`

    const groups: { label: string; tasks: MemberTask[]; empty?: boolean }[] = []
    const todayTasks = tasks.filter(t => !t.dueDate || t.dueDate === today)
    const tomorrowTasks = tasks.filter(t => t.dueDate === tomorrow)
    const laterTasks = tasks.filter(t => t.dueDate && t.dueDate !== today && t.dueDate !== tomorrow)

    if (todayTasks.length > 0) groups.push({ label: todayLabel, tasks: todayTasks })
    else groups.push({ label: todayLabel, tasks: [], empty: true })

    if (tomorrowTasks.length > 0) groups.push({ label: tomorrowLabel, tasks: tomorrowTasks })

    // 其他日期按 dueDate 分组
    const laterGroups: Record<string, MemberTask[]> = {}
    laterTasks.forEach(t => {
      const key = t.dueDate!
      if (!laterGroups[key]) laterGroups[key] = []
      laterGroups[key].push(t)
    })
    Object.entries(laterGroups).sort(([a], [b]) => a.localeCompare(b)).forEach(([date, ts]) => {
      const d = new Date(date)
      const label = `${d.getMonth() + 1}月${d.getDate()}日`
      groups.push({ label, tasks: ts })
    })

    return groups
  }, [])

  // 拖拽成员到新工位
  const handleMemberDrop = useCallback((memberId: string, newDeskIndex: number) => {
    if (!room) return
    store.moveMember(room.id, memberId, newDeskIndex)
  }, [room, store])

  // 发送数据到iframe（等待场景就绪后）
  useEffect(() => {
    if (!room) return

    let sceneReady = false
    let retries = 0
    const maxRetries = 50

    const sendRoomData = () => {
      if (!iframeRef.current?.contentWindow) return
      iframeRef.current.contentWindow.postMessage({
        type: 'roomData',
        room: {
          id: room.id,
          title: room.title,
          members: room.members.map(m => ({
            id: m.id,
            name: m.name,
            color: m.color,
            deskIndex: m.deskIndex,
            taskProgress: m.tasks.length > 0
              ? Math.round((m.tasks.filter(t => t.status === 'done').length / m.tasks.length) * 100)
              : 0,
          })),
        },
      }, '*')
    }

    // 监听场景就绪消息
    const readyHandler = (e: MessageEvent) => {
      if (e.data?.type === 'sceneReady') {
        sceneReady = true
        sendRoomData()
      }
    }

    window.addEventListener('message', readyHandler)

    // 主动轮询发送（以防 ready 消息丢失）
    const trySend = () => {
      if (sceneReady) return
      if (retries >= maxRetries) return
      retries++
      sendRoomData()
      if (!sceneReady) {
        setTimeout(trySend, 300)
      }
    }
    // 初次延迟 500ms 后开始尝试
    const initialTimer = setTimeout(trySend, 500)

    return () => {
      window.removeEventListener('message', readyHandler)
      clearTimeout(initialTimer)
    }
  }, [room])

  // 接收iframe消息
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'deskClick') {
        openTaskPanel(e.data.deskIndex)
      } else if (e.data.type === 'memberDrop') {
        handleMemberDrop(e.data.memberId, e.data.deskIndex)
      } else if (e.data.type === 'catClick') {
        setIsCatChatOpen(true)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [openTaskPanel, handleMemberDrop])

  // 没有房间则显示空状态
  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: 'var(--color-text-muted)' }}>未找到该学习室</p>
          <button onClick={() => navigate('/room')} className="btn-secondary">
            返回创建
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* 顶部栏 */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0 z-10"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--color-border-light)',
        }}
      >
        <button onClick={() => navigate('/room')} className="btn-ghost p-1.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm truncate">{room.title}</h2>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1"><Users size={12} />{room.members.length}人</span>
          </div>
        </div>

        {/* 视图切换 */}
        <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border-light)' }}>
          <button
            onClick={() => setViewMode('3d')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: viewMode === '3d' ? '#fff' : 'transparent',
              color: viewMode === '3d' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              boxShadow: viewMode === '3d' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Layout size={13} />
            <span>3D</span>
          </button>
          <button
            onClick={() => setViewMode('whiteboard')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: viewMode === 'whiteboard' ? '#fff' : 'transparent',
              color: viewMode === 'whiteboard' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'whiteboard' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <PenTool size={13} />
            <span>白板</span>
          </button>
          <button
            onClick={() => setViewMode('bookshelf')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: viewMode === 'bookshelf' ? '#fff' : 'transparent',
              color: viewMode === 'bookshelf' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'bookshelf' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <BookOpen size={13} />
            <span>书架</span>
          </button>
        </div>
        {/* 成员快捷头像 */}
        <div className="flex items-center gap-1">
          {room.members.map(m => (
            <button
              key={m.id}
              onClick={() => openTaskPanel(m.deskIndex)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:scale-110"
              style={{
                background: m.color,
                boxShadow: selectedDesk === m.deskIndex ? `0 0 0 3px ${m.color}40` : 'none',
              }}
              title={`${m.name} - 工位${DESK_POSITIONS[m.deskIndex]?.label ?? '?'}`}
            >
              {m.name[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区：3D 场景 或 白板 */}
      <div className="flex-1 flex relative overflow-hidden">
        {viewMode === '3d' ? (
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              src="/marvis-office-3d.html"
              title="3D 学习室"
              className="w-full h-full border-0"
            />
          </div>
        ) : viewMode === 'whiteboard' ? (
          <div className="flex-1">
            <Whiteboard roomId={room.id} members={room.members} />
          </div>
        ) : (
          <Bookshelf roomId={room.id} members={room.members} />
        )}

        {/* 任务面板 */}
        {activeMember && (
          <div
            className="w-80 flex-shrink-0 h-full overflow-y-auto shadow-lg animate-fade-in"
            style={{
              background: 'var(--color-card)',
              borderLeft: '1px solid var(--color-border-light)',
            }}
          >
            {/* 面板头部 */}
            <div className="sticky top-0 z-10 px-4 pt-4 pb-3"
              style={{ background: 'var(--color-card)', borderBottom: '1px dashed var(--color-border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: activeMember.color }}
                  >
                    {activeMember.name[0]}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{activeMember.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      工位 {DESK_POSITIONS[activeMember.deskIndex]?.label ?? '?'}
                    </div>
                  </div>
                </div>
                <button onClick={closeTaskPanel} className="btn-ghost p-1">
                  <X size={16} />
                </button>
              </div>
              {/* 进度条 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--color-text-muted)' }}>任务进度</span>
                  <span className="font-medium">
                    {activeMember.tasks.filter(t => t.status === 'done').length}/{activeMember.tasks.length}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${activeMember.tasks.length > 0
                        ? (activeMember.tasks.filter(t => t.status === 'done').length / activeMember.tasks.length) * 100
                        : 0}%`,
                      background: activeMember.color,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 任务列表 — 按日期分组 */}
            <div className="px-4 py-3 space-y-4">
              {groupTasksByDate(activeMember.tasks).map(group => (
                <div key={group.label}>
                  {/* 日期分组标签 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}>
                      {group.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--color-border-light)' }} />
                  </div>

                  {group.empty ? (
                    <p className="text-xs py-2 text-center italic" style={{ color: 'var(--color-text-muted)' }}>
                      暂无安排，放松一下~
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {group.tasks.map(task => {
                        const isEditing = editingNote?.taskId === task.id
                        return (
                          <div key={task.id}
                            className="sketch-card sketch-e p-3 transition-all duration-200"
                            style={{
                              borderLeft: task.status === 'done' ? `3px solid #10b981` :
                                          task.status === 'in_progress' ? `3px solid ${activeMember.color}` :
                                          '3px solid transparent',
                              opacity: task.status === 'done' ? 0.7 : 1,
                            }}
                          >
                            <div
                              className="flex items-start gap-2 cursor-pointer py-1 -ml-1 pl-1 rounded transition-colors hover:bg-black/5"
                              onClick={() => toggleTaskStatus(activeMember.id, task)}
                            >
                              <button className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110" type="button">
                                {task.status === 'done' ? (
                                  <CheckCircle size={18} style={{ color: '#10b981' }} />
                                ) : task.status === 'in_progress' ? (
                                  <Clock size={18} style={{ color: activeMember.color }} />
                                ) : (
                                  <Circle size={18} style={{ color: 'var(--color-text-muted)' }} />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm ${task.status === 'done' ? 'line-through' : ''}`}
                                  style={{ color: task.status === 'done' ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                                  {task.title}
                                </div>
                                {task.note && !isEditing && (
                                  <div className="mt-1 text-xs flex items-start gap-1 group"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                                    <span className="flex-1">{task.note}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingNote({ taskId: task.id, value: task.note || '' }) }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                  </div>
                                )}
                                {isEditing && (
                                  <div className="mt-1">
                                    <textarea
                                      value={editingNote?.value ?? ''}
                                      onChange={e => setEditingNote({ taskId: task.id, value: e.target.value })}
                                      className="w-full text-xs px-2 py-1 resize-none"
                                      rows={2}
                                      autoFocus
                                      placeholder="添加备注..."
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault()
                                          if (!room) return
                                          store.updateTaskNote(room.id, activeMember.id, task.id, editingNote?.value ?? '')
                                          setEditingNote(null)
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (!room) return
                                          store.updateTaskNote(room.id, activeMember.id, task.id, editingNote?.value ?? '')
                                          setEditingNote(null)
                                        }}
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{ background: `${activeMember.color}20`, color: activeMember.color }}
                                      >保存</button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditingNote(null) }}
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{ color: 'var(--color-text-muted)' }}
                                      >取消</button>
                                    </div>
                                  </div>
                                )}
                                {!task.note && !isEditing && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingNote({ taskId: task.id, value: '' }) }}
                                    className="mt-1 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--color-text-muted)' }}
                                  ><Edit3 size={11} /> 添加备注</button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              {activeMember.tasks.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                  <Target size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">还没有任务</p>
                  <p className="text-xs">在下方添加学习任务</p>
                </div>
              )}

              {/* 添加任务 — 带日期选择 */}
              <div className="pt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    placeholder="新任务..."
                    className="flex-1 text-xs px-3 py-1.5"
                    style={{
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-light)',
                      background: 'var(--color-bg)',
                      outline: 'none',
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addTaskWithDate(activeMember.id) }
                    }}
                  />
                  <button
                    onClick={() => addTaskWithDate(activeMember.id)}
                    disabled={!newTaskText.trim()}
                    className="btn-secondary text-xs px-2 py-1"
                    style={{ opacity: newTaskText.trim() ? 1 : 0.5 }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {/* 日期快捷切换 */}
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setNewTaskDate('today')}
                    className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                    style={{
                      background: newTaskDate === 'today' ? `${activeMember.color}20` : 'var(--color-bg-alt)',
                      color: newTaskDate === 'today' ? activeMember.color : 'var(--color-text-muted)',
                      border: `1px solid ${newTaskDate === 'today' ? activeMember : 'var(--color-border-light)'}`,
                    }}
                  >{`${new Date().getMonth() + 1}月${new Date().getDate()}日`}</button>
                  <button
                    onClick={() => setNewTaskDate('tomorrow')}
                    className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                    style={{
                      background: newTaskDate === 'tomorrow' ? `${activeMember.color}20` : 'var(--color-bg-alt)',
                      color: newTaskDate === 'tomorrow' ? activeMember.color : 'var(--color-text-muted)',
                      border: `1px solid ${newTaskDate === 'tomorrow' ? activeMember : 'var(--color-border-light)'}`,
                    }}
                  >{`${new Date(Date.now() + 86400000).getMonth() + 1}月${new Date(Date.now() + 86400000).getDate()}日`}</button>
                  <button
                    onClick={() => setNewTaskDate('custom')}
                    className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                    style={{
                      background: newTaskDate === 'custom' ? `${activeMember.color}20` : 'var(--color-bg-alt)',
                      color: newTaskDate === 'custom' ? activeMember.color : 'var(--color-text-muted)',
                      border: `1px solid ${newTaskDate === 'custom' ? activeMember : 'var(--color-border-light)'}`,
                    }}
                  >自定义</button>
                </div>
                {newTaskDate === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    className="w-full text-xs px-2 py-1"
                    style={{
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border-light)',
                      background: 'var(--color-bg)',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🐱 AI猫老师聊天面板 */}
      {isCatChatOpen && (
        <div
          className="fixed bottom-20 right-5 z-[100] w-80 h-96 flex flex-col overflow-hidden animate-fade-in"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border-light)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          {/* 聊天头部 — 简洁白底 */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{
              background: 'var(--color-card)',
              borderBottom: '1px solid var(--color-border-light)',
            }}
          >
            <div className="relative">
              <span className="text-2xl">🐱</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                橘橘
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>AI 猫老师</div>
            </div>
            <button
              onClick={() => setIsCatChatOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 消息列表 */}
          <div
            ref={catChatRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ background: 'var(--color-bg)' }}
          >
            {catMessages.length === 0 && (
              <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
                <span className="text-4xl block mb-3">🐱</span>
                <p className="text-sm">喵~我是橘橘！</p>
                <p className="text-xs mt-1">有问题直接问我吧~</p>
              </div>
            )}
            {catMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? 'var(--color-text-primary)' : '#fff',
                    color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {catLoading && catMessages[catMessages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{
                    background: '#fff',
                    borderRadius: '16px 16px 16px 4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <span className="text-sm">🐱</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>正在思考...</span>
                </div>
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div
            className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
            style={{ 
              borderTop: '1px solid var(--color-border-light)', 
              background: 'var(--color-card)'
            }}
          >
            <input
              type="text"
              value={catInput}
              onChange={e => setCatInput(e.target.value)}
              placeholder="问点什么..."
              className="flex-1 text-sm px-4 py-2"
              style={{
                borderRadius: '20px',
                border: '1px solid var(--color-border-light)',
                background: 'var(--color-bg)',
                outline: 'none',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendCatMessage()
                }
              }}
            />
            <button
              onClick={sendCatMessage}
              disabled={!catInput.trim() || catLoading}
              className="p-2.5 rounded-full transition-all duration-200"
              style={{
                background: catInput.trim() && !catLoading ? 'var(--color-text-primary)' : '#f3f4f6',
                color: catInput.trim() && !catLoading ? '#fff' : '#9ca3af',
                opacity: catInput.trim() && !catLoading ? 1 : 0.7,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 全部成员概览条 */}
      <div
        className="flex-shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto"
        style={{
          background: 'var(--color-bg)',
          borderTop: '1px dashed var(--color-border-light)',
        }}
      >
        {room.members.map(m => {
          const doneCount = m.tasks.filter(t => t.status === 'done').length
          const totalCount = m.tasks.length
          return (
            <button
              key={m.id}
              onClick={() => openTaskPanel(m.deskIndex)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 flex-shrink-0"
              style={{
                background: selectedDesk === m.deskIndex ? `${m.color}20` : 'transparent',
                border: `1px solid ${selectedDesk === m.deskIndex ? m.color : 'var(--color-border-light)'}`,
              }}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: m.color }}>
                {m.name[0]}
              </span>
              <span className="font-medium">{m.name}</span>
              {totalCount > 0 && (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {doneCount}/{totalCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 🐱 猫按钮 — 面板关闭时显示 */}
      {!isCatChatOpen && (
        <button
          onClick={() => setIsCatChatOpen(true)}
          className="fixed bottom-5 right-5 z-[99] w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110"
          style={{
            background: '#fff',
            border: '1px solid var(--color-border-light)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}
          title="找橘橘问问题"
        >
          🐱
        </button>
      )}

    </div>
  )
}
