import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import {
  Check, Download, ArrowRight, ArrowLeft, Sparkles,
  Layers, Monitor, Code, FileJson, QrCode, Trash2,
  Eye, Plus, Minus, ExternalLink,
} from 'lucide-react'
import type { PortfolioItem, Milestone, FlowNodeData } from '../types'

// ═══════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════

/** 从给定文字中推测技术栈标签 */
function guessTechStack(text: string): string[] {
  const techMap: Record<string, string> = {
    'react': 'React', 'vue': 'Vue', 'angular': 'Angular',
    'typescript': 'TypeScript', 'javascript': 'JavaScript',
    'python': 'Python', 'node': 'Node.js', 'express': 'Express',
    'flask': 'Flask', 'django': 'Django', 'fastapi': 'FastAPI',
    'next': 'Next.js', 'nuxt': 'Nuxt', 'vite': 'Vite',
    'tailwind': 'Tailwind CSS', 'css': 'CSS', 'scss': 'SCSS',
    'echarts': 'ECharts', 'd3': 'D3.js', 'pandas': 'Pandas',
    'numpy': 'NumPy', 'matplotlib': 'Matplotlib',
    'docker': 'Docker', 'git': 'Git', 'github': 'GitHub',
    'vercel': 'Vercel', 'netlify': 'Netlify',
    'sql': 'SQL', 'mongodb': 'MongoDB', 'redis': 'Redis',
    'figma': 'Figma', 'sketch': 'Sketch',
    'vue 3': 'Vue 3',
  }

  const lower = text.toLowerCase()
  const found: string[] = []
  for (const [key, label] of Object.entries(techMap)) {
    if (lower.includes(key)) {
      found.push(label)
    }
  }
  return found.slice(0, 6)
}

/** 扫描已完成的项目节点 */
interface DetectedProject {
  id: string
  title: string
  description: string
  date: string
  techStack: string[]
  source: string
  sourceId?: string
}

function detectProjects(
  flows: ReturnType<typeof useAppStore.getState>['flows'],
  milestones: Milestone[],
  existingPortfolio: PortfolioItem[],
): DetectedProject[] {
  const results: DetectedProject[] = []
  const seen = new Set(existingPortfolio.map(p => p.id))

  // 1) 扫描学习流中 completed 的 project 节点
  flows.forEach(flow => {
    const projectNodes = flow.nodes?.filter(
      n => (n.data as FlowNodeData)?.type === 'project' && (n.data as FlowNodeData)?.status === 'completed'
    ) || []
    projectNodes.forEach(n => {
      const data = n.data as FlowNodeData
      const id = `flow-${flow.id}-${data.id}`
      if (seen.has(id)) return
      results.push({
        id,
        title: data.label || '未命名项目',
        description: data.description || `来自学习流「${flow.title}」`,
        date: flow.updatedAt || flow.createdAt,
        techStack: [...guessTechStack(data.label + ' ' + (data.description || '')), ...(flow.tags || [])].slice(0, 6),
        source: `学习流 · ${flow.title}`,
        sourceId: flow.id,
      })
    })
  })

  // 2) 扫描 100% 完成的学习流（整体作为一个项目）
  flows.forEach(flow => {
    const totalNodes = flow.nodes?.length || 0
    const completedNodes = flow.nodes?.filter(n => (n.data as FlowNodeData)?.status === 'completed').length || 0
    if (totalNodes > 0 && completedNodes === totalNodes) {
      const id = `flow-complete-${flow.id}`
      if (seen.has(id)) return
      results.push({
        id,
        title: flow.title,
        description: flow.description || `完成全部 ${totalNodes} 个学习节点`,
        date: flow.updatedAt || flow.createdAt,
        techStack: flow.tags || [],
        source: '完整学习流',
        sourceId: flow.id,
      })
    }
  })

  // 3) 扫描 project 类别的里程碑
  milestones.filter(m => m.category === 'project').forEach(m => {
    const id = `milestone-${m.id}`
    if (seen.has(id)) return
    results.push({
      id,
      title: m.title,
      description: m.description,
      date: m.date,
      techStack: guessTechStack(m.title + ' ' + m.description),
      source: '里程碑',
      sourceId: m.id,
    })
  })

  return results
}

/** 模拟截图色块 */
const COLOR_PALETTE = [
  ['#6B8E9B', '#E8D5B7'], ['#7A9B76', '#F0E6D3'],
  ['#B8956A', '#F7F2E8'], ['#8B7F8B', '#F2E8F0'],
  ['#5A7A8A', '#E8EFF3'], ['#9B8A6B', '#F5F0E6'],
]

// ═══════════════════════════════════════════
// 子组件：项目卡片（勾选）
// ═══════════════════════════════════════════

function ProjectCard({
  project,
  selected,
  onToggle,
}: {
  project: DetectedProject
  selected: boolean
  onToggle: () => void
}) {
  const colors = COLOR_PALETTE[Math.abs(project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COLOR_PALETTE.length]

  return (
    <div
      className="card-lift-hover"
      onClick={onToggle}
      style={{
        cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start', gap: 14,
        background: selected ? 'rgba(201,164,106,0.06)' : 'var(--color-card)',
        border: selected ? '2px solid var(--color-accent)' : '1.5px solid var(--color-sketch)',
        borderRadius: 'var(--radius-sketch-b)',
        padding: '15px 16px',
        boxShadow: selected ? '2px 3px 8px rgba(180,140,100,0.1)' : '1px 2px 0 rgba(160,140,110,0.03)',
        transition: 'all 0.25s',
        position: 'relative',
      }}
    >
      {/* 勾选 */}
      <div
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          marginTop: 2,
          border: selected ? '2px solid var(--color-accent)' : '2px solid #CCC5B5',
          background: selected ? 'var(--color-accent)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 className="font-sketch" style={{ fontSize: 15, color: 'var(--color-text-primary)', margin: 0 }}>
            {project.title}
          </h3>
          <span
            className="font-sketch"
            style={{
              fontSize: 10, color: 'var(--color-accent)',
              background: 'var(--color-accent-bg)',
              borderRadius: 'var(--radius-sketch-e)',
              padding: '1px 7px', whiteSpace: 'nowrap',
            }}
          >
            {project.source}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
          {project.description}
        </p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {project.techStack.map(t => (
            <span key={t} className="font-sketch" style={{ fontSize: 10, color: 'var(--color-text-muted)', opacity: 0.7 }}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* 模拟截图 */}
      <div
        style={{
          width: 80, height: 52, borderRadius: 'var(--radius-sketch-d)',
          flexShrink: 0, overflow: 'hidden',
          border: '1px solid var(--color-border)',
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, opacity: 0.7,
        }}
      >
        <Monitor size={20} color="#fff" opacity={0.5} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// 子组件：预览面板
// ═══════════════════════════════════════════

function PreviewPanel({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="font-sketch"
        style={{
          textAlign: 'center', padding: '40px 20px',
          color: 'var(--color-text-muted)', fontSize: 14,
        }}
      >
        请从左侧选择要展示的作品
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((item, i) => (
        <div
          key={item.id}
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-sketch)',
            borderRadius: i % 2 === 0 ? 'var(--radius-sketch-a)' : 'var(--radius-sketch-c)',
            padding: '14px 16px',
            boxShadow: '1px 2px 0 rgba(160,140,110,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sketch-a)',
              background: 'var(--color-accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              {item.coverEmoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="font-sketch" style={{ fontSize: 14, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                {item.description}
              </p>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {item.techStack.map(t => (
                  <span key={t} className="font-sketch" style={{
                    fontSize: 9, color: 'var(--color-accent-dark)',
                    background: 'var(--color-accent-bg)', borderRadius: 'var(--radius-sketch-e)',
                    padding: '1px 6px',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════
// 主页面组件
// ═══════════════════════════════════════════

export default function PortfolioBuilderPage() {
  const navigate = useNavigate()
  const { currentUser, flows, updateUser } = useAppStore()

  const portfolio = currentUser.portfolio || []
  const milestones = currentUser.milestones || []

  // 自动扫描已完成项目
  const detectedProjects = useMemo(
    () => detectProjects(flows, milestones, portfolio),
    [flows, milestones, portfolio]
  )

  // 已选中的项目 ID 集合
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 自定义作品集标题和简介
  const [pageTitle, setPageTitle] = useState(currentUser.name + ' 的作品集')
  const [pageBio, setPageBio] = useState(currentUser.bio || '')

  const toggleProject = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(detectedProjects.map(p => p.id)))
  const deselectAll = () => setSelectedIds(new Set())

  // 转换为 PortfolioItem 预览
  const previewItems = useMemo(() => {
    return detectedProjects
      .filter(p => selectedIds.has(p.id))
      .map((p, i) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        coverEmoji: ['🚀', '💡', '📦', '🎯', '✨', '🔧'][i % 6],
        date: p.date,
      }))
  }, [detectedProjects, selectedIds])

  // 一键生成：合并到现有 portfolio
  const handleGenerate = () => {
    const newItems: PortfolioItem[] = previewItems.map(p => ({
      ...p,
      id: `pf-gen-${Date.now()}-${p.id}`,
    }))
    updateUser({ portfolio: [...portfolio, ...newItems] })
    navigate('/portfolio/showcase', { state: { title: pageTitle, bio: pageBio, items: newItems } })
  }

  // 导出 JSON
  const handleExport = () => {
    const exportData = {
      title: pageTitle,
      bio: pageBio,
      exportedAt: new Date().toISOString(),
      items: previewItems,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      {/* 顶部标题栏 */}
      <div
        style={{
          padding: '16px 28px',
          borderBottom: '2px dashed var(--color-border)',
          background: 'var(--color-card)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/profile')}
            className="font-sketch"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--color-text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 'var(--radius-sketch-e)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = 'var(--color-accent)'
              el.style.background = 'var(--color-accent-bg)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = 'var(--color-text-muted)'
              el.style.background = 'none'
            }}
          >
            <ArrowLeft size={14} /> 返回
          </button>
          <h1 className="font-sketch" style={{ fontSize: 20, color: 'var(--color-text-primary)', margin: 0 }}>
            <Layers size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            一键作品集
          </h1>
        </div>

        {/* 操作按钮组 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="font-sketch btn-ghost"
            onClick={handleExport}
            disabled={previewItems.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 16px', fontSize: 13,
              opacity: previewItems.length === 0 ? 0.4 : 1,
              cursor: previewItems.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <FileJson size={14} /> 导出 JSON
          </button>
          <button
            className="font-sketch btn-primary"
            onClick={handleGenerate}
            disabled={previewItems.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 20px', fontSize: 13,
              opacity: previewItems.length === 0 ? 0.5 : 1,
              cursor: previewItems.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Sparkles size={14} /> 生成作品集
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden" style={{ display: 'flex' }}>
        {/* 左列：项目清单 */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            padding: '20px 24px',
            borderRight: '1px dashed var(--color-border)',
            minWidth: 0,
          }}
        >
          {/* 标题区 */}
          <div style={{ marginBottom: 20 }}>
            <div className="font-sketch" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              🔍 已扫描到 {detectedProjects.length} 个已完成项目
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="font-sketch" style={{ fontSize: 16, color: 'var(--color-text-primary)', margin: 0 }}>
                选择要展示的作品
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="font-sketch"
                  onClick={selectAll}
                  style={{
                    fontSize: 11, color: 'var(--color-accent)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px 8px',
                  }}
                >
                  全选
                </button>
                <button
                  className="font-sketch"
                  onClick={deselectAll}
                  style={{
                    fontSize: 11, color: 'var(--color-text-muted)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px 8px',
                  }}
                >
                  取消全选
                </button>
              </div>
            </div>
            <div className="font-sketch" style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
              已选 {selectedIds.size} / {detectedProjects.length}
            </div>
          </div>

          {/* 项目列表 */}
          {detectedProjects.length === 0 ? (
            <div
              className="font-sketch"
              style={{
                textAlign: 'center', padding: '48px 20px',
                color: 'var(--color-text-muted)', fontSize: 14,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              暂无已完成项目，快去完成你的学习流和项目节点吧！
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detectedProjects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selected={selectedIds.has(p.id)}
                  onToggle={() => toggleProject(p.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右列：预览面板 */}
        <div
          className="overflow-y-auto"
          style={{
            width: 340, flexShrink: 0,
            padding: '20px 20px',
            background: 'var(--color-bg)',
          }}
        >
          <h2 className="font-sketch" style={{ fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 16 }}>
            <Eye size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            预览
          </h2>

          {/* 作品集标题配置 */}
          <div style={{ marginBottom: 14 }}>
            <label className="font-sketch" style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
              作品集标题
            </label>
            <input
              value={pageTitle}
              onChange={e => setPageTitle(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px',
                borderRadius: 'var(--radius-sketch-d)',
                border: '1.5px solid var(--color-sketch)',
                background: 'var(--color-card)',
                fontSize: 13, color: 'var(--color-text-primary)',
                outline: 'none', fontFamily: 'Caveat, cursive',
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="font-sketch" style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
              个人简介
            </label>
            <textarea
              value={pageBio}
              onChange={e => setPageBio(e.target.value)}
              rows={2}
              style={{
                width: '100%', padding: '7px 10px',
                borderRadius: 'var(--radius-sketch-d)',
                border: '1.5px solid var(--color-sketch)',
                background: 'var(--color-card)',
                fontSize: 12, color: 'var(--color-text-muted)',
                outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* 模拟截图拼接示意 */}
          {previewItems.length > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, #FDFBF8 0%, #F7F2E8 100%)',
                borderRadius: 'var(--radius-sketch-d)',
                border: '1.5px solid var(--color-sketch)',
                padding: '12px 16px',
                marginBottom: 14,
              }}
            >
              <div className="font-sketch" style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                🖼️ 作品集截图预览
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {previewItems.slice(0, 4).map((item, i) => {
                  const colors = COLOR_PALETTE[i % COLOR_PALETTE.length]
                  return (
                    <div
                      key={item.id}
                      style={{
                        height: 48, borderRadius: 4,
                        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, opacity: 0.7,
                      }}
                    >
                      {item.coverEmoji}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 项目卡片预览 */}
          <PreviewPanel items={previewItems} />

          {/* 底部提示 */}
          {previewItems.length > 0 && (
            <div
              className="font-sketch"
              style={{
                textAlign: 'center', marginTop: 20,
                fontSize: 12, color: 'var(--color-accent)',
              }}
            >
              点击「生成作品集」创建独立展示页
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
