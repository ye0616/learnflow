import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  BackgroundVariant,
  MarkerType,
  Panel,
  Node,
  Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FlowNodeData, FlowVersion, NodeType } from '../types'
import FlowNode from '../components/editor/FlowNode'
import NodePalette from '../components/editor/NodePalette'
import NodeConfigPanel from '../components/editor/NodeConfigPanel'
import { DEMO_FLOWS, generateLearnFlow } from '../utils/mockData'
import { generateFlowWithAI, convertToFlowData, hasApiKey } from '../services/aiService'
import { useAppStore } from '../store/appStore'
import {
  Save, Share2, Wand2, ZoomIn, ZoomOut,
  LayoutGrid, Download, History, Maximize2, X, Grid,
  Clock, Check, Copy, ExternalLink, ChevronLeft, Loader2
} from 'lucide-react'

// ===== 工具函数 =====

const nodeTypes = { flowNode: FlowNode }

const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#C5BAA8' },
  style: { stroke: '#C5BAA8', strokeWidth: 2, strokeDasharray: '8 4' },
  animated: false,
  selectable: true,
  deletable: true,
  interactionWidth: 20,
}

let nodeIdCounter = 100
function generateNodeId() { return `node-${++nodeIdCounter}` }

function getDefaultLabel(type: NodeType): string {
  const labels: Record<NodeType, string> = {
    knowledge: '新知识点', practice: '练习任务',
    quiz: '阶段测验', project: '实战项目', custom: '自定义节点',
  }
  return labels[type]
}

// 循环依赖检测（BFS）
function checkCycle(
  source: string, target: string, edges: Edge[]
): boolean {
  if (source === target) return true

  const adj = new Map<string, string[]>()
  for (const e of edges) {
    const list = adj.get(e.source) || []
    list.push(e.target)
    adj.set(e.source, list)
  }
  const list = adj.get(source) || []
  list.push(target)
  adj.set(source, list)

  const visited = new Set<string>()
  const queue = [target]
  while (queue.length > 0) {
    const curr = queue.shift()!
    if (curr === source) return true
    if (visited.has(curr)) continue
    visited.add(curr)
    const neighbors = adj.get(curr) || []
    for (const n of neighbors) {
      if (!visited.has(n)) queue.push(n)
    }
  }
  return false
}

// 格式化时间
function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ===== Learn 建议弹窗（手绘风格） =====
function LearnSuggestion({ topic, onAccept, onClose }: {
  topic: string
  onAccept: (topic: string) => void
  onClose: () => void
}) {
  const [inputTopic, setInputTopic] = useState(topic || '')
  const useAI = hasApiKey()

  return (
    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="sketch-card sketch-a max-w-md w-full mx-4 p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="sketch-circle w-10 h-10 font-sketch font-bold text-lg"
            style={{ background: 'var(--color-accent)', color: '#FFF8F0', borderColor: 'var(--color-accent-dark)' }}>
            L
          </div>
          <div>
            <div className="font-sketch text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Learn</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {useAI ? 'AI 会根据主题生成学习路径' : '输入学习主题，生成学习流'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost ml-auto p-1.5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
            你想学什么？
          </label>
          <input
            autoFocus
            value={inputTopic}
            onChange={e => setInputTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && inputTopic.trim() && onAccept(inputTopic.trim())}
            placeholder="比如：Python 机器学习、React 前端开发..."
            className="w-full px-3 py-2.5 text-sm"
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            {useAI
              ? 'AI 会自动分析主题并生成包含知识、练习、测验和项目的完整学习路径'
              : '当前为模板模式，配置 API Key 后可使用 AI 智能生成'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => inputTopic.trim() && onAccept(inputTopic.trim())}
            disabled={!inputTopic.trim()}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            <Wand2 size={15} /> 生成学习流
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            手动创建
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== 分享弹窗（手绘风格） =====
function ShareModal({ flowId, onClose }: { flowId: string; onClose: () => void }) {
  const shareLink = `https://learnflow.app/share/${flowId}`
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="sketch-card sketch-c max-w-md w-full mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sketch text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Share2 size={18} /> 分享学习流
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>复制下方链接分享给好友，对方可以查看并导入你的学习流</p>
        <div
          className="flex items-center gap-2 px-3 py-2 mb-3"
          style={{
            background: 'var(--color-bg)',
            border: '1.5px dashed var(--color-sketch)',
            borderRadius: 'var(--radius-sketch-d)',
          }}
        >
          <ExternalLink size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text-secondary)' }}>{shareLink}</span>
        </div>
        <button onClick={handleCopy} className="btn-primary w-full justify-center text-sm">
          {copied ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> 复制链接</>}
        </button>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>* 分享功能将在后端上线后完整实现</p>
      </div>
    </div>
  )
}

// ===== 版本历史面板（手绘风格） =====
function VersionPanel({
  versions, onRestore, onClose
}: {
  versions: FlowVersion[]; onRestore: (versionId: string) => void; onClose: () => void
}) {
  return (
    <div className="w-72 flex flex-col h-full shadow-xl animate-fade-in">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'var(--color-card)',
          borderBottom: '2px dashed var(--color-sketch)',
          borderLeft: '1.5px solid var(--color-sketch)',
        }}
      >
        <h3 className="font-sketch text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <History size={15} /> 版本历史
        </h3>
        <button onClick={onClose} className="btn-ghost p-1.5">
          <X size={16} />
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ background: 'var(--color-card)', borderLeft: '1.5px solid var(--color-sketch)' }}
      >
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={24} className="mx-auto mb-2" style={{ color: 'var(--color-sketch)' }} />
            <p className="font-sketch text-sm" style={{ color: 'var(--color-text-muted)' }}>暂无版本记录</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>保存学习流时会自动创建版本</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...versions].reverse().map((v) => (
              <div
                key={v.id}
                className="p-3 transition-all duration-200 hover:translate-y-[-1px] hover:rotate-[-0.3deg]"
                style={{
                  background: 'var(--color-bg)',
                  border: '1.5px solid var(--color-sketch)',
                  borderRadius: 'var(--radius-sketch-b)',
                  boxShadow: '2px 2px 0 rgba(160, 140, 110, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sketch text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>v{v.version}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatTime(v.createdAt)}</span>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>{v.label}</p>
                <div className="mb-2" style={{ borderBottom: '1px dashed var(--color-border)' }} />
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {v.nodes.length} 个节点 · {v.edges.length} 条连线
                </p>
                <button
                  onClick={() => onRestore(v.id)}
                  className="btn-ghost text-xs font-medium"
                  style={{ color: 'var(--color-accent)', borderRadius: 'var(--radius-sketch-e)' }}
                >
                  <History size={12} /> 恢复此版本
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== 主组件 =====
export default function FlowEditor() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const flowIdFromUrl = searchParams.get('id')
  const isNew = searchParams.get('new') === 'true'

  // 从 store 或 DEMO 中查找 flow
  const flows = useAppStore(state => state.flows)
  const existingFlow = flowIdFromUrl
    ? (flows.find(f => f.id === flowIdFromUrl) || DEMO_FLOWS.find(f => f.id === flowIdFromUrl))
    : null

  // 如果没有 id，重定向到 flows 列表
  useEffect(() => {
    if (!flowIdFromUrl) {
      navigate('/flows', { replace: true })
    }
  }, [flowIdFromUrl, navigate])

  const initialNodes = (existingFlow?.nodes.length || 0) > 0
    ? (existingFlow!.nodes as Node<FlowNodeData>[])
    : (isNew ? [] : DEMO_FLOWS[0].nodes as Node<FlowNodeData>[])

  const initialEdges = (existingFlow?.edges.length || 0) > 0
    ? existingFlow!.edges
    : (isNew ? [] : DEMO_FLOWS[0].edges)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)

  const [selectedNode, setSelectedNode] = useState<FlowNodeData | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [showLearnSuggestion, setShowLearnSuggestion] = useState(false)
  const [showVersionPanel, setShowVersionPanel] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('保存成功！')
  const [showCycleWarning, setShowCycleWarning] = useState(false)
  const [flowTitle, setFlowTitle] = useState(existingFlow?.title || (isNew ? '未命名学习流' : DEMO_FLOWS[0].title))
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)

  // 当 existingFlow 变化时，同步更新 nodes/edges/title
  useEffect(() => {
    // 先尝试从 localStorage 读取待加载的内容（解决时序问题）
    const pending = localStorage.getItem('learnflow_pending_editor')
    if (pending) {
      try {
        const data = JSON.parse(pending)
        if (data.flowId === flowIdFromUrl) {
          setNodes(data.nodes as Node<FlowNodeData>[])
          setEdges(data.edges)
          setFlowTitle(data.title || '未命名学习流')
          localStorage.removeItem('learnflow_pending_editor')
          return
        }
      } catch (e) {
        console.error('[FlowEditor] failed to load from localStorage:', e)
      }
    }

    // 从 store 加载
    if (existingFlow && existingFlow.nodes.length > 0) {
      setNodes(existingFlow.nodes as Node<FlowNodeData>[])
      setEdges(existingFlow.edges)
    }
    if (existingFlow?.title) {
      setFlowTitle(existingFlow.title)
    }
  }, [existingFlow?.id, flowIdFromUrl])

  const { updateFlow, saveFlowVersion, restoreVersion } = useAppStore()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // 当前学习流的版本列表
  const versions: FlowVersion[] = existingFlow?.versions || []

  // 连线回调（含循环检测）
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (checkCycle(connection.source, connection.target, edges)) {
        setShowCycleWarning(true)
        setTimeout(() => setShowCycleWarning(false), 3000)
        return
      }
      setEdges((eds) => addEdge({
        ...connection,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#C5BAA8' },
        style: { stroke: '#C5BAA8', strokeWidth: 2, strokeDasharray: '8 4' },
      }, eds))
    },
    [setEdges, edges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    setSelectedNode(node.data)
  }, [])

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    setSelectedNode(node.data)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdgeId(null)
  }, [])

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedNode(null)
    setSelectedEdgeId(edge.id)
  }, [])

  const onEdgesDelete = useCallback(() => {
    setSelectedEdgeId(null)
  }, [])

  const handleAddNode = useCallback((type: NodeType) => {
    const id = generateNodeId()
    const newNode: Node<FlowNodeData> = {
      id, type: 'flowNode',
      position: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 },
      data: {
        id, type, label: getDefaultLabel(type), description: '',
        estimatedTime: 60, status: 'not_started', progress: 0, tags: [],
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const handleSaveNodeConfig = useCallback((nodeData: Partial<FlowNodeData>) => {
    if (!selectedNode) return
    setNodes((nds) =>
      nds.map((n) =>
        n.data.id === selectedNode.id ? { ...n, data: { ...n.data, ...nodeData } } : n
      )
    )
  }, [selectedNode, setNodes])

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  const handleAcceptLearnSuggestion = useCallback(async (topic: string) => {
    setShowLearnSuggestion(false)
    setIsGenerating(true)
    setGenerateError('')

    if (hasApiKey()) {
      try {
        const generated = await generateFlowWithAI(topic)
        const { nodes: aiNodes, edges: aiEdges } = convertToFlowData(generated, topic)
        setNodes(aiNodes)
        setEdges(aiEdges)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'UNKNOWN'
        if (msg === 'NO_API_KEY' || msg === 'INVALID_KEY') {
          setGenerateError('API Key 无效，请检查设置')
        } else if (msg === 'RATE_LIMIT') {
          setGenerateError('请求太频繁，请稍后再试')
        } else if (msg === 'EMPTY_RESPONSE' || msg === 'INVALID_STRUCTURE') {
          setGenerateError('AI 返回的数据格式有误，请重试')
        } else {
          setGenerateError('生成失败，请稍后再试')
        }
        const { nodes: aiNodes, edges: aiEdges } = generateLearnFlow(topic)
        setNodes(aiNodes)
        setEdges(aiEdges)
      } finally {
        setIsGenerating(false)
      }
    } else {
      setTimeout(() => {
        const { nodes: aiNodes, edges: aiEdges } = generateLearnFlow(topic)
        setNodes(aiNodes)
        setEdges(aiEdges)
        setIsGenerating(false)
        setToastMessage('学习流已生成（模板模式）')
        setShowSaveToast(true)
      }, 600)
    }
  }, [setNodes, setEdges])

  // 保存到 store
  const handleSave = useCallback(() => {
    const targetId = flowIdFromUrl || existingFlow?.id || 'flow-default'
    const progressVal = nodes.length > 0
      ? Math.round((nodes.filter(n => n.data.status === 'completed').length / nodes.length) * 100)
      : 0
    const totalTime = nodes.reduce((sum, n) => sum + (n.data.estimatedTime || 0), 0)

    updateFlow(targetId, {
      title: flowTitle,
      nodes: nodes as any,
      edges,
      progress: progressVal,
      totalEstimatedTime: totalTime,
    })
    setToastMessage('保存成功！')
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 2000)
  }, [flowIdFromUrl, existingFlow, flowTitle, nodes, edges, updateFlow])

  // 保存版本
  const handleSaveVersion = useCallback(() => {
    const targetId = flowIdFromUrl || existingFlow?.id
    if (!targetId) return
    handleSave()
    saveFlowVersion(targetId, flowTitle)
    setToastMessage('版本已保存！')
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 2000)
  }, [flowIdFromUrl, existingFlow, flowTitle, handleSave, saveFlowVersion])

  // 恢复版本
  const handleRestoreVersion = useCallback((versionId: string) => {
    const targetId = flowIdFromUrl || existingFlow?.id
    if (!targetId) return
    restoreVersion(targetId, versionId)
    const updatedFlows = [...DEMO_FLOWS, ...useAppStore.getState().flows.filter(f => !DEMO_FLOWS.find(d => d.id === f.id))]
    const updated = updatedFlows.find(f => f.id === targetId)
    if (updated) {
      setNodes(updated.nodes as Node<FlowNodeData>[])
      setEdges(updated.edges)
    }
    setShowVersionPanel(false)
  }, [flowIdFromUrl, existingFlow, restoreVersion, setNodes, setEdges])

  // 导出 JSON
  const handleExport = useCallback(() => {
    const data = {
      title: flowTitle,
      description: existingFlow?.description || '',
      tags: existingFlow?.tags || [],
      nodes: nodes,
      edges: edges,
      totalEstimatedTime: nodes.reduce((s, n) => s + (n.data.estimatedTime || 0), 0),
      exportedAt: new Date().toISOString(),
    }
    const text = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage('已复制到剪贴板！')
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 2000)
    })
  }, [flowTitle, existingFlow, nodes, edges])

  // 计算进度
  const totalNodes = nodes.length
  const completedNodes = nodes.filter(n => n.data.status === 'completed').length
  const inProgressNodes = nodes.filter(n => n.data.status === 'in_progress').length
  const progress = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0

  // 选中的边高亮
  const styledEdges = useMemo(() =>
    edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: edge.selected ? '#96754C' : '#C5BAA8',
        strokeWidth: edge.selected ? 3 : 2,
        strokeDasharray: edge.selected ? 'none' : '8 4',
      },
      markerEnd: edge.selected
        ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#96754C' }
        : { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#C5BAA8' },
    })),
    [edges]
  )

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      {/* 工具栏 — 手绘风格 */}
      <div
        className="px-4 py-2.5 flex items-center gap-3 flex-shrink-0"
        style={{
          background: 'var(--color-card)',
          borderBottom: '2px dashed var(--color-sketch)',
        }}
      >
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/flows')}
          className="btn-ghost flex-shrink-0 p-1.5"
          title="返回学习流列表"
        >
          <ChevronLeft size={18} />
        </button>

        {/* 标题区 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              autoFocus
              value={flowTitle}
              onChange={(e) => setFlowTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-lg bg-transparent focus:outline-none px-1 font-semibold"
              style={{
                color: 'var(--color-text-primary)',
                border: 'none',
                borderBottom: '2.5px dashed var(--color-accent)',
                borderRadius: 0,
              }}
            />
          ) : (
            <h2
              className="text-lg font-semibold cursor-pointer truncate"
              style={{ color: 'var(--color-text-primary)' }}
              onClick={() => setIsEditingTitle(true)}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            >
              {flowTitle}
            </h2>
          )}

          {/* 进度信息 */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <div className="progress-bar w-24">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{progress}%</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs">
            <span
              className="px-2 py-0.5"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text-muted)',
                border: '1.5px solid var(--color-sketch)',
                borderRadius: 'var(--radius-sketch-e)',
              }}
            >
              {totalNodes} 个节点
            </span>
            <span
              className="px-2 py-0.5"
              style={{
                background: '#E8F4EC',
                color: '#5A9E7A',
                border: '1.5px solid #B5D9C4',
                borderRadius: 'var(--radius-sketch-e)',
              }}
            >
              ✓ {completedNodes} 已完成
            </span>
            {inProgressNodes > 0 && (
              <span
                className="px-2 py-0.5"
                style={{
                  background: '#FDF4E8',
                  color: '#C9A46A',
                  border: '1.5px solid #EDD5A8',
                  borderRadius: 'var(--radius-sketch-e)',
                }}
              >
                ● {inProgressNodes} 进行中
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowLearnSuggestion(true)}
            className="btn-secondary hidden sm:flex text-sm py-1.5"
          >
            <Wand2 size={14} /> Learn 生成
          </button>
          <button
            onClick={() => setShowVersionPanel(!showVersionPanel)}
            className="btn-ghost text-sm py-1.5 px-2.5"
            style={showVersionPanel ? { background: 'var(--color-bg-alt)' } : {}}
          >
            <History size={14} />
            <span className="hidden sm:inline">版本</span>
          </button>
          <button onClick={() => setShowShareModal(true)} className="btn-ghost text-sm py-1.5 px-2.5">
            <Share2 size={14} />
            <span className="hidden sm:inline">分享</span>
          </button>
          <button onClick={handleExport} className="btn-ghost text-sm py-1.5 px-2.5" title="导出为 JSON 到剪贴板">
            <Download size={14} />
            <span className="hidden sm:inline">导出</span>
          </button>
          <button onClick={handleSaveVersion} className="btn-primary text-sm py-1.5 px-3">
            <Save size={14} />
            保存
          </button>
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="flex flex-1 overflow-hidden relative">
        <NodePalette onAddNode={handleAddNode} />

        {/* React Flow 画布 */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            onEdgesDelete={onEdgesDelete}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            maxZoom={2}
            deleteKeyCode={['Delete', 'Backspace']}
            multiSelectionKeyCode="Shift"
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#D8CFBC" />
            <Controls position="bottom-right" showZoom showFitView showInteractive />
            {showMiniMap && (
              <MiniMap
                position="bottom-left"
                nodeColor={(node) => {
                  const n = node as Node<FlowNodeData>
                  if (n.data?.status === 'completed') return '#5A9E7A'
                  if (n.data?.status === 'in_progress') return '#C9A46A'
                  return '#C5BAA8'
                }}
                maskColor="rgba(250,247,242,0.85)"
              />
            )}

            {/* 快捷操作 */}
            <Panel position="top-right" className="flex flex-col gap-2">
              <button
                className="btn-ghost p-2 shadow-md"
                style={{
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-sketch)',
                  borderRadius: 'var(--radius-sketch-a)',
                }}
                title="全屏"
              >
                <Maximize2 size={16} />
              </button>
              <button
                className="btn-ghost p-2 shadow-md"
                style={{
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-sketch)',
                  borderRadius: 'var(--radius-sketch-d)',
                }}
                title="自动布局"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className="btn-ghost p-2 shadow-md"
                style={{
                  background: showMiniMap ? 'var(--color-accent-bg)' : 'var(--color-card)',
                  border: showMiniMap ? '1.5px solid var(--color-accent)' : '1.5px solid var(--color-sketch)',
                  borderRadius: 'var(--radius-sketch-d)',
                }}
                title={showMiniMap ? '隐藏预览图' : '显示预览图'}
                onClick={() => setShowMiniMap(!showMiniMap)}
              >
                <Grid size={16} style={{ color: showMiniMap ? 'var(--color-accent)' : 'inherit' }} />
              </button>
            </Panel>

            {/* 图例 + 操作提示 */}
            <Panel position="top-left">
              <div className="flex flex-col gap-2">
                {/* 循环依赖警告 — 手绘 + animate-wobble */}
                {showCycleWarning && (
                  <div
                    className="animate-wobble shadow-md px-3 py-2 text-xs flex items-center gap-2"
                    style={{
                      background: '#FDF4E8',
                      border: '2px dashed #EDD5A8',
                      borderRadius: 'var(--radius-sketch-b)',
                      color: '#C9A46A',
                    }}
                  >
                    <span className="font-sketch font-bold" style={{ color: '#9A6A20' }}>⚠ 循环依赖</span>
                    <span>连线会形成循环，无法连接</span>
                    <button onClick={() => setShowCycleWarning(false)} className="ml-1" style={{ color: '#C9A46A' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* 连线删除提示 — 手绘风格 */}
                {selectedEdgeId && (
                  <div
                    className="shadow-md px-3 py-2 text-xs flex items-center gap-2"
                    style={{
                      background: 'var(--color-card)',
                      border: '2px dashed var(--color-accent-light)',
                      borderRadius: 'var(--radius-sketch-a)',
                    }}
                  >
                    <span className="font-sketch font-bold" style={{ color: 'var(--color-accent)' }}>连线已选中</span>
                    <kbd
                      className="px-1.5 py-0.5 text-xs"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text-muted)',
                        border: '1.5px solid var(--color-sketch)',
                        borderRadius: 'var(--radius-sketch-e)',
                      }}
                    >删除键</kbd>
                    <span style={{ color: 'var(--color-text-muted)' }}>可删除</span>
                    <button
                      onClick={() => {
                        setEdges((eds) => eds.filter(e => e.id !== selectedEdgeId))
                        setSelectedEdgeId(null)
                      }}
                      className="ml-1 font-medium"
                      style={{ color: '#C06050' }}
                    >
                      × 删除
                    </button>
                  </div>
                )}

                {/* 图例面板 — 手绘风格圆角 */}
                <div
                  className="shadow-md px-3 py-2 text-xs flex items-center gap-3"
                  style={{
                    background: 'var(--color-card)',
                    border: '1.5px solid var(--color-sketch)',
                    borderRadius: 'var(--radius-sketch-c)',
                    boxShadow: '2px 3px 0 rgba(160, 140, 110, 0.08)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3"
                      style={{
                        background: '#C5BAA8',
                        borderRadius: '50% 45% 55% 48%',
                        border: '1.5px solid var(--color-sketch)',
                      }}
                    />
                    <span style={{ color: 'var(--color-text-muted)' }}>未开始</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3"
                      style={{
                        background: '#C9A46A',
                        borderRadius: '45% 50% 48% 55%',
                        border: '1.5px solid #B8944A',
                      }}
                    />
                    <span style={{ color: 'var(--color-text-muted)' }}>进行中</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3"
                      style={{
                        background: '#5A9E7A',
                        borderRadius: '48% 55% 45% 50%',
                        border: '1.5px solid #4A8E6A',
                      }}
                    />
                    <span style={{ color: 'var(--color-text-muted)' }}>已完成</span>
                  </div>
                </div>

                {/* 空画布提示 — 手绘风格 */}
                {totalNodes === 0 && (
                  <div
                    className="sketch-card sketch-b shadow-md px-4 py-3 text-sm max-w-xs animate-fade-in"
                    style={{ background: 'var(--color-accent-bg)' }}
                  >
                    <p className="font-sketch font-bold text-base" style={{ color: 'var(--color-accent-dark)' }}>
                      开始搭建你的学习流
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          </ReactFlow>

          {/* 弹窗 */}
          {showLearnSuggestion && (
            <LearnSuggestion
              topic={flowTitle}
              onAccept={handleAcceptLearnSuggestion}
              onClose={() => setShowLearnSuggestion(false)}
            />
          )}
          {showShareModal && flowIdFromUrl && (
            <ShareModal flowId={flowIdFromUrl} onClose={() => setShowShareModal(false)} />
          )}

          {/* AI 生成 loading — 手绘风格 + animate-float */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-40 backdrop-blur-[1px]">
              <div className="sketch-card sketch-c px-5 py-4 flex items-center gap-3 animate-float"
                style={{ boxShadow: '3px 5px 0 rgba(160, 140, 110, 0.12)' }}
              >
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                <div>
                  <div className="font-sketch text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    AI 正在生成学习路径...
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    分析主题、规划节点、设计路径中
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 生成错误提示 — 手绘风格 */}
          {generateError && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 shadow-lg text-xs flex items-center gap-2 z-50 animate-fade-in"
              style={{
                background: '#FAEAE8',
                color: '#C06050',
                border: '2px dashed #F0D5D0',
                borderRadius: 'var(--radius-sketch-e)',
              }}
            >
              {generateError}
              <button onClick={() => setGenerateError('')} style={{ color: '#C06050' }}>
                <X size={12} />
              </button>
            </div>
          )}

          {/* Toast 通知 — 不规整圆角 + 手绘风格 */}
          {showSaveToast && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 shadow-lg text-sm font-medium flex items-center gap-2 z-50 animate-fade-in"
              style={{
                background: 'var(--color-accent)',
                color: '#FFF8F0',
                border: '1.5px solid var(--color-accent-dark)',
                borderRadius: 'var(--radius-sketch-a)',
                boxShadow: '3px 4px 0 rgba(150, 117, 76, 0.25)',
              }}
            >
              <Save size={14} />
              {toastMessage}
            </div>
          )}
        </div>

        {/* 版本历史面板 */}
        {showVersionPanel && (
          <VersionPanel
            versions={versions}
            onRestore={handleRestoreVersion}
            onClose={() => setShowVersionPanel(false)}
          />
        )}

        {/* 节点配置面板 */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSave={handleSaveNodeConfig}
          />
        )}
      </div>
    </div>
  )
}
