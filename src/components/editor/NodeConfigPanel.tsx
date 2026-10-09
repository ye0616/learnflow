import { useState, useEffect } from 'react'
import { FlowNodeData, NodeType, RecommendationItem } from '../../types'
import {
  BookOpen, Dumbbell, ClipboardCheck, Code2, Sparkles,
  X, Save, ExternalLink, Tag, AlignLeft, Lightbulb,
  Globe, Play, GraduationCap, Wrench, Plus, Trash2
} from 'lucide-react'

// 推荐类型配置
const REC_TYPE_CONFIG: Record<RecommendationItem['type'], { label: string; icon: React.ReactNode; color: string }> = {
  book: { label: '书籍', icon: <BookOpen size={12} strokeWidth={2} />, color: '#8B6F47' },
  website: { label: '网站', icon: <Globe size={12} strokeWidth={2} />, color: '#4A90D9' },
  video: { label: '视频', icon: <Play size={12} strokeWidth={2} />, color: '#E74C3C' },
  course: { label: '课程', icon: <GraduationCap size={12} strokeWidth={2} />, color: '#9B59B6' },
  tool: { label: '工具', icon: <Wrench size={12} strokeWidth={2} />, color: '#2ECC71' },
  other: { label: '其他', icon: <Lightbulb size={12} strokeWidth={2} />, color: '#F39C12' },
}

const NODE_TYPE_OPTIONS: { type: NodeType; label: string; accent: string; accentLight: string; icon: React.ReactNode }[] = [
  { type: 'knowledge', label: '知识节点', accent: '#A8C0D0', accentLight: '#D8E8F0', icon: <BookOpen size={14} strokeWidth={2} /> },
  { type: 'practice',  label: '练习节点', accent: '#8FB89A', accentLight: '#D0E8D8', icon: <Dumbbell size={14} strokeWidth={2} /> },
  { type: 'quiz',       label: '测验节点', accent: '#C89080', accentLight: '#F0D8D0', icon: <ClipboardCheck size={14} strokeWidth={2} /> },
  { type: 'project',    label: '项目节点', accent: '#A098B8', accentLight: '#D0C8E8', icon: <Code2 size={14} strokeWidth={2} /> },
  { type: 'custom',     label: '自定义节点', accent: '#B8A0D0', accentLight: '#E0D8F0', icon: <Sparkles size={14} strokeWidth={2} /> },
]

const STATUS_COLORS = {
  not_started: { selected: '#C5BAA8', bg: 'var(--color-bg-alt)', border: 'var(--color-sketch)' },
  in_progress: { selected: '#C9A46A', bg: '#FDF4E8', border: '#EDD5A8' },
  completed: { selected: '#5A9E7A', bg: '#E8F4EC', border: '#B5D9C4' },
} as const

interface NodeConfigPanelProps {
  node: FlowNodeData | null
  onClose: () => void
  onSave: (data: Partial<FlowNodeData>) => void
}

export default function NodeConfigPanel({ node, onClose, onSave }: NodeConfigPanelProps) {
  const [form, setForm] = useState<Partial<FlowNodeData>>(node || {})
  const [editingRecIdx, setEditingRecIdx] = useState<number | null>(null)

  // 当切换节点时同步更新表单
  useEffect(() => {
    setForm(node || {})
    setEditingRecIdx(null)
  }, [node?.id])

  if (!node) return null

  const handleSave = () => {
    onSave(form)
    onClose()
  }

  // 手绘风格输入框基础样式
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    border: '1.5px solid var(--color-sketch)',
    borderRadius: 'var(--radius-sketch-e)',
    background: 'var(--color-card)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
    fontFamily: "'Inter', 'PingFang SC', system-ui, sans-serif",
  }

  const sectionBase: React.CSSProperties = {
    padding: 12,
    borderRadius: 'var(--radius-sketch-c)',
    background: 'var(--color-bg-alt)',
    border: '1.5px solid var(--color-sketch)',
    boxShadow: '2px 3px 0 rgba(160,140,110,0.06)',
  }

  return (
    <div
      className="w-80 flex flex-col h-full"
      style={{ background: 'var(--color-card)', borderLeft: '1.5px solid var(--color-sketch)' }}
    >
      {/* 标题栏 — 手绘风格 */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '2px dashed var(--color-sketch)' }}
      >
        <h3 className="font-sketch text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>节点配置</h3>
        <button
          onClick={onClose}
          className="btn-ghost p-1.5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 节点类型 */}
        <div style={sectionBase}>
          <label className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <AlignLeft size={12} strokeWidth={2} />
            节点类型
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {NODE_TYPE_OPTIONS.map(({ type, label, accent, accentLight, icon }) => {
              const isSelected = form.type === type
              return (
                <button
                  key={type}
                  onClick={() => setForm(prev => ({ ...prev, type }))}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    border: `1.5px solid ${isSelected ? accent : 'var(--color-sketch)'}`,
                    background: isSelected ? accentLight : 'var(--color-card)',
                    color: isSelected ? accent : 'var(--color-text-muted)',
                    borderRadius: 'var(--radius-sketch-e)',
                    transform: isSelected ? 'rotate(-0.3deg)' : 'rotate(0deg)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = accent
                      e.currentTarget.style.background = accentLight
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-sketch)'
                      e.currentTarget.style.background = 'var(--color-card)'
                    }
                  }}
                >
                  <span style={{ color: isSelected ? accent : 'var(--color-text-muted)' }}>{icon}</span>
                  <span>{label}</span>
                  {isSelected && (
                    <span className="ml-auto text-sm font-bold" style={{ color: accent }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 节点名称 */}
        <div style={sectionBase}>
          <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <AlignLeft size={12} strokeWidth={2} />
            节点名称
          </label>
          <input
            type="text"
            value={form.label || ''}
            onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
            placeholder="输入节点名称..."
            style={inputBase}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.boxShadow = '2px 3px 0 rgba(184,149,106,0.1)'
              e.currentTarget.style.transform = 'rotate(-0.2deg)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-sketch)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'rotate(0deg)'
            }}
          />
        </div>

        {/* 描述 */}
        <div style={sectionBase}>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>描述</label>
          <textarea
            value={form.description || ''}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="简要描述这个节点的学习内容..."
            rows={3}
            style={{ ...inputBase, resize: 'none', minHeight: 60 }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.boxShadow = '2px 3px 0 rgba(184,149,106,0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-sketch)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* 推荐资料 */}
        <div style={sectionBase}>
          <label className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <Lightbulb size={12} strokeWidth={2} />
            推荐资料
          </label>

          {/* 推荐列表 */}
          {form.recommendations && form.recommendations.length > 0 ? (
            <div className="space-y-2 mb-3">
              {(form.recommendations as RecommendationItem[]).map((rec, idx) => {
                const conf = REC_TYPE_CONFIG[rec.type] || REC_TYPE_CONFIG.other
                const isEditing = editingRecIdx === idx
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg"
                    style={{
                      background: 'var(--color-card)',
                      border: `1.5px solid ${isEditing ? conf.color : 'var(--color-sketch)'}`,
                      borderRadius: 'var(--radius-sketch-c)',
                      boxShadow: isEditing ? `2px 3px 0 ${conf.color}20` : 'none',
                    }}
                  >
                    {isEditing ? (
                      // 编辑模式
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={rec.type}
                            onChange={(e) => {
                              const recs = [...(form.recommendations as RecommendationItem[])]
                              recs[idx] = { ...recs[idx], type: e.target.value as RecommendationItem['type'] }
                              setForm(prev => ({ ...prev, recommendations: recs }))
                            }}
                            style={{
                              ...inputBase,
                              padding: '4px 8px',
                              fontSize: 12,
                              flex: '0 0 auto',
                              width: 80,
                            }}
                          >
                            {Object.entries(REC_TYPE_CONFIG).map(([type, { label }]) => (
                              <option key={type} value={type}>{label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingRecIdx(null)}
                            className="btn-ghost p-0.5 ml-auto"
                            style={{ color: conf.color }}
                          >
                            <Save size={12} strokeWidth={2} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={rec.title}
                          onChange={(e) => {
                            const recs = [...(form.recommendations as RecommendationItem[])]
                            recs[idx] = { ...recs[idx], title: e.target.value }
                            setForm(prev => ({ ...prev, recommendations: recs }))
                          }}
                          placeholder="标题"
                          style={{ ...inputBase, padding: '6px 10px', fontSize: 12 }}
                        />
                        <input
                          type="text"
                          value={rec.url || ''}
                          onChange={(e) => {
                            const recs = [...(form.recommendations as RecommendationItem[])]
                            recs[idx] = { ...recs[idx], url: e.target.value || undefined }
                            setForm(prev => ({ ...prev, recommendations: recs }))
                          }}
                          placeholder="链接（可选）"
                          style={{ ...inputBase, padding: '6px 10px', fontSize: 12 }}
                        />
                        <input
                          type="text"
                          value={rec.description || ''}
                          onChange={(e) => {
                            const recs = [...(form.recommendations as RecommendationItem[])]
                            recs[idx] = { ...recs[idx], description: e.target.value || undefined }
                            setForm(prev => ({ ...prev, recommendations: recs }))
                          }}
                          placeholder="说明（可选）"
                          style={{ ...inputBase, padding: '6px 10px', fontSize: 12 }}
                        />
                      </div>
                    ) : (
                      // 查看模式
                      <div className="flex items-start gap-2">
                        <span
                          className="inline-flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: `${conf.color}15`,
                            border: `1.5px solid ${conf.color}40`,
                            color: conf.color,
                          }}
                        >
                          {conf.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold" style={{ color: conf.color }}>{conf.label}</span>
                            {rec.url && (
                              <a
                                href={rec.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5"
                                style={{ color: conf.color, opacity: 0.7 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={10} strokeWidth={2} />
                              </a>
                            )}
                          </div>
                          <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                            {rec.title}
                          </div>
                          {rec.description && (
                            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                              {rec.description}
                            </div>
                          )}
                          {rec.url && (
                            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-accent)', opacity: 0.8 }}>
                              {rec.url}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => setEditingRecIdx(idx)}
                            className="btn-ghost p-0.5"
                            style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
                          >
                            <ExternalLink size={12} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => {
                              const recs = [...(form.recommendations as RecommendationItem[])]
                              recs.splice(idx, 1)
                              setForm(prev => ({ ...prev, recommendations: recs }))
                              setEditingRecIdx(null)
                            }}
                            className="btn-ghost p-0.5"
                            style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
                          >
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
              暂无推荐资料，AI 生成时会自动填充
            </div>
          )}

          {/* 添加推荐按钮 */}
          <button
            onClick={() => {
              const recs = [...(form.recommendations as RecommendationItem[] || [])]
              recs.push({ type: 'other', title: '', description: '' })
              setForm(prev => ({ ...prev, recommendations: recs }))
              setEditingRecIdx(recs.length - 1)
            }}
            className="btn-ghost w-full justify-center text-xs py-1.5"
            style={{ border: '1.5px dashed var(--color-sketch)', borderRadius: 'var(--radius-sketch-c)' }}
          >
            <Plus size={12} strokeWidth={2} />
            添加推荐
          </button>
        </div>
        
        {/* 标签 */}
        <div style={sectionBase}>
          <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <Tag size={12} strokeWidth={2} />
            标签（逗号分隔）
          </label>
          <input
            type="text"
            value={(form.tags || []).join(', ')}
            onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
            placeholder="如：Python基础, 重要"
            style={inputBase}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.boxShadow = '2px 3px 0 rgba(184,149,106,0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-sketch)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* 状态 */}
        <div style={sectionBase}>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>当前状态</label>
          <div className="grid grid-cols-3 gap-2">
            {(['not_started', 'in_progress', 'completed'] as const).map((s) => {
              const isSelected = form.status === s
              const col = STATUS_COLORS[s]
              return (
                <button
                  key={s}
                  onClick={() => setForm(prev => ({
                    ...prev,
                    status: s,
                    progress: s === 'completed' ? 100 : s === 'not_started' ? 0 : prev.progress
                  }))}
                  className="px-2 py-1.5 text-xs font-medium transition-all duration-200"
                  style={{
                    border: `1.5px solid ${isSelected ? col.selected : 'var(--color-sketch)'}`,
                    background: isSelected ? col.bg : 'var(--color-card)',
                    color: isSelected ? col.selected : 'var(--color-text-muted)',
                    borderRadius: 'var(--radius-sketch-e)',
                    transform: isSelected ? 'rotate(-0.3deg)' : 'rotate(0deg)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = col.selected
                      e.currentTarget.style.background = col.bg
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-sketch)'
                      e.currentTarget.style.background = 'var(--color-card)'
                    }
                  }}
                >
                  {s === 'not_started' ? '未开始' : s === 'in_progress' ? '进行中' : '已完成'}
                  {isSelected && <span className="ml-0.5 font-bold text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 进度滑块 */}
        {form.status === 'in_progress' && (
          <div style={sectionBase}>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
              完成进度：{form.progress || 0}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress || 0}
              onChange={(e) => setForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
              className="w-full"
              style={{ accentColor: '#C9A46A' }}
            />
          </div>
        )}
      </div>

      {/* 保存按钮 — 手绘风格 */}
      <div className="p-4" style={{ borderTop: '2px dashed var(--color-sketch)' }}>
        <button
          onClick={handleSave}
          className="btn-primary w-full justify-center text-sm py-2.5"
        >
          <Save size={15} strokeWidth={2} />
          保存修改
        </button>
      </div>
    </div>
  )
}
