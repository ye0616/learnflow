import { useRef, useState, useEffect, useCallback } from 'react'
import { useRoomStore } from '../../store/roomStore'
import { WhiteboardStroke, WhiteboardTextNote, WhiteboardMindNode, WhiteboardMindEdge, RoomMember, WhiteboardTool } from '../../types'
import WhiteboardToolbar from './WhiteboardToolbar'

interface Props {
  roomId: string
  members: RoomMember[]
}

let strokeIdCounter = 0
function genStrokeId() { return `stroke-${Date.now()}-${strokeIdCounter++}` }
function genTextId() { return `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
function genNodeId() { return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
function genEdgeId() { return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

export default function Whiteboard({ roomId, members }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<WhiteboardTool>('pen')
  const [activeMemberId, setActiveMemberId] = useState<string>(members[0]?.id || '')
  const [color, setColor] = useState(members[0]?.color || '#6366f1')
  const [lineWidth, setLineWidth] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState('')
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null)
  const [dpr, setDpr] = useState(1)

  const wbData = useRoomStore(s => s.rooms.find(r => r.id === roomId)?.whiteboard) || { strokes: [], texts: [], mindNodes: [], mindEdges: [] }
  const addStroke = useRoomStore(s => s.addStroke)
  const addText = useRoomStore(s => s.addText)
  const addMindNode = useRoomStore(s => s.addMindNode)
  const addMindEdge = useRoomStore(s => s.addMindEdge)
  const updateMindNode = useRoomStore(s => s.updateMindNode)
  const deleteMindNode = useRoomStore(s => s.deleteMindNode)
  const clearWhiteboard = useRoomStore(s => s.clearWhiteboard)

  // 当前正在绘制的临时线
  const currentStrokeRef = useRef<WhiteboardStroke | null>(null)
  const draggingNodeRef = useRef<{ id: string; ox: number; oy: number } | null>(null)

  // 同步颜色
  useEffect(() => {
    const m = members.find(m => m.id === activeMemberId)
    if (m) setColor(m.color)
  }, [activeMemberId, members])

  // Canvas 尺寸适配
  useEffect(() => {
    const resize = () => {
      const el = containerRef.current
      if (!el) return
      const canvas = canvasRef.current
      if (!canvas) return
      const d = window.devicePixelRatio || 1
      setDpr(d)
      const w = el.clientWidth
      const h = el.clientHeight
      canvas.width = w * d
      canvas.height = h * d
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // 绘制
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    // 网格背景
    const W = canvas.width / dpr
    const H = canvas.height / dpr
    ctx.strokeStyle = '#e8e4dc'
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // 画边
    wbData.mindEdges.forEach(edge => {
      const from = wbData.mindNodes.find(n => n.id === edge.fromNodeId)
      const to = wbData.mindNodes.find(n => n.id === edge.toNodeId)
      if (!from || !to) return
      ctx.beginPath()
      ctx.strokeStyle = edge.color
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      drawCurvedLine(ctx, from.x, from.y, to.x, to.y)
      ctx.stroke()
      ctx.setLineDash([])
    })

    // 画笔迹
    wbData.strokes.forEach(s => {
      if (s.points.length < 2) return
      ctx.save()
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 0.85
      if (s.type === 'rect' || s.type === 'circle') {
        const [a, b] = s.points
        if (s.type === 'rect') {
          ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
        } else {
          const rx = (b.x - a.x) / 2
          const ry = (b.y - a.y) / 2
          ctx.beginPath()
          ctx.ellipse(a.x + rx, a.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      } else {
        ctx.beginPath()
        ctx.moveTo(s.points[0].x, s.points[0].y)
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y)
        }
        ctx.stroke()
      }
      ctx.restore()
    })

    // 文字
    wbData.texts.forEach(t => {
      ctx.save()
      ctx.font = `${t.fontSize}px Inter, sans-serif`
      ctx.fillStyle = t.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t.text, t.x, t.y)
      ctx.restore()
    })

    // 思维导图节点
    wbData.mindNodes.forEach(node => {
      const isLinking = linkingFrom === node.id
      ctx.save()
      ctx.fillStyle = node.color + '18'
      ctx.strokeStyle = isLinking ? '#f59e0b' : node.color
      ctx.lineWidth = isLinking ? 3 : 2
      ctx.beginPath()
      ctx.roundRect(node.x - 60, node.y - 22, 120, 44, 12)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#3A342A'
      ctx.font = '13px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.text, node.x, node.y)
      // 成员标记色块
      ctx.fillStyle = node.color
      ctx.fillRect(node.x - 56, node.y - 18, 8, 8)
      ctx.restore()
    })

    ctx.restore()
  }, [wbData, dpr, linkingFrom])

  useEffect(() => {
    draw()
  }, [draw])

  // 事件处理
  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e)
    if (e.button !== 0) return // 仅左键

    // 思维导图模式
    if (tool === 'mindmap') {
      // 检测点击思维导图节点
      const hitNode = wbData.mindNodes.find(n =>
        Math.abs(n.x - pos.x) < 60 && Math.abs(n.y - pos.y) < 22
      )
      if (hitNode) {
        if (e.shiftKey) {
          // Shift+点击删除节点
          deleteMindNode(roomId, hitNode.id)
          return
        }
        if (linkingFrom) {
          if (linkingFrom !== hitNode.id) {
            addMindEdge(roomId, { id: genEdgeId(), fromNodeId: linkingFrom!, toNodeId: hitNode.id, color: hitNode.color })
          }
          setLinkingFrom(null)
        } else {
          setLinkingFrom(hitNode.id)
        }
        return
      }
      // 没有命中节点 → 创建新节点
      if (linkingFrom) {
        setLinkingFrom(null)
      }
      const newNode: WhiteboardMindNode = {
        id: genNodeId(),
        memberId: activeMemberId,
        memberColor: color,
        x: pos.x,
        y: pos.y,
        text: '新节点',
        color,
      }
      addMindNode(roomId, newNode)
      return
    }

    // 文字模式
    if (tool === 'text') {
      setTextInput(pos)
      setTextValue('')
      return
    }

    // 画笔/形状模式
    setIsDrawing(true)
    const s: WhiteboardStroke = {
      id: genStrokeId(),
      memberId: activeMemberId,
      memberColor: color,
      type: tool as WhiteboardStroke['type'],
      points: [pos],
      color,
      lineWidth,
    }
    currentStrokeRef.current = s
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentStrokeRef.current || tool === 'text') return
    const pos = getCanvasPos(e)

    if (tool === 'pen') {
      // 连续记录点
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [...currentStrokeRef.current.points, pos],
      }
    } else {
      // 矩形/圆形：更新终点
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [currentStrokeRef.current.points[0], pos],
      }
    }

    // 实时绘制
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)
    draw()
    // 叠加绘制当前笔迹
    const s = currentStrokeRef.current
    ctx.save()
    ctx.strokeStyle = s.color
    ctx.lineWidth = s.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 0.85
    if (s.type === 'rect') {
      const [a, b] = s.points
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
    } else if (s.type === 'circle') {
      const [a, b] = s.points
      const rx = (b.x - a.x) / 2
      const ry = (b.y - a.y) / 2
      ctx.beginPath()
      ctx.ellipse(a.x + rx, a.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y)
      }
      ctx.stroke()
    }
    ctx.restore()
    ctx.restore()
  }

  const handleMouseUp = () => {
    if (isDrawing && currentStrokeRef.current) {
      const s = currentStrokeRef.current
      if (s.points.length >= 2 || (s.type !== 'pen' && s.points.length === 2)) {
        addStroke(roomId, s)
      }
      currentStrokeRef.current = null
    }
    setIsDrawing(false)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (tool !== 'mindmap') return
    const pos = getCanvasPos(e)
    // 检测是否双击节点以编辑文字
    const hitNode = wbData.mindNodes.find(n =>
      Math.abs(n.x - pos.x) < 60 && Math.abs(n.y - pos.y) < 22
    )
    if (hitNode) {
      const newText = window.prompt('编辑节点文字', hitNode.text)
      if (newText !== null && newText.trim()) {
        updateMindNode(roomId, hitNode.id, { text: newText.trim() })
      }
    }
  }

  // 导出为图片
  const exportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    // 先清掉网格，导出纯内容
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = canvas.width
    tmpCanvas.height = canvas.height
    const tmpCtx = tmpCanvas.getContext('2d')!
    tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height)
    // 重新绘制不含网格的内容
    tmpCtx.scale(dpr, dpr)
    wbData.strokes.forEach(s => {
      if (s.points.length < 2) return
      tmpCtx.save()
      tmpCtx.strokeStyle = s.color
      tmpCtx.lineWidth = s.lineWidth
      tmpCtx.lineCap = 'round'
      tmpCtx.lineJoin = 'round'
      tmpCtx.globalAlpha = 0.85
      if (s.type === 'rect' || s.type === 'circle') {
        const [a, b] = s.points
        if (s.type === 'rect') tmpCtx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
        else {
          const rx = (b.x - a.x) / 2; const ry = (b.y - a.y) / 2
          tmpCtx.beginPath(); tmpCtx.ellipse(a.x + rx, a.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2); tmpCtx.stroke()
        }
      } else {
        tmpCtx.beginPath(); tmpCtx.moveTo(s.points[0].x, s.points[0].y)
        for (let i = 1; i < s.points.length; i++) tmpCtx.lineTo(s.points[i].x, s.points[i].y)
        tmpCtx.stroke()
      }
      tmpCtx.restore()
    })
    wbData.texts.forEach(t => {
      tmpCtx.save(); tmpCtx.font = `${t.fontSize}px Inter, sans-serif`; tmpCtx.fillStyle = t.color
      tmpCtx.textAlign = 'center'; tmpCtx.textBaseline = 'middle'; tmpCtx.fillText(t.text, t.x, t.y); tmpCtx.restore()
    })
    wbData.mindNodes.forEach(node => {
      tmpCtx.save(); tmpCtx.fillStyle = node.color + '18'; tmpCtx.strokeStyle = node.color; tmpCtx.lineWidth = 2
      tmpCtx.beginPath(); tmpCtx.roundRect(node.x - 60, node.y - 22, 120, 44, 12); tmpCtx.fill(); tmpCtx.stroke()
      tmpCtx.fillStyle = '#3A342A'; tmpCtx.font = '13px Inter, sans-serif'; tmpCtx.textAlign = 'center'; tmpCtx.textBaseline = 'middle'
      tmpCtx.fillText(node.text, node.x, node.y); tmpCtx.restore()
    })
    wbData.mindEdges.forEach(edge => {
      const from = wbData.mindNodes.find(n => n.id === edge.fromNodeId)
      const to = wbData.mindNodes.find(n => n.id === edge.toNodeId)
      if (!from || !to) return
      tmpCtx.beginPath(); tmpCtx.strokeStyle = edge.color; tmpCtx.lineWidth = 2; tmpCtx.setLineDash([6, 4])
      drawCurvedLine(tmpCtx, from.x, from.y, to.x, to.y); tmpCtx.stroke(); tmpCtx.setLineDash([])
    })

    const link = document.createElement('a')
    link.download = `白板-${new Date().toLocaleDateString()}.png`
    link.href = tmpCanvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#f8f6f0' }}>
      <WhiteboardToolbar
        tool={tool}
        setTool={(t: WhiteboardTool) => {
          setTool(t)
          setLinkingFrom(null)
          setTextInput(null)
        }}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        members={members}
        activeMemberId={activeMemberId}
        setActiveMemberId={setActiveMemberId}
        onClear={() => { if (window.confirm('确定清空白板吗？')) clearWhiteboard(roomId) }}
        onExport={exportImage}
        linkingFrom={linkingFrom}
        onCancelLink={() => setLinkingFrom(null)}
      />
      <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onContextMenu={e => e.preventDefault()}
        />
        {/* 文字输入框 */}
        {textInput && (
          <div
            className="absolute z-10"
            style={{ left: textInput.x - 60, top: textInput.y - 14 }}
          >
            <input
              autoFocus
              className="w-[120px] px-2 py-1 text-sm rounded border-2 outline-none"
              style={{
                borderColor: color,
                background: '#fff',
                color: 'var(--color-text-primary)',
              }}
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && textValue.trim()) {
                  addText(roomId, {
                    id: genTextId(),
                    memberId: activeMemberId,
                    memberColor: color,
                    x: textInput.x,
                    y: textInput.y,
                    text: textValue.trim(),
                    fontSize: 16,
                    color,
                  })
                  setTextInput(null)
                }
                if (e.key === 'Escape') setTextInput(null)
              }}
              onBlur={() => {
                if (textValue.trim()) {
                  addText(roomId, {
                    id: genTextId(),
                    memberId: activeMemberId,
                    memberColor: color,
                    x: textInput.x,
                    y: textInput.y,
                    text: textValue.trim(),
                    fontSize: 16,
                    color,
                  })
                }
                setTextInput(null)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function drawCurvedLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.5
  const cp1x = x1 + dx
  const cp1y = y1
  const cp2x = x2 - dx
  const cp2y = y2
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2)
}
