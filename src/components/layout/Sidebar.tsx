import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import {
  LayoutDashboard, BookOpen, Settings, Lightbulb, Sparkles, Home, User
} from 'lucide-react'
import { hasApiKey } from '../../services/aiService'

const NAV_ITEMS = [
  { path: '/', icon: <LayoutDashboard size={18} />, label: '仪表盘' },
  { path: '/flows', icon: <BookOpen size={18} />, label: '课程' },
  { path: '/room', icon: <Home size={18} />, label: '学习室' },
  { path: '/profile', icon: <User size={18} />, label: '我的' },
  { path: '/settings', icon: <Settings size={18} />, label: '设置' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAppStore()
  const apiKeySet = hasApiKey()

  return (
    <div
      className="flex flex-col h-full flex-shrink-0 relative"
      style={{
        width: 186,
        background: 'var(--color-sidebar)',
        clipPath: 'polygon(0 0, 92% 0, 96% 2%, 98% 5%, 100% 8%, 98% 12%, 96% 16%, 99% 20%, 100% 24%, 97% 28%, 95% 32%, 99% 36%, 100% 40%, 97% 44%, 96% 48%, 100% 52%, 98% 56%, 96% 60%, 99% 64%, 100% 68%, 97% 72%, 95% 76%, 99% 80%, 100% 84%, 97% 88%, 96% 92%, 100% 96%, 98% 100%, 0 100%)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* 暖光底层 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, rgba(210,195,170,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(196,149,90,0.06) 0%, transparent 50%)
          `,
        }}
      />

      {/* 涂鸦装饰：小植物 */}
      <svg
        className="absolute pointer-events-none"
        style={{ left: 8, bottom: 90, width: 28, opacity: 0.09 }}
        viewBox="0 0 28 36"
        fill="none"
      >
        <path d="M14 34 L14 18 Q14 8 8 4 M14 18 Q18 12 24 8 M10 12 Q8 8 10 4" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* 小星星装饰 */}
      <svg
        className="absolute pointer-events-none animate-wobble"
        style={{ right: 18, top: 120, width: 14, opacity: 0.12 }}
        viewBox="0 0 14 14"
        fill="none"
      >
        <path d="M7 1 L8.5 5 L13 5.5 L9.5 8.5 L10.5 13 L7 10.5 L3.5 13 L4.5 8.5 L1 5.5 L5.5 5 Z"
          stroke="#B8956A" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* 小咖啡杯装饰 */}
      <svg
        className="absolute pointer-events-none"
        style={{ right: 12, bottom: 50, width: 16, opacity: 0.08 }}
        viewBox="0 0 24 24" fill="none"
      >
        <path d="M4 20 L4 8 Q4 6 6 6 L16 6 Q18 6 18 8 L18 18 Q18 20 16 20 L6 20 Q4 20 4 18Z" stroke="#8B7355" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M18 9 Q21 9 21 11.5 Q21 14 18 14" stroke="#8B7355" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M8 3 Q9 1 10 3" stroke="#8B7355" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M12 2.5 Q13 0 14 2.5" stroke="#8B7355" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>

      {/* ===== Logo 区域 ===== */}
      <div className="relative px-4 pt-6 pb-4" style={{ zIndex: 1 }}>
        <div
          className="font-sketch flex items-center gap-1.5"
          style={{ fontSize: 22, color: 'var(--color-text-primary)', lineHeight: 1.1, letterSpacing: '-0.5px' }}
        >
          LearnFlow
        </div>
        <div
          className="font-sketch mt-0.5"
          style={{ fontSize: 11, color: 'var(--color-text-muted)', transform: 'rotate(-0.5deg)' }}
        >
          智能学习规划
        </div>
        {/* 手绘下划线 */}
        <div style={{ marginTop: 6, height: 2, background: 'none' }}>
          <svg width="100%" height="8" viewBox="0 0 120 8" preserveAspectRatio="none" fill="none">
            <path d="M0 4 Q15 1 30 4 T60 4 T90 4 T120 4" stroke="var(--color-sketch)" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* ===== 用户头像 ===== */}
      <div className="px-4 pb-4 relative" style={{ zIndex: 1 }}>
        <div
          className="flex items-center gap-2.5 cursor-pointer p-2 -mx-1"
          style={{ borderRadius: 'var(--radius-sketch-c)' }}
          onClick={() => navigate('/profile')}
        >
          {/* 手绘头像 */}
          <div
            style={{
              width: 44, height: 44,
              borderRadius: '50% 42% 58% 45%',
              border: '2px solid var(--color-sketch)',
              background: '#F5EDE0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="9" r="5" stroke="var(--color-accent)" strokeWidth="1.5" fill="#FAF0E4" />
              <path d="M9 8 Q11 5 14 7 Q17 5 19 8" stroke="var(--color-accent)" strokeWidth="1" fill="none" strokeLinecap="round" />
              <circle cx="11.5" cy="10" r="1.5" fill="rgba(196,149,90,0.15)" />
              <circle cx="16.5" cy="10" r="1.5" fill="rgba(196,149,90,0.15)" />
              <circle cx="12" cy="9.5" r="0.8" fill="var(--color-accent)" />
              <circle cx="16" cy="9.5" r="0.8" fill="var(--color-accent)" />
              <path d="M12.5 12 Q14 13.5 15.5 12" stroke="var(--color-accent)" strokeWidth="1" fill="none" strokeLinecap="round" />
              <path d="M7 24 Q10 18 14 18 Q18 18 21 24" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="font-sketch text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {currentUser?.name || '学习者'}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              等级 {currentUser?.level || 3}
            </div>
          </div>
        </div>
      </div>

      {/* 虚线分隔 */}
      <div className="mx-4 mb-3 relative" style={{ zIndex: 1 }}>
        <svg width="100%" height="6" viewBox="0 0 120 6" preserveAspectRatio="none" fill="none">
          <path d="M0 3 Q20 1 40 3 T80 3 T120 3" stroke="var(--color-sketch)" strokeWidth="1" strokeLinecap="round" strokeDasharray="4 3" fill="none" opacity="0.5" />
        </svg>
      </div>

      {/* ===== 导航菜单 ===== */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 relative" style={{ zIndex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && item.path !== '/settings' && item.path !== '/editor' && location.pathname.startsWith(item.path))
          const isSettings = item.path === '/settings'
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                if (item.path === '/') {
                  // 仪表盘滚动容器是内层 div，需要直接操作 DOM
                  setTimeout(() => {
                    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
                  }, 0)
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all duration-200"
              style={{
                color: isActive ? 'var(--color-accent-dark)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-accent-bg)' : 'transparent',
                borderRadius: 'var(--radius-sketch-a)',
                border: isActive ? '1.5px solid var(--color-sketch)' : '1.5px solid transparent',
                transform: isActive ? 'rotate(-0.4deg)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(196,149,90,0.06)'
                  e.currentTarget.style.color = 'var(--color-text-primary)'
                  e.currentTarget.style.transform = 'translateX(2px) rotate(-0.3deg)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                  e.currentTarget.style.transform = 'none'
                }
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 5, height: 5,
                    background: 'var(--color-accent)',
                    borderRadius: '50% 42% 55% 48%',
                    opacity: 0.7,
                  }}
                />
              )}
              <span style={{ color: isActive ? 'var(--color-accent)' : 'inherit', paddingLeft: isActive ? 8 : 0 }}>
                {item.icon}
              </span>
              <span className="font-sketch" style={{ fontSize: 15 }}>
                {item.label}
              </span>
              {isSettings && (
                <span
                  style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%',
                    background: apiKeySet ? '#5A9E7A' : 'var(--color-text-muted)',
                    opacity: 0.8,
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* 底部区域 */}
      <div className="relative px-4 py-4" style={{ zIndex: 1 }}>
        <svg width="100%" height="8" viewBox="0 0 120 8" preserveAspectRatio="none" fill="none">
          <path d="M0 4 Q15 1 30 4 T60 4 T90 4 T120 4" stroke="var(--color-sketch)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
        </svg>
        <div className="font-sketch text-center mt-1 flex items-center justify-center gap-1.5" style={{ fontSize: 10, color: 'var(--color-text-muted)', opacity: 0.45 }}>
          <Lightbulb size={10} />
          每天进步一点点
        </div>
      </div>
    </div>
  )
}
