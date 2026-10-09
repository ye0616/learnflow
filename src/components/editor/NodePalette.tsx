import { NodeType } from '../../types'
import { BookOpen, Dumbbell, ClipboardCheck, Code2, Sparkles, Plus, GripVertical } from 'lucide-react'

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void
}

// 节点类型配置（温暖手绘风格配色，与整体一致）
const NODE_ITEMS: {
  type: NodeType
  label: string
  desc: string
  accent: string
  accentBg: string
  iconColor: string
  icon: React.ReactNode
}[] = [
  {
    type: 'knowledge',
    label: '知识节点',
    desc: '核心概念与理论学习',
    accent: '#A8C0D0',
    accentBg: 'rgba(168,192,208,0.15)',
    iconColor: '#8898A8',
    icon: <BookOpen size={18} strokeWidth={2} />,
  },
  {
    type: 'practice',
    label: '练习节点',
    desc: '习题与动手实践训练',
    accent: '#8FB89A',
    accentBg: 'rgba(143,184,154,0.15)',
    iconColor: '#6FA87A',
    icon: <Dumbbell size={18} strokeWidth={2} />,
  },
  {
    type: 'quiz',
    label: '测验节点',
    desc: '阶段性知识检验',
    accent: '#C89080',
    accentBg: 'rgba(200,144,128,0.15)',
    iconColor: '#B88070',
    icon: <ClipboardCheck size={18} strokeWidth={2} />,
  },
  {
    type: 'project',
    label: '项目节点',
    desc: '综合实战项目演练',
    accent: '#A098B8',
    accentBg: 'rgba(160,152,184,0.15)',
    iconColor: '#9088A8',
    icon: <Code2 size={18} strokeWidth={2} />,
  },
  {
    type: 'custom',
    label: '自定义节点',
    desc: '自由定义内容与样式',
    accent: '#B8A0D0',
    accentBg: 'rgba(184,160,208,0.15)',
    iconColor: '#A890C0',
    icon: <Sparkles size={18} strokeWidth={2} />,
  },
]

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div
      className="w-56 flex flex-col h-full flex-shrink-0"
      style={{
        background: 'var(--color-card)',
        borderRight: '1.5px solid var(--color-sketch)',
      }}
    >
      {/* 标题区 — 手绘风格 */}
      <div
        className="px-4 py-3.5"
        style={{ borderBottom: '2px dashed var(--color-sketch)' }}
      >
        <h3
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <Plus size={15} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
          添加节点
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          拖拽或点击添加到画布
        </p>
      </div>

      {/* 节点列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {NODE_ITEMS.map(({ type, label, desc, accent, accentBg, iconColor, icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/learnflow-node', type)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onClick={() => onAddNode(type)}
            className="cursor-grab active:cursor-grabbing"
            style={{
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-sketch)',
              borderRadius: 'var(--radius-sketch-c)',
              padding: 0,
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              boxShadow: '2px 3px 0 rgba(160,140,110,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent
              e.currentTarget.style.boxShadow = `0 4px 12px ${accentBg}, 3px 5px 0 rgba(160,140,110,0.10)`
              e.currentTarget.style.transform = 'translateY(-2px) rotate(-0.3deg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-sketch)'
              e.currentTarget.style.boxShadow = '2px 3px 0 rgba(160,140,110,0.06)'
              e.currentTarget.style.transform = 'translateY(0) rotate(0deg)'
            }}
          >
            {/* 顶部色条 */}
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
              }}
            />

            <div className="px-3 py-2.5 flex items-center gap-2.5">
              {/* 图标容器 — 手绘不规则圆圈 */}
              <span
                className="inline-flex items-center justify-center flex-shrink-0"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50% 45% 55% 48%',
                  background: accentBg,
                  border: `1.5px solid ${accent}50`,
                  color: iconColor,
                }}
              >
                {icon}
              </span>

              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {label}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {desc}
                </div>
              </div>

              {/* 拖拽提示 */}
              <GripVertical
                size={14}
                strokeWidth={1.5}
                className="opacity-30 group-hover:opacity-60 transition-opacity"
                style={{ color: accent }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
