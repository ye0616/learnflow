import React, { useState, memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { FlowNodeData, NodeType } from '../../types'
import {
  BookOpen, Dumbbell, ClipboardCheck, Code2, Sparkles,
  Clock, CheckCircle2, Circle, Timer
} from 'lucide-react'

// ===== 节点类型配置（温暖手绘风格配色，与整体一致）=====
const NODE_CONFIG: Record<NodeType, {
  accent: string
  accentBg: string
  borderColor: string
  selectedBorderColor: string
  sketchRadius: string
}> = {
  knowledge: {
    accent: '#A8C0D0',
    accentBg: 'rgba(168,192,208,0.15)',
    borderColor: 'rgba(168,192,208,0.4)',
    selectedBorderColor: '#A8C0D0',
    sketchRadius: 'var(--radius-sketch-c)',
  },
  practice: {
    accent: '#8FB89A',
    accentBg: 'rgba(143,184,154,0.15)',
    borderColor: 'rgba(143,184,154,0.4)',
    selectedBorderColor: '#8FB89A',
    sketchRadius: 'var(--radius-sketch-a)',
  },
  quiz: {
    accent: '#C89080',
    accentBg: 'rgba(200,144,128,0.15)',
    borderColor: 'rgba(200,144,128,0.4)',
    selectedBorderColor: '#C89080',
    sketchRadius: 'var(--radius-sketch-d)',
  },
  project: {
    accent: '#A098B8',
    accentBg: 'rgba(160,152,184,0.15)',
    borderColor: 'rgba(160,152,184,0.4)',
    selectedBorderColor: '#A098B8',
    sketchRadius: 'var(--radius-sketch-e)',
  },
  custom: {
    accent: '#B8A0D0',
    accentBg: 'rgba(184,160,208,0.15)',
    borderColor: 'rgba(184,160,208,0.4)',
    selectedBorderColor: '#B8A0D0',
    sketchRadius: 'var(--radius-sketch-c)',
  },
}

const TYPE_LABELS: Record<NodeType, string> = {
  knowledge: '知识',
  practice:  '练习',
  quiz:      '测验',
  project:   '项目',
  custom:    '自定义',
}

const TYPE_ICONS: Record<NodeType, React.ReactNode> = {
  knowledge: <BookOpen size={13} strokeWidth={2} />,
  practice:  <Dumbbell size={13} strokeWidth={2} />,
  quiz:      <ClipboardCheck size={13} strokeWidth={2} />,
  project:   <Code2 size={13} strokeWidth={2} />,
  custom:    <Sparkles size={13} strokeWidth={2} />,
}

interface StatusConfig {
  icon: React.ComponentType<any>
  color: string
  label: string
  animated?: boolean
}

const STATUS_ICON_MAP: Record<string, StatusConfig> = {
  not_started: { icon: Circle, color: '#B0A090', label: '未开始' },
  in_progress: { icon: Timer, color: '#C9A46A', label: '进行中', animated: true },
  completed: { icon: CheckCircle2, color: '#5A9E7A', label: '已完成' },
}

type FlowNodeProps = NodeProps<Node<FlowNodeData>>

const FlowNode = memo(function FlowNode({ data, selected }: FlowNodeProps) {
  const [hovered, setHovered] = useState(false)
  const config = NODE_CONFIG[data.type]
  const statusConf = STATUS_ICON_MAP[data.status]
  const StatusIcon = statusConf.icon

  const isCompleted = data.status === 'completed'
  const isInProgress = data.status === 'in_progress'

  return (
    <div
      className="relative"
      style={{ width: 210 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 节点主体 — 精致手绘卡片 */}
      <div
        className="overflow-hidden cursor-pointer select-none"
        style={{
          background: 'var(--color-card)',
          borderRadius: config.sketchRadius,
          border: selected
            ? `2px solid ${config.selectedBorderColor}`
            : `1.5px solid ${config.borderColor}`,
          boxShadow: selected
            ? `0 0 0 4px ${config.accentBg}, 4px 6px 0 rgba(160,140,110,0.10)`
            : hovered
            ? '3px 5px 0 rgba(160,140,110,0.08)'
            : '2px 3px 0 rgba(160,140,110,0.04)',
          transform: hovered && !selected
            ? 'translateY(-2px) rotate(-0.3deg)'
            : 'translateY(0)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
          opacity: data.status === 'not_started' ? 0.85 : 1,
        }}
      >
        {/* 顶部装饰条 — 鲜明配色 */}
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${config.accent}, ${config.accent}88)`,
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          }}
        />

        {/* 内容区 */}
        <div style={{ padding: '9px 12px 7px' }}>
          {/* 头部：类型标签 + 状态 */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {/* 类型图标 */}
            <span
              className="inline-flex items-center justify-center flex-shrink-0"
              style={{
                width: 22,
                height: 22,
                borderRadius: '50% 45% 55% 48%',
                background: config.accentBg,
                border: `1.5px solid ${config.borderColor}`,
                color: config.accent,
              }}
            >
              {TYPE_ICONS[data.type]}
            </span>
            {/* 类型标签 */}
            <span
              className="font-sketch text-xs font-bold"
              style={{ color: config.accent }}
            >
              {TYPE_LABELS[data.type]}
            </span>

            {/* 状态指示器 */}
            <span className="ml-auto flex items-center" style={{ color: statusConf.color }}>
              <StatusIcon
                size={12}
                strokeWidth={2}
                className={statusConf.animated ? 'animate-spin' : ''}
                style={statusConf.animated ? { animationDuration: '3s' } : {}}
              />
            </span>
          </div>

          {/* 标题 */}
          <div
            className="text-sm font-semibold leading-snug mb-1"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: "'Inter', 'PingFang SC', system-ui, sans-serif",
            }}
          >
            {data.label}
          </div>

          {/* 描述 */}
          {data.description && (
            <p
              className="text-xs leading-relaxed line-clamp-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {data.description}
            </p>
          )}

          {/* 底部信息栏 */}
          <div className="flex items-center gap-2" style={{ minHeight: 20, marginTop: 2 }}>
            {/* 推荐资料指示 */}
            {data.recommendations && data.recommendations.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-xs"
                style={{ color: config.accent, opacity: 0.8 }}
              >
                <BookOpen size={10} strokeWidth={2} />
                <span className="font-sketch" style={{ fontSize: 10 }}>推荐</span>
              </span>
            )}

            {/* 进度条（右侧对齐） */}
            {(isInProgress || isCompleted) && data.progress !== undefined && (
              <div className="ml-auto flex items-center gap-1.5">
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: 48,
                    height: 4,
                    background: 'var(--color-bg-alt)',
                    borderRadius: 2,
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-500"
                    style={{
                      width: `${isCompleted ? 100 : data.progress}%`,
                      background: `linear-gradient(90deg, ${config.accent}88, ${config.accent})`,
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: config.accent, minWidth: 24, textAlign: 'right', fontSize: 10 }}
                >
                  {isCompleted ? '100%' : `${data.progress}%`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 完成勾选徽章 */}
        {isCompleted && (
          <div
            className="absolute -top-1.5 -right-1.5"
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#5A9E7A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(90,158,122,0.3)',
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2.5} style={{ color: '#FFF8F0' }} />
          </div>
        )}
      </div>

      {/* 连接点 — 手绘不规则圆圈 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 10,
          height: 10,
          background: 'var(--color-card)',
          border: `2px solid ${config.borderColor}`,
          borderRadius: '50% 40% 60% 50%',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10,
          height: 10,
          background: 'var(--color-card)',
          border: `2px solid ${config.borderColor}`,
          borderRadius: '50% 40% 60% 50%',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
        }}
      />
    </div>
  )
})

export default FlowNode
