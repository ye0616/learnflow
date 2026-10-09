import { useState, useMemo } from 'react'
import { BookOpen, FileText, Video, FileCode, Link, Plus, X, Search, Tag, Sparkles, Bookmark, BookmarkCheck, Trash2, Upload, Loader2 } from 'lucide-react'
import { useRoomStore } from '../../store/roomStore'
import { SharedResource, ResourceType, ResourceCategory, RoomMember } from '../../types'
import { autoTagResources, hasApiKey } from '../../services/aiService'

const TYPE_ICONS: Record<ResourceType, typeof FileText> = {
  pdf: FileText,
  video: Video,
  doc: Link,
  repo: FileCode,
}

const TYPE_LABELS: Record<ResourceType, string> = {
  pdf: 'PDF',
  video: '视频',
  doc: '在线文档',
  repo: '代码仓库',
}

const TYPE_COLORS: Record<ResourceType, string> = {
  pdf: '#ef4444',
  video: '#8b5cf6',
  doc: '#3b82f6',
  repo: '#f59e0b',
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  frontend: '前端',
  backend: '后端',
  ai: 'AI',
  design: '设计',
  math: '数学',
  language: '语言',
  exam: '考试',
  other: '其他',
}

interface Props {
  roomId: string
  members: RoomMember[]
}

export default function Bookshelf({ roomId, members }: Props) {
  const store = useRoomStore()
  const room = store.rooms.find(r => r.id === roomId)
  const resources = room?.sharedResources || []
  const bookmarks = room?.bookmarks || []

  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<ResourceType>('pdf')
  const [newUrl, setNewUrl] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAddedBy, setNewAddedBy] = useState(members[0]?.id || '')
  const [filterType, setFilterType] = useState<ResourceType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<ResourceCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isTagging, setIsTagging] = useState(false)
  const [dragResId, setDragResId] = useState<string | null>(null)
  const [hoverMemberId, setHoverMemberId] = useState<string | null>(null)

  // 筛选后的资源
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (filterCategory !== 'all' && r.category !== filterCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          r.title.toLowerCase().includes(q) ||
          r.tags.some(t => t.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [resources, filterType, filterCategory, searchQuery])

  // 检查资源是否已被某成员收藏
  const isBookmarkedBy = (resourceId: string, memberId: string) => {
    return bookmarks.some(b => b.memberId === memberId && b.resourceId === resourceId)
  }

  // 获取某成员的收藏数量
  const getBookmarkCount = (memberId: string) => {
    return bookmarks.filter(b => b.memberId === memberId).length
  }

  // 添加资源
  const handleAdd = () => {
    if (!newTitle.trim() || !newUrl.trim()) return
    const addedBy = members.find(m => m.id === newAddedBy)
    store.addResource(roomId, {
      title: newTitle.trim(),
      type: newType,
      url: newUrl.trim(),
      description: newDesc.trim() || undefined,
      addedBy: newAddedBy,
      addedByName: addedBy?.name || '未知',
    })
    setNewTitle('')
    setNewUrl('')
    setNewDesc('')
    setShowAddForm(false)
  }

  // AI 自动打标签
  const handleAutoTag = async () => {
    const pending = store.autoTagPending(roomId)
    if (pending.length === 0) return

    if (!hasApiKey()) {
      alert('请先在设置中配置 AI API Key（硅基流动）')
      return
    }

    setIsTagging(true)
    try {
      const results = await autoTagResources(pending)
      results.forEach((result, resourceId) => {
        store.updateResourceTags(roomId, resourceId, result.tags, result.category)
      })
    } catch {
      alert('AI 打标失败，请检查网络或 API Key')
    } finally {
      setIsTagging(false)
    }
  }

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, resourceId: string) => {
    setDragResId(resourceId)
    e.dataTransfer.setData('text/plain', resourceId)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragEnd = () => {
    setDragResId(null)
    setHoverMemberId(null)
  }

  // 拖到成员头像上收藏
  const handleMemberDragOver = (e: React.DragEvent, memberId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setHoverMemberId(memberId)
  }

  const handleMemberDragLeave = () => {
    setHoverMemberId(null)
  }

  const handleMemberDrop = (e: React.DragEvent, memberId: string) => {
    e.preventDefault()
    const resourceId = e.dataTransfer.getData('text/plain')
    if (resourceId) {
      store.addBookmark(roomId, memberId, resourceId)
    }
    setDragResId(null)
    setHoverMemberId(null)
  }

  // 待 AI 打标数量
  const untaggedCount = resources.filter(r => !r.aiTagged).length

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* 顶部栏 */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center gap-3 flex-wrap"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--color-border-light)',
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />
          <span className="font-medium text-sm">资源书架</span>
          <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}>
            {resources.length}
          </span>
        </div>

        <div className="flex-1" />

        {/* AI 打标按钮 */}
        {untaggedCount > 0 && (
          <button
            onClick={handleAutoTag}
            disabled={isTagging}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
              color: '#7c3aed',
              border: '1px solid #7c3aed30',
            }}
          >
            {isTagging ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            AI 分类 {untaggedCount} 项
          </button>
        )}

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
          style={{
            background: showAddForm ? 'var(--color-accent)' : 'var(--color-bg-alt)',
            color: showAddForm ? '#fff' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          {showAddForm ? <X size={13} /> : <Plus size={13} />}
          {showAddForm ? '取消' : '添加资源'}
        </button>
      </div>

      {/* 添加资源表单 */}
      {showAddForm && (
        <div className="flex-shrink-0 px-5 py-4 animate-fade-in"
          style={{ borderBottom: '1px dashed var(--color-border-light)' }}
        >
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="资源标题（如：React 官方文档）"
                className="flex-1 text-sm px-3 py-2"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as ResourceType)}
                className="text-xs px-2 py-2"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)', borderRadius: 8 }}
              >
                <option value="pdf">📕 PDF</option>
                <option value="video">🎬 视频</option>
                <option value="doc">📄 在线文档</option>
                <option value="repo">💻 代码仓库</option>
              </select>
            </div>
            <input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="资源链接（URL）"
              className="w-full text-xs px-3 py-2"
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="简短描述（可选）"
                className="flex-1 text-xs px-3 py-2"
              />
              <select
                value={newAddedBy}
                onChange={e => setNewAddedBy(e.target.value)}
                className="text-xs px-2 py-2"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)', borderRadius: 8 }}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} 添加</option>
                ))}
              </select>
            </div>
            <button onClick={handleAdd} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
              <Upload size={12} /> 添加到书架
            </button>
          </div>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex-shrink-0 px-5 py-2.5 flex items-center gap-2 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--color-border-light)' }}
      >
        {/* 搜索 */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs flex-shrink-0"
          style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border-light)' }}
        >
          <Search size={12} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="bg-transparent border-0 outline-none w-24"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center gap-1">
          {(['all', 'pdf', 'video', 'doc', 'repo'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="text-xs px-2 py-1 rounded-md transition-all flex-shrink-0"
              style={{
                background: filterType === t ? 'var(--color-accent)' : 'transparent',
                color: filterType === t ? '#fff' : 'var(--color-text-muted)',
                border: filterType === t ? '1px solid var(--color-accent)' : '1px solid transparent',
              }}
            >
              {t === 'all' ? '全部' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--color-border-light)' }} />

        {/* 分类筛选 */}
        <div className="flex items-center gap-1">
          {(['all', 'frontend', 'backend', 'ai', 'design', 'math', 'language', 'other'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className="text-xs px-2 py-1 rounded-md transition-all flex-shrink-0"
              style={{
                background: filterCategory === c ? 'var(--color-sketch)' : 'transparent',
                color: filterCategory === c ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: filterCategory === c ? '1.5px solid var(--color-accent)' : '1px solid transparent',
              }}
            >
              {c === 'all' ? '全部分类' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* 成员收藏快捷栏 */}
      <div className="flex-shrink-0 px-5 py-2 flex items-center gap-2 overflow-x-auto"
        style={{ borderBottom: '1px dashed var(--color-border-light)' }}
      >
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
          📌 拖拽资源到成员头像收藏：
        </span>
        {members.map(m => {
          const count = getBookmarkCount(m.id)
          const isHovered = hoverMemberId === m.id
          return (
            <div
              key={m.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer flex-shrink-0"
              style={{
                background: isHovered ? `${m.color}20` : 'var(--color-bg-alt)',
                border: `1.5px solid ${isHovered ? m.color : 'var(--color-border-light)'}`,
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              }}
              onDragOver={e => handleMemberDragOver(e, m.id)}
              onDragLeave={handleMemberDragLeave}
              onDrop={e => handleMemberDrop(e, m.id)}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: m.color }}>
                {m.name[0]}
              </span>
              <span className="font-medium">{m.name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* 资源列表 */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {filteredResources.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <BookOpen size={48} className="opacity-20 mb-3" />
            <p className="text-sm mb-1">{resources.length === 0 ? '书架空空如也' : '没有匹配的资源'}</p>
            <p className="text-xs">
              {resources.length === 0 ? '点击右上角「添加资源」开始共享学习资料' : '试试调整筛选条件'}
            </p>
            {resources.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-secondary mt-3 text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <Plus size={12} /> 添加第一个资源
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredResources.map(res => {
              const IconComp = TYPE_ICONS[res.type]
              const typeColor = TYPE_COLORS[res.type]
              return (
                <div
                  key={res.id}
                  draggable
                  onDragStart={e => handleDragStart(e, res.id)}
                  onDragEnd={handleDragEnd}
                  className="sketch-card sketch-e p-3 transition-all duration-200 cursor-grab active:cursor-grabbing group"
                  style={{
                    opacity: dragResId === res.id ? 0.5 : 1,
                    transform: dragResId === res.id ? 'rotate(-1deg) scale(0.97)' : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* 类型图标 */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${typeColor}15` }}
                    >
                      <IconComp size={16} style={{ color: typeColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 标题行 */}
                      <div className="flex items-center gap-2">
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium truncate hover:underline"
                          style={{ color: 'var(--color-text-primary)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          {res.title}
                        </a>
                        <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            background: `${typeColor}15`,
                            color: typeColor,
                            border: `1px solid ${typeColor}30`,
                          }}
                        >
                          {TYPE_LABELS[res.type]}
                        </span>
                      </div>

                      {/* 描述 */}
                      {res.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                          {res.description}
                        </p>
                      )}

                      {/* 标签 */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {res.tags.length > 0 ? (
                          res.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5"
                              style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
                            >
                              <Tag size={9} />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
                            未分类 — 点击「AI 分类」自动打标
                          </span>
                        )}
                        {res.aiTagged && (
                          <span className="text-xs flex items-center gap-0.5" style={{ color: '#7c3aed' }}>
                            <Sparkles size={9} />
                            {CATEGORY_LABELS[res.category]}
                          </span>
                        )}
                      </div>

                      {/* 底部信息 */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
                        <span>{res.addedByName} 添加</span>
                        <span>·</span>
                        <span>{new Date(res.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 收藏状态 */}
                      {members.map(m => {
                        const bm = isBookmarkedBy(res.id, m.id)
                        return bm ? (
                          <button
                            key={m.id}
                            onClick={() => store.removeBookmark(roomId, m.id, res.id)}
                            className="p-1 rounded transition-colors"
                            style={{ color: m.color }}
                            title={`${m.name} 已收藏 — 点击取消`}
                          >
                            <BookmarkCheck size={14} />
                          </button>
                        ) : null
                      })}
                      {/* 快捷收藏按钮 */}
                      <button
                        onClick={() => {
                          const firstUnbookmarked = members.find(m => !isBookmarkedBy(res.id, m.id))
                          if (firstUnbookmarked) store.addBookmark(roomId, firstUnbookmarked.id, res.id)
                        }}
                        className="p-1 rounded hover:bg-black/5 transition-colors"
                        title="收藏资源"
                      >
                        <Bookmark size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </button>
                      <button
                        onClick={() => store.deleteResource(roomId, res.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={13} style={{ color: 'var(--color-text-muted)' }} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="flex-shrink-0 px-5 py-2 text-xs text-center"
        style={{ color: 'var(--color-text-muted)', borderTop: '1px dashed var(--color-border-light)', opacity: 0.5 }}
      >
        拖拽资源卡片到上方成员头像即可收藏到个人资料库 ｜ 点击资源标题打开链接
      </div>
    </div>
  )
}
