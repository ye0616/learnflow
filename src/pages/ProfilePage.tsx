import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import {
  Flame, Clock, Zap, Award, ExternalLink, Github, ChevronRight,
  Star, Lock, Loader2, Sparkles, FileJson, Wand2
} from 'lucide-react'
import type { PortfolioItem, Badge as BadgeType, UserLevel } from '../types'

// ═══════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════

const LEVEL_CONFIG: Record<UserLevel, { label: string; maxXP: number; emoji: string }> = {
  beginner:    { label: '初学者', maxXP: 200,  emoji: '🌱' },
  intermediate:{ label: '进阶者', maxXP: 800,  emoji: '🌿' },
  advanced:    { label: '高级者', maxXP: 2000, emoji: '🌳' },
  expert:      { label: '专家',   maxXP: 5000, emoji: '🏅' },
  master:      { label: '大师',   maxXP: 10000,emoji: '👑' },
}

const BADGE_CATEGORY_LABELS: Record<string, string> = {
  study: '学习', streak: '坚持', project: '项目', social: '社交', skill: '技能',
}

// ═══════════════════════════════════════════
// 子组件
// ═══════════════════════════════════════════

// --- 用户信息头部卡片 ---
function ProfileHeader({ onEdit }: { onEdit: () => void }) {
  const currentUser = useAppStore(s => s.currentUser)
  const cfg = LEVEL_CONFIG[currentUser.level]
  const xpPercent = Math.min((currentUser.xp / cfg.maxXP) * 100, 100)
  const hours = Math.floor(currentUser.totalStudyTime / 60)

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, #FDFBF8 0%, #F7F2E8 100%)',
        border: '1.5px solid var(--color-sketch)',
        borderRadius: 'var(--radius-sketch-b)',
        padding: '28px 32px',
        boxShadow: '2px 3px 0 rgba(160,140,110,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <svg style={{ position: 'absolute', right: -20, top: -20, opacity: 0.04, width: 200, height: 200 }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" stroke="var(--color-accent)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        <circle cx="100" cy="100" r="60" stroke="var(--color-accent)" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="40" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
      </svg>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative', zIndex: 1 }}>
        {/* 头像 */}
        <div
          style={{
            width: 72, height: 72,
            borderRadius: 'var(--radius-sketch-a)',
            background: 'linear-gradient(135deg, #C9A46A 0%, #D4B88C 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, color: '#fff',
            boxShadow: '0 4px 12px rgba(185,145,105,0.25)',
            flexShrink: 0,
          }}
        >
          {currentUser.name.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="font-sketch" style={{ fontSize: 24, color: 'var(--color-text-primary)', margin: 0 }}>
              {currentUser.name}
            </h1>
            <span
              className="font-sketch"
              style={{
                fontSize: 12, color: 'var(--color-accent-dark)',
                background: 'var(--color-accent-bg)',
                borderRadius: 'var(--radius-sketch-e)',
                padding: '2px 10px',
                border: '1px solid var(--color-accent-light)',
              }}
            >
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          {currentUser.bio && (
            <p className="font-sketch" style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {currentUser.bio}
            </p>
          )}
          <div style={{ marginTop: 12 }}>
            {/* XP 进度条 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="font-sketch" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                ⚡ 学力值
              </span>
              <span className="font-sketch" style={{ fontSize: 11, color: 'var(--color-accent)' }}>
                {currentUser.xp} / {cfg.maxXP}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-sketch-e)',
                overflow: 'hidden',
                border: '1px solid #EDE5D5',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${xpPercent}%`,
                  background: 'linear-gradient(90deg, #C9A46A, #D4B88C)',
                  borderRadius: 'var(--radius-sketch-e)',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </div>

          {/* 数据统计 */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <StatBadge icon={<Flame size={15} />} value={`${currentUser.streak} 天`} label="连续打卡" color="#E8875A" />
            <StatBadge icon={<Clock size={15} />} value={`${hours} h`} label="学习时长" color="#5A9E7A" />
            <StatBadge icon={<Award size={15} />} value={String(currentUser.badges?.filter(b => b.unlockedAt).length || 0)} label="徽章" color="#7A6BAA" />
          </div>
        </div>

        {/* 编辑按钮 */}
        <button
          className="font-sketch"
          onClick={onEdit}
          style={{
            padding: '6px 14px',
            fontSize: 12, color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-sketch-d)',
            border: '1.5px dashed var(--color-sketch)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'var(--color-accent)'
            el.style.color = 'var(--color-accent)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'var(--color-sketch)'
            el.style.color = 'var(--color-text-secondary)'
          }}
        >
          编辑资料
        </button>
      </div>
    </div>
  )
}

function StatBadge({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <div>
        <div className="font-sketch" style={{ fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}

// --- 编辑弹窗 ---
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const [name, setName] = useState(currentUser.name)
  const [bio, setBio] = useState(currentUser.bio || '')

  const handleSave = () => {
    updateUser({ name, bio })
    onClose()
  }

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-card)',
          border: '1.5px solid var(--color-sketch)',
          borderRadius: 'var(--radius-sketch-b)',
          padding: '28px 32px',
          width: 380,
          boxShadow: '4px 6px 0 rgba(160,140,110,0.1)',
        }}
      >
        <h2 className="font-sketch" style={{ fontSize: 20, color: 'var(--color-text-primary)', marginBottom: 20 }}>
          ✏️ 编辑资料
        </h2>
        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="font-sketch" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              昵称
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px',
                borderRadius: 'var(--radius-sketch-d)',
                border: '1.5px solid var(--color-sketch)',
                background: 'var(--color-bg)',
                fontSize: 14, color: 'var(--color-text-primary)',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
          <div>
            <label className="font-sketch" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              个人简介
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '8px 12px',
                borderRadius: 'var(--radius-sketch-d)',
                border: '1.5px solid var(--color-sketch)',
                background: 'var(--color-bg)',
                fontSize: 14, color: 'var(--color-text-primary)',
                outline: 'none', fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button
            className="font-sketch"
            onClick={onClose}
            style={{
              padding: '8px 18px', fontSize: 13,
              borderRadius: 'var(--radius-sketch-d)',
              border: '1.5px solid var(--color-sketch)',
              background: 'transparent', color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            className="font-sketch"
            onClick={handleSave}
            style={{
              padding: '8px 18px', fontSize: 13,
              borderRadius: 'var(--radius-sketch-d)',
              border: 'none',
              background: 'var(--color-accent)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// --- 技能树 ---
function SkillTreeSection({ skills }: { skills: Record<string, number> }) {
  const entries = useMemo(() =>
    Object.entries(skills)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    [skills]
  )

  const getLevelColor = (v: number) => {
    if (v >= 80) return { bg: '#5A9E7A', glow: '#5A9E7A33', label: '精通' }
    if (v >= 60) return { bg: '#C9A46A', glow: '#C9A46A33', label: '熟练' }
    if (v >= 40) return { bg: '#E8875A', glow: '#E8875A33', label: '学习中' }
    return { bg: '#A89E8E', glow: '#A89E8E22', label: '入门' }
  }

  return (
    <div>
      <h2 className="font-sketch breath-hover" style={{ fontSize: 20, color: 'var(--color-text-primary)', marginBottom: 20 }}>
        🌳 技能树
      </h2>
      <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {entries.map((skill, i) => {
          const lc = getLevelColor(skill.value)
          return (
            <div key={skill.name} className="animate-stagger" style={{ animationDelay: `${i * 100}ms` }}>
              {/* 技能名 & 熟练度 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span className="font-sketch" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {skill.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="font-sketch"
                    style={{
                      fontSize: 10,
                      color: lc.bg,
                      background: `${lc.bg}15`,
                      borderRadius: 'var(--radius-sketch-e)',
                      padding: '1px 7px',
                    }}
                  >
                    {lc.label}
                  </span>
                  <span className="font-sketch" style={{ fontSize: 13, color: 'var(--color-text-muted)', minWidth: 28, textAlign: 'right' }}>
                    {skill.value}%
                  </span>
                </div>
              </div>
              {/* 进度条 + 光点动画 */}
              <div
                style={{
                  height: 10,
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sketch-e)',
                  overflow: 'hidden',
                  border: '1px solid #EDE5D5',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${skill.value}%`,
                    background: `linear-gradient(90deg, ${lc.bg}BB, ${lc.bg})`,
                    borderRadius: 'var(--radius-sketch-e)',
                    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                  }}
                >
                  {/* 发光点 */}
                  <div
                    style={{
                      position: 'absolute', right: 1, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: `0 0 6px 2px ${lc.glow}`,
                      animation: 'pulse-light 2s ease-in-out infinite',
                    }}
                  />
                  {/* 纹理 */}
                  <svg
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
                    viewBox="0 0 200 10" preserveAspectRatio="none"
                  >
                    <path d="M0 5 Q20 3 40 5 T80 5 T120 5 T160 5 T200 5" stroke="white" strokeWidth="1" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 动画 keyframes 注入 */}
      <style>{`
        @keyframes pulse-light {
          0%, 100% { opacity: 0.6; transform: translateY(-50%) scale(1); }
          50% { opacity: 1; transform: translateY(-50%) scale(1.6); }
        }
      `}</style>
    </div>
  )
}

// --- 作品集 ---
function PortfolioSection({ portfolio }: { portfolio: PortfolioItem[] }) {
  const navigate = useNavigate()
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    const text = input.trim()
    if (!text) return

    setGenerating(true)
    setError('')

    try {
      const { generatePortfolioItem } = await import('../services/aiService')
      const newItem = await generatePortfolioItem(text)
      updateUser({
        portfolio: [...portfolio, newItem],
      })
      setInput('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成失败'
      if (msg === 'NO_API_KEY') {
        setError('请先在设置页配置 AI API Key')
      } else if (msg === 'RATE_LIMIT') {
        setError('请求太频繁，请稍后再试')
      } else {
        setError('生成失败：' + msg)
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const handleExportJSON = () => {
    const exportData = {
      author: currentUser.name,
      exportedAt: new Date().toISOString(),
      items: portfolio,
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
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="font-sketch breath-hover" style={{ fontSize: 20, color: 'var(--color-text-primary)', margin: 0 }}>
          🎨 作品集
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="font-sketch"
            onClick={handleExportJSON}
            disabled={portfolio.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', fontSize: 11,
              borderRadius: 'var(--radius-sketch-e)',
              border: '1.5px solid var(--color-sketch)',
              background: 'var(--color-card)',
              color: 'var(--color-text-muted)',
              cursor: portfolio.length === 0 ? 'not-allowed' : 'pointer',
              opacity: portfolio.length === 0 ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
            title="导出为 JSON 文件，便于迁移到其他平台"
          >
            <FileJson size={12} /> JSON
          </button>
          <button
            className="font-sketch"
            onClick={() => navigate('/portfolio/builder')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 14px', fontSize: 11,
              borderRadius: 'var(--radius-sketch-e)',
              border: 'none',
              background: 'var(--color-accent)',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="从已完成项目中一键生成作品集"
          >
            <Wand2 size={12} /> 一键作品集
          </button>
        </div>
      </div>

      {/* AI 生成输入区 */}
      <div
        style={{
          background: 'var(--color-card)',
          border: '1.5px dashed var(--color-sketch)',
          borderRadius: 'var(--radius-sketch-d)',
          padding: '14px 16px',
          marginBottom: 16,
          transition: 'all 0.2s',
        }}
      >
        <div className="font-sketch" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
          ✨ 描述你的项目，AI 自动生成作品集条目
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例：用 React 做了一个天气预报网页，可以查7天天气..."
            disabled={generating}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sketch-d)',
              border: '1.5px solid var(--color-sketch)',
              background: 'var(--color-bg)',
              fontSize: 13, color: 'var(--color-text-primary)',
              outline: 'none', fontFamily: 'inherit',
              opacity: generating ? 0.5 : 1,
            }}
          />
          <button
            className="font-sketch"
            onClick={handleGenerate}
            disabled={generating || !input.trim()}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              borderRadius: 'var(--radius-sketch-d)',
              border: 'none',
              background: generating || !input.trim() ? '#DDD5C8' : 'var(--color-accent)',
              color: '#fff',
              cursor: generating || !input.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
            }}
          >
            {generating ? (
              <><Loader2 size={13} className="animate-spin" /> 生成中</>
            ) : (
              <><Sparkles size={13} /> 生成</>
            )}
          </button>
        </div>
        {error && (
          <p className="font-sketch" style={{ fontSize: 11, color: '#B86050', marginTop: 8, marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>

      <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {portfolio.map((item, i) => (
          <div
            key={item.id}
            className="animate-stagger card-lift-hover"
            style={{
              animationDelay: `${i * 100}ms`,
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-sketch)',
              borderRadius: i % 2 === 0 ? 'var(--radius-sketch-a)' : 'var(--radius-sketch-c)',
              padding: '18px 20px',
              boxShadow: '1px 2px 0 rgba(160,140,110,0.04)',
              transition: 'all 0.25s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {/* 封面图标 */}
              <div
                style={{
                  width: 48, height: 48,
                  borderRadius: 'var(--radius-sketch-a)',
                  background: 'var(--color-accent-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}
              >
                {item.coverEmoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="font-sketch" style={{ fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {item.description}
                </p>
                {/* 技术栈 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {item.techStack.map(tech => (
                    <span
                      key={tech}
                      className="font-sketch"
                      style={{
                        fontSize: 10,
                        color: 'var(--color-accent-dark)',
                        background: 'var(--color-accent-bg)',
                        borderRadius: 'var(--radius-sketch-e)',
                        padding: '2px 8px',
                        border: '1px solid #E8DFCC',
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                {/* 链接 */}
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  {item.demoUrl && (
                    <a
                      href={item.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sketch"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 12, color: 'var(--color-accent)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.gap = '8px' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.gap = '4px' }}
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
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 12, color: 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.gap = '8px' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.gap = '4px' }}
                    >
                      <Github size={13} /> 源码
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- 徽章系统 ---
function BadgesSection({ badges }: { badges: BadgeType[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(badges.map(b => b.category))
    return Array.from(cats)
  }, [badges])

  const filtered = selectedCategory
    ? badges.filter(b => b.category === selectedCategory)
    : badges

  const unlocked = badges.filter(b => b.unlockedAt).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="font-sketch breath-hover" style={{ fontSize: 20, color: 'var(--color-text-primary)', margin: 0 }}>
          🏅 成就徽章
        </h2>
        <span className="font-sketch" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {unlocked} / {badges.length} 已解锁
        </span>
      </div>

      {/* 分类筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className="font-sketch"
          onClick={() => setSelectedCategory(null)}
          style={{
            fontSize: 11, padding: '4px 12px',
            borderRadius: 'var(--radius-sketch-e)',
            border: '1px solid var(--color-sketch)',
            background: !selectedCategory ? 'var(--color-accent-bg)' : 'transparent',
            color: !selectedCategory ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className="font-sketch"
            onClick={() => setSelectedCategory(cat)}
            style={{
              fontSize: 11, padding: '4px 12px',
              borderRadius: 'var(--radius-sketch-e)',
              border: '1px solid var(--color-sketch)',
              background: selectedCategory === cat ? 'var(--color-accent-bg)' : 'transparent',
              color: selectedCategory === cat ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {BADGE_CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* 徽章网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map((badge, i) => {
          const isUnlocked = !!badge.unlockedAt
          return (
            <div
              key={badge.id}
              className="animate-stagger"
              style={{
                animationDelay: `${i * 80}ms`,
                background: isUnlocked ? 'var(--color-card)' : '#F5F2EC',
                border: isUnlocked ? '1.5px solid var(--color-sketch)' : '1.5px dashed #DDD5C8',
                borderRadius: 'var(--radius-sketch-d)',
                padding: '16px 14px',
                textAlign: 'center',
                transition: 'all 0.3s',
                opacity: isUnlocked ? 1 : 0.55,
                position: 'relative',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                if (isUnlocked) {
                  el.style.transform = 'translateY(-2px) rotate(-0.5deg)'
                  el.style.boxShadow = '2px 3px 12px rgba(160,140,110,0.1)'
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = ''
                el.style.boxShadow = ''
              }}
            >
              {/* 锁定图标 */}
              {!isUnlocked && (
                <div style={{ position: 'absolute', top: 6, right: 8, opacity: 0.3 }}>
                  <Lock size={12} />
                </div>
              )}

              {/* 徽章图标 */}
              <div style={{ fontSize: 28, marginBottom: 8, filter: isUnlocked ? 'none' : 'grayscale(0.8)' }}>
                {badge.icon}
              </div>

              {/* 徽章名 */}
              <div className="font-sketch" style={{ fontSize: 13, color: 'var(--color-text-primary)', marginBottom: 3 }}>
                {badge.name}
              </div>

              {/* 描述 */}
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                {badge.description}
              </div>

              {/* 解锁日期 */}
              {isUnlocked && (
                <div className="font-sketch" style={{ fontSize: 9, color: 'var(--color-accent)', marginTop: 8 }}>
                  ✨ {badge.unlockedAt}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// 主页面组件
// ═══════════════════════════════════════════

export default function ProfilePage() {
  const currentUser = useAppStore(s => s.currentUser)
  const [showEdit, setShowEdit] = useState(false)

  const skills = currentUser.skills || {}
  const portfolio = currentUser.portfolio || []
  const badges = currentUser.badges || []

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* 顶部标题栏 */}
      <div
        style={{
          padding: '18px 28px',
          borderBottom: '2px dashed var(--color-border)',
          background: 'var(--color-card)',
          flexShrink: 0,
        }}
      >
        <h1 className="font-sketch" style={{ fontSize: 22, color: 'var(--color-text-primary)', margin: 0 }}>
          👤 我的主页
        </h1>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 28px 40px' }}>
        {/* 用户头部 */}
        <ProfileHeader onEdit={() => setShowEdit(true)} />

        {/* 两列布局：左列=时间轴+作品集，右列=技能树+徽章 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px 32px',
            marginTop: 28,
            alignItems: 'start',
          }}
        >
          {/* 左列：作品集 */}
          <div className="space-y-8" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <PortfolioSection portfolio={portfolio} />
          </div>

          {/* 右列 */}
          <div className="space-y-8" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SkillTreeSection skills={skills} />
            <BadgesSection badges={badges} />
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  )
}
