import {
  PenLine, Square, Circle, Type, GitBranch, Download, Trash2,
  Palette, Minus, Plus, X, LinkIcon,
} from 'lucide-react'
import { RoomMember, WhiteboardTool } from '../../types'

interface Props {
  tool: WhiteboardTool
  setTool: (t: WhiteboardTool) => void
  color: string
  setColor: (c: string) => void
  lineWidth: number
  setLineWidth: (w: number) => void
  members: RoomMember[]
  activeMemberId: string
  setActiveMemberId: (id: string) => void
  onClear: () => void
  onExport: () => void
  linkingFrom: string | null
  onCancelLink: () => void
}

const TOOLS: { id: WhiteboardTool; icon: typeof PenLine; label: string; tip: string }[] = [
  { id: 'pen', icon: PenLine, label: '画笔', tip: '自由绘制' },
  { id: 'rect', icon: Square, label: '矩形', tip: '拖拽画矩形' },
  { id: 'circle', icon: Circle, label: '圆形', tip: '拖拽画圆' },
  { id: 'text', icon: Type, label: '文字', tip: '点击添加文字' },
  { id: 'mindmap', icon: GitBranch, label: '导图', tip: '点击创建节点 | Shift+点击删除 | 双击编辑 | 点击节点连接' },
]

export default function WhiteboardToolbar({
  tool, setTool, color, setColor, lineWidth, setLineWidth,
  members, activeMemberId, setActiveMemberId,
  onClear, onExport, linkingFrom, onCancelLink,
}: Props) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 flex-shrink-0 flex-wrap"
      style={{
        background: '#f5f0e8',
        borderBottom: '1.5px solid var(--color-sketch)',
      }}
    >
      {/* 工具选择 */}
      <div className="flex items-center gap-1">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className="flex flex-col items-center px-2 py-1.5 rounded-lg transition-all text-xs"
            title={t.tip}
            style={{
              background: tool === t.id ? color + '20' : 'transparent',
              color: tool === t.id ? color : 'var(--color-text-secondary)',
              border: tool === t.id ? `1.5px solid ${color}` : '1.5px solid transparent',
            }}
          >
            <t.icon size={16} />
            <span className="mt-0.5 font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-8" style={{ background: 'var(--color-sketch)' }} />

      {/* 连线状态提示 */}
      {linkingFrom && (
        <div className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
          <LinkIcon size={12} />
          <span>点击另一个节点连线</span>
          <button onClick={onCancelLink} className="ml-1 hover:text-red-500"><X size={12} /></button>
        </div>
      )}

      {/* 颜色 */}
      <div className="flex items-center gap-1.5">
        <Palette size={14} style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
        />
      </div>

      {/* 粗细 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
          className="flex items-center justify-center w-6 h-6 rounded"
          style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-secondary)' }}
        >
          <Minus size={12} />
        </button>
        <span className="text-xs font-medium w-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>{lineWidth}</span>
        <button
          onClick={() => setLineWidth(Math.min(12, lineWidth + 1))}
          className="flex items-center justify-center w-6 h-6 rounded"
          style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-secondary)' }}
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="w-px h-8" style={{ background: 'var(--color-sketch)' }} />

      {/* 成员切换 */}
      <div className="flex items-center gap-1">
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMemberId(m.id)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all flex-shrink-0"
            style={{
              background: m.color,
              opacity: m.id === activeMemberId ? 1 : 0.45,
              transform: m.id === activeMemberId ? 'scale(1.15)' : 'scale(1)',
              boxShadow: m.id === activeMemberId ? `0 0 0 2px #fff, 0 0 0 4px ${m.color}` : 'none',
            }}
            title={m.name}
          >
            {m.name[0]}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* 右侧操作 */}
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-sketch)' }}
        title="导出为图片"
      >
        <Download size={14} />
        <span className="hidden sm:inline">导出</span>
      </button>
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'var(--color-bg)', color: '#ef4444', border: '1.5px solid #fca5a5' }}
        title="清除全部"
      >
        <Trash2 size={14} />
        <span className="hidden sm:inline">清空</span>
      </button>
    </div>
  )
}
