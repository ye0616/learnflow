import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { LearningFlow, NodeType } from '../types'
import { DEMO_FLOWS } from '../utils/mockData'
import {
  Plus, Edit3, Copy, Trash2, GitBranch, Clock, Tag,
  Eye, Lock, Search, Download, Upload, AlertTriangle,
  ArrowUpDown, X, ChevronRight, Sparkles
} from 'lucide-react'

const COVER_COLORS = ['#A07240', '#5A9E7A', '#8B6FAA', '#C06050', '#4A8FAA', '#C4955A', '#7A9A5A']

const SKETCH_VARIANTS = ['sketch-a', 'sketch-b', 'sketch-c', 'sketch-d', 'sketch-e'] as const

const modalStyle: React.CSSProperties = {
  background: 'var(--color-card)',
  border: '1.5px solid var(--color-sketch)',
  borderRadius: 'var(--radius-sketch-a)',
  boxShadow: '3px 5px 0 rgba(160, 140, 110, 0.12)',
}

function CreateFlowModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { addFlow } = useAppStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  const handleCreate = () => {
    if (!title.trim()) return
    const flow: LearningFlow = {
      id: `flow-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      nodes: [],
      edges: [],
      totalEstimatedTime: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      versions: [],
    }
    addFlow(flow)
    navigate(`/editor?id=${flow.id}&new=true`)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="sketch-a p-6 max-w-md w-full mx-4 animate-fade-in" style={modalStyle}>
        {/* 手绘波浪装饰线 */}
        <svg className="w-full h-2 mb-4 -mt-1" viewBox="0 0 400 8" preserveAspectRatio="none">
          <path d="M0 4 Q50 0 100 4 T200 4 T300 4 T400 4" fill="none" stroke="var(--color-sketch)" strokeWidth="1.5" strokeDasharray="6 3" />
        </svg>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-sketch" style={{ color: 'var(--color-text-primary)' }}>创建新学习流</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-sketch mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>标题 *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="如：机器学习入门"
              className="w-full px-3 py-2.5 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <label className="text-xs font-sketch mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简要描述学习目标和内容..."
              rows={2}
              className="w-full px-3 py-2.5 text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-sketch mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>标签（逗号分隔）</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="如：Python, 数据分析"
              className="w-full px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">取消</button>
          <button onClick={handleCreate} disabled={!title.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
            <Plus size={14} /> 创建
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ flow, onClose }: { flow: LearningFlow; onClose: () => void }) {
  const { deleteFlow } = useAppStore()

  const handleDelete = () => {
    deleteFlow(flow.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="sketch-b p-6 max-w-sm w-full mx-4 animate-fade-in" style={modalStyle}>
        {/* 手绘涂鸦警告图标 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="sketch-circle w-10 h-10" style={{ background: '#FAEAE8' }}>
            <AlertTriangle size={20} style={{ color: '#C06050' }} />
          </div>
          <div>
            <h3 className="font-sketch text-base" style={{ color: 'var(--color-text-primary)' }}>确认删除</h3>
            <p className="text-xs font-sketch" style={{ color: 'var(--color-text-muted)' }}>此操作不可撤销</p>
          </div>
        </div>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          确定要删除 <span className="font-sketch" style={{ color: 'var(--color-text-primary)' }}>「{flow.title}」</span> 吗？
        </p>
        <p className="text-xs mb-5 font-sketch" style={{ color: 'var(--color-text-muted)' }}>
          {flow.nodes.length > 0 && `包含 ${flow.nodes.length} 个节点和 ${flow.edges.length} 条连线`}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">取消</button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2 text-white text-sm font-medium transition-all duration-200 justify-center flex items-center gap-1.5"
            style={{
              background: '#C06050',
              borderRadius: 'var(--radius-sketch-c)',
              border: '1.5px solid #A04040',
              boxShadow: '2px 3px 0 rgba(160, 100, 100, 0.2)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px) rotate(0.5deg)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'none'
            }}
          >
            <Trash2 size={14} /> 删除
          </button>
        </div>
      </div>
    </div>
  )
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { importFlow } = useAppStore()
  const navigate = useNavigate()
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText)
      if (!data.title && !data.nodes) {
        setError('JSON 格式不正确，需要包含 title 或 nodes 字段')
        return
      }
      const flow = importFlow(data)
      navigate(`/editor?id=${flow.id}`)
      onClose()
    } catch {
      setError('JSON 解析失败，请检查格式')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="sketch-c p-6 max-w-lg w-full mx-4 animate-fade-in" style={modalStyle}>
        {/* 手绘波浪装饰线 */}
        <svg className="w-full h-2 mb-3 -mt-1" viewBox="0 0 400 8" preserveAspectRatio="none">
          <path d="M0 4 Q50 8 100 4 T200 4 T300 4 T400 4" fill="none" stroke="var(--color-sketch)" strokeWidth="1.5" strokeDasharray="6 3" />
        </svg>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-sketch flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Upload size={18} /> 导入学习流
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm mb-3 font-sketch" style={{ color: 'var(--color-text-muted)' }}>粘贴之前导出的 JSON 数据来导入学习流</p>
        <textarea
          value={jsonText}
          onChange={e => { setJsonText(e.target.value); setError('') }}
          placeholder='粘贴 JSON 数据...'
          rows={8}
          className="w-full px-3 py-2.5 text-sm font-mono resize-none"
          style={{ borderRadius: 'var(--radius-sketch-d)' }}
        />
        {error && <p className="text-xs mt-1.5 font-sketch" style={{ color: '#C06050' }}>{error}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">取消</button>
          <button onClick={handleImport} disabled={!jsonText.trim()} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
            <Upload size={14} /> 导入
          </button>
        </div>
      </div>
    </div>
  )
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  knowledge: '知识', practice: '练习', quiz: '测验', project: '项目', custom: '自定义'
}

export default function MyFlowsPage() {
  const navigate = useNavigate()
  const { flows, updateFlow } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LearningFlow | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'progress'>('updated')
  const [toastMessage, setToastMessage] = useState('')

  // 合并 store 中的 flows + demo flows
  const allFlows: LearningFlow[] = [...DEMO_FLOWS, ...flows.filter(f => !DEMO_FLOWS.find(d => d.id === f.id))]

  const filteredFlows = allFlows
    .filter(f => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return f.title.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.tags?.some(t => t.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      if (sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return b.progress - a.progress
    })

  const handleCopy = (flow: LearningFlow) => {
    const { duplicateFlow } = useAppStore.getState()
    const newFlow = duplicateFlow(flow.id)
    if (newFlow) navigate(`/editor?id=${newFlow.id}`)
  }

  const handleExport = (flow: LearningFlow) => {
    const { exportFlowData } = useAppStore.getState()
    const data = exportFlowData(flow.id)
    if (!data) return
    const text = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage('已复制到剪贴板！')
    })
  }

  const handleTogglePublic = (flow: LearningFlow) => {
    updateFlow(flow.id, { isPublic: !flow.isPublic })
  }

  const formatTimeStr = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const countNodesByType = (nodes: LearningFlow['nodes']) => {
    const counts: Record<string, number> = {}
    nodes.forEach(n => {
      const t = n.data?.type
      if (t) counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      {/* 顶部工具栏 */}
      <div
        className="px-6 py-4 flex flex-col gap-4 flex-shrink-0"
        style={{
          background: 'var(--color-card)',
          borderBottom: '1.5px dashed var(--color-sketch)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-sketch" style={{ color: 'var(--color-text-primary)' }}>
              <span className="sketch-underline">我的学习流</span>
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>管理你的所有学习路径，或创建新计划</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="btn-secondary text-sm"
            >
              <Upload size={15} /> 导入
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary text-sm"
            >
              <Plus size={16} /> 创建学习流
            </button>
          </div>
        </div>

        {/* 搜索和排序栏 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索学习流..."
              className="w-full pl-9 pr-4 py-2 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}
          </div>
          {/* 排序按钮组 — 手绘圆角 */}
          <div
            className="flex items-center gap-0.5 p-0.5"
            style={{
              background: 'var(--color-bg-alt)',
              borderRadius: 'var(--radius-sketch-c)',
              border: '1.5px solid var(--color-sketch)',
            }}
          >
            {([
              { key: 'updated' as const, label: '最近更新' },
              { key: 'created' as const, label: '创建时间' },
              { key: 'progress' as const, label: '完成度' },
            ]).map(({ key, label }, i) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className="px-3 py-1.5 text-xs font-sketch transition-all duration-200"
                style={{
                  background: sortBy === key ? 'var(--color-card)' : 'transparent',
                  color: sortBy === key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  boxShadow: sortBy === key ? '2px 3px 0 rgba(42,30,15,0.08)' : 'none',
                  borderRadius: SKETCH_VARIANTS[i],
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 流列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredFlows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {/* 手绘涂鸦装饰空状态 */}
            <div className="relative mb-6">
              <div className="sketch-circle w-24 h-24 animate-float" style={{ background: 'var(--color-bg-alt)' }}>
                <GitBranch size={36} style={{ color: 'var(--color-sketch)' }} />
              </div>
              {/* 涂鸦装饰小圆点 */}
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-wobble" style={{ background: 'var(--color-accent-light)', opacity: 0.5 }} />
              <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full" style={{ background: 'var(--color-sketch)', opacity: 0.4, borderRadius: '45% 55% 40% 60%' }} />
              <svg className="absolute -top-5 -left-4 w-10 h-6" viewBox="0 0 40 20" fill="none">
                <path d="M2 10 Q10 2 20 10 T38 10" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-sketch mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {searchQuery ? '没有找到匹配的学习流' : '还没有学习流'}
            </h3>
            <p className="text-sm mb-5 font-sketch" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? '试试其他关键词' : '创建你的第一个学习流，开始系统化学习'}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Sparkles size={16} /> 创建第一个学习流
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFlows.map((flow, index) => {
              const nodeCounts = countNodesByType(flow.nodes)
              const totalEstHours = flow.totalEstimatedTime ? Math.round(flow.totalEstimatedTime / 60) : 0
              const sketchVariant = SKETCH_VARIANTS[index % SKETCH_VARIANTS.length]

              return (
                <div
                  key={flow.id}
                  className={`sketch-card ${sketchVariant} group cursor-pointer overflow-hidden`}
                  style={{ padding: 0 }}
                  onClick={() => navigate(`/editor?id=${flow.id}`)}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = `translateY(-3px) rotate(${(index % 2 === 0 ? -0.4 : 0.3)}deg)`
                    el.style.boxShadow = '4px 6px 0 rgba(160, 140, 110, 0.15)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = 'none'
                    el.style.boxShadow = '2px 3px 0 rgba(160, 140, 110, 0.08)'
                  }}
                >
                  {/* 封面色条 — 纯色填充 */}
                  <div style={{ height: '8px', width: '100%', background: flow.coverColor || 'var(--color-accent)', opacity: 0.85 }} />

                  <div className="p-4">
                    {/* 标题行 */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-sketch text-base leading-snug line-clamp-2 flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                        {flow.title}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(flow) }}
                          className="p-1.5 transition-all duration-200"
                          style={{ color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sketch-e)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          title="复制"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExport(flow) }}
                          className="p-1.5 transition-all duration-200"
                          style={{ color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sketch-e)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          title="导出 JSON"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(flow) }}
                          className="p-1.5 transition-all duration-200"
                          style={{ color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sketch-e)' }}
                          onMouseEnter={e => { (e.currentTarget.style.background = '#FAEAE8'); (e.currentTarget.style.color = '#C06050') }}
                          onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = 'var(--color-text-muted)'); }}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* 描述 */}
                    {flow.description && (
                      <p className="text-xs line-clamp-2 mb-3 font-sketch" style={{ color: 'var(--color-text-muted)' }}>{flow.description}</p>
                    )}

                    {/* 手绘虚线分隔 */}
                    <svg className="w-full mb-3" viewBox="0 0 300 4" preserveAspectRatio="none" style={{ height: '4px', display: 'block', opacity: 0.4 }}>
                      <path d="M0 2 Q37 0 75 2 T150 2 T225 2 T300 2" fill="none" stroke="var(--color-sketch)" strokeWidth="1" strokeDasharray="5 4" strokeLinecap="round" />
                    </svg>

                    {/* 进度条 */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1 font-sketch">
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {flow.nodes.length} 个节点
                          {totalEstHours > 0 && <span> · {totalEstHours}h</span>}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--color-accent)' }}>{flow.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${flow.progress}%`, background: flow.coverColor || 'var(--color-accent)' }}
                        />
                      </div>
                    </div>

                    {/* 节点类型统计 — 手绘标签 */}
                    {Object.keys(nodeCounts).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {(Object.entries(nodeCounts) as [NodeType, number][]).map(([type, count], i) => (
                          <span
                            key={type}
                            className="text-xs px-2 py-0.5 font-sketch"
                            style={{
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-bg)',
                              border: '1.5px solid var(--color-border)',
                              borderRadius: SKETCH_VARIANTS[i % SKETCH_VARIANTS.length],
                            }}
                          >
                            {NODE_TYPE_LABELS[type]} {count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 底部：标签 + 时间 + 可见性 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {flow.tags?.slice(0, 3).map((tag, i) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 font-sketch font-medium"
                            style={{
                              color: 'var(--color-accent-dark)',
                              background: 'var(--color-accent-bg)',
                              border: '1.5px solid var(--color-border)',
                              borderRadius: SKETCH_VARIANTS[(i + index) % SKETCH_VARIANTS.length],
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {(flow.tags?.length || 0) > 3 && (
                          <span className="text-xs font-sketch" style={{ color: 'var(--color-text-muted)' }}>+{flow.tags!.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs flex-shrink-0 font-sketch" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{formatTimeStr(flow.updatedAt)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTogglePublic(flow) }}
                          className="p-1 transition-all duration-200"
                          style={{ color: flow.isPublic ? '#5A9E7A' : 'var(--color-border)' }}
                          title={flow.isPublic ? '公开' : '私密'}
                        >
                          {flow.isPublic ? <Eye size={13} /> : <Lock size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 弹窗 */}
      {showCreate && <CreateFlowModal onClose={() => setShowCreate(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {deleteTarget && <DeleteConfirmModal flow={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 px-4 py-2 font-sketch text-sm z-50"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-sketch)',
            borderRadius: 'var(--radius-sketch-c)',
            boxShadow: '2px 3px 0 rgba(160, 140, 110, 0.15)',
            animation: 'fadeSlideIn 0.3s ease-out',
          }}
          onClick={() => setToastMessage('')}
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}
