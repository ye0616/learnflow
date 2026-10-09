import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus, Trash2, Users, Target, ArrowRight, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { useRoomStore } from '../store/roomStore'
import { PRESET_MEMBERS, TASK_TEMPLATES } from '../utils/roomMockData'
import { RoomMember, MemberTask, DESK_POSITIONS } from '../types'

const MEMBER_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#06b6d4']

export default function RoomCreatePage() {
  const navigate = useNavigate()
  const createRoom = useRoomStore(s => s.createRoom)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<RoomMember[]>([])
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [customMembers, setCustomMembers] = useState<RoomMember[]>([])

  // 新建成员
  const createMember = () => {
    const name = newMemberName.trim()
    if (!name || selectedMembers.length >= 6) return
    const newMember: RoomMember = {
      id: `custom-${Date.now()}`,
      name,
      color: MEMBER_COLORS[(PRESET_MEMBERS.length + customMembers.length) % MEMBER_COLORS.length],
      tasks: [],
      deskIndex: selectedMembers.length,
    }
    setCustomMembers(prev => [...prev, newMember])
    setSelectedMembers(prev => [...prev, newMember])
    setNewMemberName('')
  }

  // 切换选择成员
  const toggleMember = (member: RoomMember) => {
    setSelectedMembers(prev => {
      const exists = prev.find(m => m.id === member.id)
      if (exists) return prev.filter(m => m.id !== member.id)
      if (prev.length >= 6) return prev
      return [...prev, {
        ...member,
        color: MEMBER_COLORS[prev.length % MEMBER_COLORS.length],
        tasks: [],
        deskIndex: prev.length,
      }]
    })
  }

  // 添加任务
  const addTask = (memberId: string) => {
    const text = newTaskText.trim()
    if (!text) return
    setSelectedMembers(prev =>
      prev.map(m =>
        m.id === memberId
          ? { ...m, tasks: [...m.tasks, { id: `new-${Date.now()}`, title: text, status: 'todo' as const }] }
          : m
      )
    )
    setNewTaskText('')
  }

  // 移除任务
  const removeTask = (memberId: string, taskId: string) => {
    setSelectedMembers(prev =>
      prev.map(m =>
        m.id === memberId
          ? { ...m, tasks: m.tasks.filter(t => t.id !== taskId) }
          : m
      )
    )
  }

  // 快速添加模板任务
  const addTemplateTask = (memberId: string, taskTitle: string) => {
    setSelectedMembers(prev =>
      prev.map(m =>
        m.id === memberId
          ? { ...m, tasks: [...m.tasks, { id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, title: taskTitle, status: 'todo' as const }] }
          : m
      )
    )
  }

  // 创建房间
  const handleCreate = () => {
    if (!title.trim() || selectedMembers.length === 0) return
    const room = createRoom(title.trim(), description.trim(), selectedMembers)
    navigate(`/room/${room.id}`)
  }

  const canCreate = title.trim() && selectedMembers.length > 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 标题区 */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-sketch mb-2" style={{ fontSize: '2rem' }}>
            <span className="sketch-underline">创建小组自习室</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            设定项目主题，邀请成员，分配任务 —— 然后一起进入3D学习空间
          </p>
        </div>

        {/* 项目信息 */}
        <div className="sketch-card sketch-a wc-blue mb-6 animate-stagger animate-stagger-delay-1">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} style={{ color: 'var(--color-accent)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--color-text-secondary)' }}>项目信息</span>
          </div>
          <label className="block mb-3">
            <span className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>项目主题 *</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：React 官网重构、数据分析期末项目..."
              className="w-full px-4 py-3 text-sm"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>项目简介</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简要描述本次自习的目标..."
              className="w-full px-4 py-3 text-sm resize-none"
              rows={2}
            />
          </label>
        </div>

        {/* 选择成员 */}
        <div className="sketch-card sketch-b wc-green mb-6 animate-stagger animate-stagger-delay-2">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} style={{ color: 'var(--color-accent)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              选择成员（{selectedMembers.length}/6）
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_MEMBERS.map(member => {
              const selected = selectedMembers.some(m => m.id === member.id)
              return (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border"
                  style={{
                    borderColor: selected ? member.color : 'var(--color-border)',
                    background: selected ? `${member.color}12` : 'var(--color-card)',
                    color: selected ? member.color : 'var(--color-text-secondary)',
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: member.color }}
                  >
                    {member.name[0]}
                  </span>
                  <span className="flex-1 text-left truncate">{member.name}</span>
                  {selected && <Check size={14} />}
                </button>
              )
            })}
            {customMembers.map(member => {
              const selected = selectedMembers.some(m => m.id === member.id)
              return (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border"
                  style={{
                    borderColor: selected ? member.color : 'var(--color-border)',
                    background: selected ? `${member.color}12` : 'var(--color-card)',
                    color: selected ? member.color : 'var(--color-text-secondary)',
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: member.color }}
                  >
                    {member.name[0]}
                  </span>
                  <span className="flex-1 text-left truncate">{member.name}</span>
                  {selected && <Check size={14} />}
                </button>
              )
            })}
            {/* 新建成员按钮 */}
            {selectedMembers.length < 6 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="新建成员"
                  className="flex-1 text-sm bg-transparent border-0 outline-none"
                  style={{ color: 'var(--color-text-primary)', minWidth: 0 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      createMember()
                    }
                  }}
                />
                <button
                  onClick={createMember}
                  disabled={!newMemberName.trim()}
                  className="p-1 rounded transition-colors flex-shrink-0"
                  style={{ opacity: newMemberName.trim() ? 1 : 0.3, color: 'var(--color-accent)' }}
                >
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 任务分配 */}
        {selectedMembers.length > 0 && (
          <div
            className="sketch-card sketch-c wc-warm mb-6 animate-stagger animate-stagger-delay-3"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} style={{ color: 'var(--color-accent)' }} />
              <span className="font-medium text-sm" style={{ color: 'var(--color-text-secondary)' }}>任务分配</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                — 为每个成员设定学习任务
              </span>
            </div>

            {selectedMembers.map((member, mi) => (
              <div
                key={member.id}
                className="mb-3 last:mb-0 p-4 rounded-lg"
                style={{
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border-light)',
                  borderLeft: `3px solid ${member.color}`,
                }}
              >
                {/* 成员头部 */}
                <button
                  onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: member.color }}
                  >
                    {member.name[0]}
                  </span>
                  <span className="font-medium text-sm flex-1">{member.name}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    工位 {DESK_POSITIONS[mi]?.label ?? '?'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{
                    background: `${member.color}18`,
                    color: member.color,
                  }}>
                    {member.tasks.length} 项任务
                  </span>
                  {expandedMember === member.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* 展开任务详情 */}
                {expandedMember === member.id && (
                  <div className="mt-3 pl-9 animate-fade-in">
                    {/* 已有任务列表 */}
                    {member.tasks.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {member.tasks.map(task => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm group"
                            style={{ background: 'var(--color-card)' }}
                          >
                            <span className="flex-1 truncate">{task.title}</span>
                            <button
                              onClick={() => removeTask(member.id, task.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            >
                              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 快速模板 */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {TASK_TEMPLATES.filter(t => !member.tasks.some(mt => mt.title === t)).map(t => (
                        <button
                          key={t}
                          onClick={() => addTemplateTask(member.id, t)}
                          className="text-xs px-2 py-1 rounded border transition-all duration-200"
                          style={{
                            borderColor: 'var(--color-border-light)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          + {t}
                        </button>
                      ))}
                    </div>

                    {/* 添加自定义任务 */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        placeholder="输入任务名称..."
                        className="flex-1 px-3 py-1.5 text-sm"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(member.id) } }}
                      />
                      <button
                        onClick={() => addTask(member.id)}
                        disabled={!newTaskText.trim()}
                        className="btn-secondary text-xs px-3 py-1.5"
                        style={{ opacity: newTaskText.trim() ? 1 : 0.5 }}
                      >
                        <Plus size={14} /> 添加
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 创建按钮 */}
        <div className="flex justify-end gap-3 animate-stagger animate-stagger-delay-4">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="btn-primary text-sm px-6"
            style={{ opacity: canCreate ? 1 : 0.5 }}
          >
            <Sparkles size={16} />
            开始自习
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
