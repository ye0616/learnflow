import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import {
  ArrowLeft, Share2, QrCode, Download, ExternalLink,
  FileJson, Copy, Check, Monitor, Globe,
} from 'lucide-react'
import QRCode from 'qrcode'
import type { PortfolioItem } from '../types'

// ═══════════════════════════════════════════
// 自定义域名传入
// ═══════════════════════════════════════════

interface LocationState {
  title?: string
  bio?: string
  items?: PortfolioItem[]
}

// ═══════════════════════════════════════════
// 子组件：分享卡片
// ═══════════════════════════════════════════

function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [qrDataURL, setQrDataURL] = useState('')
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [customDomain, setCustomDomain] = useState('')
  const shareUrl = customDomain || url

  // 生成二维码
  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#5A4A3A', light: '#FDFBF8' },
    }).then(setQrDataURL)
  }, [shareUrl])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    if (!qrDataURL) return
    const a = document.createElement('a')
    a.href = qrDataURL
    a.download = 'portfolio-qrcode.png'
    a.click()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 400, maxWidth: '90vw',
          background: '#FDFBF8',
          borderRadius: 'var(--radius-sketch-b)',
          border: '1.5px solid var(--color-sketch)',
          padding: '28px 24px',
          boxShadow: '4px 6px 24px rgba(0,0,0,0.1)',
        }}
      >
        <h3 className="font-sketch" style={{ fontSize: 18, color: 'var(--color-text-primary)', marginBottom: 18, textAlign: 'center' }}>
          📱 分享作品集
        </h3>

        {/* 二维码 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {qrDataURL ? (
            <img
              src={qrDataURL}
              alt="作品集二维码"
              style={{
                width: 160, height: 160,
                borderRadius: 'var(--radius-sketch-d)',
                border: '1.5px solid var(--color-sketch)',
                padding: 6,
                background: '#fff',
              }}
            />
          ) : (
            <div style={{
              width: 160, height: 160, margin: '0 auto',
              borderRadius: 'var(--radius-sketch-d)',
              border: '1.5px dashed var(--color-sketch)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)', fontSize: 13,
            }}>
              生成中...
            </div>
          )}
        </div>

        {/* 链接复制 */}
        <div className="font-sketch" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
          作品集链接
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <input
            value={shareUrl}
            readOnly
            style={{
              flex: 1, padding: '8px 10px',
              borderRadius: 'var(--radius-sketch-d)',
              border: '1.5px solid var(--color-sketch)',
              background: 'var(--color-bg)',
              fontSize: 12, color: 'var(--color-text-primary)',
              outline: 'none', fontFamily: 'monospace',
            }}
          />
          <button
            className="font-sketch"
            onClick={handleCopyLink}
            style={{
              padding: '8px 14px', fontSize: 12,
              borderRadius: 'var(--radius-sketch-d)',
              border: 'none', background: copied ? '#7A9B76' : 'var(--color-accent)',
              color: '#fff', cursor: 'pointer',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
            }}
          >
            {copied ? <><Check size={13} /> 已复制</> : <><Copy size={13} /> 复制</>}
          </button>
        </div>

        {/* 自定义域名 */}
        <div className="font-sketch" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
          自定义域名（可选）
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <input
            value={customDomain}
            onChange={e => setCustomDomain(e.target.value)}
            placeholder="https://my-portfolio.vercel.app"
            style={{
              flex: 1, padding: '8px 10px',
              borderRadius: 'var(--radius-sketch-d)',
              border: '1.5px solid var(--color-sketch)',
              background: 'var(--color-bg)',
              fontSize: 12, color: 'var(--color-text-primary)',
              outline: 'none', fontFamily: 'monospace',
            }}
          />
        </div>

        {/* 下载按钮 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="font-sketch"
            onClick={handleDownloadQR}
            style={{
              flex: 1, padding: '9px 16px', fontSize: 13,
              borderRadius: 'var(--radius-sketch-d)',
              border: '1.5px solid var(--color-sketch)',
              background: 'var(--color-card)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.2s',
            }}
          >
            <Download size={14} /> 下载二维码
          </button>
          <button
            className="font-sketch"
            onClick={onClose}
            style={{
              flex: 1, padding: '9px 16px', fontSize: 13,
              borderRadius: 'var(--radius-sketch-d)',
              border: '1.5px solid var(--color-sketch)',
              background: 'var(--color-card)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            关闭
          </button>
        </div>

        <div className="font-sketch" style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 12, textAlign: 'center' }}>
          💡 可将二维码嵌入简历、GitHub、社交平台等
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// 主页面组件
// ═══════════════════════════════════════════

export default function PortfolioShowcase() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAppStore()

  const state = (location.state as LocationState) || {}
  const title = state.title || currentUser.name + ' 的作品集'
  const bio = state.bio || currentUser.bio || ''
  const items = state.items || currentUser.portfolio || []

  const [showShare, setShowShare] = useState(false)
  const shareUrl = useMemo(() => {
    const base = window.location.origin
    return `${base}/portfolio/showcase`
  }, [])

  const handleExportJSON = () => {
    const exportData = {
      title,
      bio,
      author: currentUser.name,
      exportedAt: new Date().toISOString(),
      items,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-${currentUser.name}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* 顶部栏 */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          padding: '14px 28px',
          borderBottom: '2px dashed var(--color-border)',
          background: 'var(--color-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            className="font-sketch"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--color-text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={14} /> 返回
          </button>
          <h1 className="font-sketch" style={{ fontSize: 18, color: 'var(--color-text-primary)', margin: 0 }}>
            ✨ 作品集展示
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="font-sketch"
            onClick={handleExportJSON}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', fontSize: 12, color: 'var(--color-text-secondary)',
              background: 'var(--color-card)', border: '1.5px solid var(--color-sketch)',
              borderRadius: 'var(--radius-sketch-d)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <FileJson size={13} /> 导出 JSON
          </button>
          <button
            className="font-sketch"
            onClick={() => setShowShare(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 16px', fontSize: 12,
              background: 'var(--color-accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sketch-d)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <QrCode size={13} /> 分享
          </button>
        </div>
      </div>

      {/* 主内容 */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 28px 60px', width: '100%' }}>
        {/* 个人头部 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {/* 头像 */}
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--color-accent-bg)',
              margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: 'var(--color-accent)',
              border: '2px solid var(--color-sketch)',
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <h1
            className="font-sketch"
            style={{
              fontSize: 28, color: 'var(--color-text-primary)',
              margin: '0 0 6px', letterSpacing: '-0.5px',
            }}
          >
            {title}
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--color-text-muted)',
            maxWidth: 420, margin: '0 auto', lineHeight: 1.6,
          }}>
            {bio}
          </p>

          {/* 统计条 */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 16,
              marginTop: 16, padding: '8px 20px',
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-sketch-d)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div className="font-sketch" style={{ fontSize: 18, color: 'var(--color-text-primary)' }}>
                {items.length}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>作品</div>
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="font-sketch" style={{ fontSize: 18, color: 'var(--color-text-primary)' }}>
                {new Set(items.flatMap(i => i.techStack)).size}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>技术栈</div>
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="font-sketch" style={{ fontSize: 18, color: 'var(--color-text-primary)' }}>
                {currentUser.level === 'beginner' ? '🌱' : currentUser.level === 'intermediate' ? '🌿' : currentUser.level === 'advanced' ? '🌳' : '🏅'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                {currentUser.level === 'beginner' ? '初学者' : currentUser.level === 'intermediate' ? '进阶者' : currentUser.level === 'advanced' ? '高级者' : '专家'}
              </div>
            </div>
          </div>
        </div>

        {/* 作品分隔 */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          <span className="font-sketch" style={{ fontSize: 14, color: 'var(--color-text-muted)', padding: '0 20px' }}>
            🎨 作品展示
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        {/* 作品列表 */}
        {items.length === 0 ? (
          <div
            className="font-sketch"
            style={{
              textAlign: 'center', padding: '48px 20px',
              color: 'var(--color-text-muted)', fontSize: 14,
            }}
          >
            暂无作品，去个人主页添加吧！
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                className="card-lift-hover"
                style={{
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-sketch)',
                  borderRadius: i % 2 === 0 ? 'var(--radius-sketch-a)' : 'var(--radius-sketch-c)',
                  overflow: 'hidden',
                  boxShadow: '1px 2px 0 rgba(160,140,110,0.03)',
                  transition: 'all 0.25s',
                }}
              >
                {/* 模拟截图区 */}
                <div
                  style={{
                    height: 120,
                    background: `linear-gradient(135deg, ${['#6B8E9B', '#7A9B76', '#B8956A', '#8B7F8B', '#5A7A8A', '#9B8A6B'][i % 6]} 0%, ${['#E8D5B7', '#F0E6D3', '#F7F2E8', '#F2E8F0', '#E8EFF3', '#F5F0E6'][i % 6]} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* 模拟 UI 元素 */}
                  <div
                    style={{
                      position: 'absolute', top: 8, left: 12, right: 12,
                      height: 8, borderRadius: 4,
                      background: 'rgba(255,255,255,0.3)',
                      width: '40%',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute', top: 24, left: 12, right: 12,
                      height: 6, borderRadius: 3,
                      background: 'rgba(255,255,255,0.2)',
                      width: '30%',
                    }}
                  />
                  <div style={{
                    width: 80, height: 40,
                    borderRadius: 6, background: 'rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 20 }}>{item.coverEmoji}</span>
                  </div>
                </div>

                {/* 内容区 */}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="font-sketch" style={{ fontSize: 18, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.55 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* 技术栈 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {item.techStack.map(tech => (
                      <span
                        key={tech}
                        className="font-sketch"
                        style={{
                          fontSize: 11,
                          color: 'var(--color-accent-dark)',
                          background: 'var(--color-accent-bg)',
                          borderRadius: 'var(--radius-sketch-e)',
                          padding: '3px 10px',
                          border: '1px solid #E8DFCC',
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* 链接 */}
                  {(item.demoUrl || item.repoUrl) && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                      {item.demoUrl && (
                        <a
                          href={item.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-sketch"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 13, color: 'var(--color-accent)',
                            textDecoration: 'none',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sketch-d)',
                            border: '1.5px solid var(--color-accent)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <ExternalLink size={13} /> 在线 Demo
                        </a>
                      )}
                      {item.repoUrl && (
                        <a
                          href={item.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-sketch"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 13, color: 'var(--color-text-secondary)',
                            textDecoration: 'none',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sketch-d)',
                            border: '1.5px solid var(--color-sketch)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Globe size={13} /> 源码
                        </a>
                      )}
                    </div>
                  )}

                  {/* 日期 */}
                  {item.date && (
                    <div className="font-sketch" style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 10, opacity: 0.6 }}>
                      📅 {item.date}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 页脚 */}
        <div
          style={{
            textAlign: 'center', marginTop: 48, paddingTop: 24,
            borderTop: '1px dashed var(--color-border)',
          }}
        >
          <p className="font-sketch" style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
            Made with ❤️ by {currentUser.name} · Powered by LearnFlow
          </p>
        </div>
      </div>

      {/* 分享对话框 */}
      {showShare && (
        <ShareModal
          url={shareUrl}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
