import { Construction, Users, Map, Hammer, User, BarChart3 } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: React.ReactNode
  phase: number
  features?: string[]
}

function PlaceholderPage({ title, description, icon, phase, features }: PlaceholderPageProps) {
  return (
    <div
      className="flex-1 flex items-center justify-center p-8"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="text-center max-w-md">
        {/* 图标 */}
        <div
          className="w-20 h-20 flex items-center justify-center mx-auto mb-6 animate-float sketch-b"
          style={{
            background: 'var(--color-bg-alt)',
            border: '2px solid var(--color-sketch)',
            color: 'var(--color-accent)',
          }}
        >
          {icon}
        </div>

        {/* 标题 */}
        <h2 className="text-2xl mb-2 font-sketch" style={{ color: 'var(--color-text-primary)' }}>
          {title}
          <span className="sketch-underline" />
        </h2>

        {/* 描述 */}
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>

        {/* 计划功能列表 */}
        {features && (
          <div className="text-left sketch-card sketch-c p-4 mb-6">
            <div
              className="text-sm font-semibold mb-3 flex items-center gap-2 font-sketch"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <Construction size={14} style={{ color: 'var(--color-accent)' }} />
              计划功能
            </div>
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li
                  key={i}
                  className="text-sm flex items-start gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span
                    className="font-sketch mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    ~
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 开发中标签 */}
        <div
          className="inline-flex items-center gap-2 sketch-card sketch-e px-4 py-2 text-sm font-medium font-sketch animate-wobble"
          style={{
            color: 'var(--color-accent)',
            border: '2px dashed var(--color-border)',
          }}
        >
          <Construction size={14} />
          第 {phase} 阶段开发中...
        </div>
      </div>
    </div>
  )
}

export function VirtualRoom() {
  return (
    <PlaceholderPage
      title="虚拟学习室"
      icon={<Users size={36} />}
      phase={2}
      description="将在线学习变成「同一个房间里协作」的空间化体验，包含工位系统、白板、代码编辑器等功能区。"
      features={[
        'PixiJS 2D 渲染引擎，个人工位可自由拖动',
        '工位进度墙 + 小组对比视图',
        '共享白板 + 多人实时协同代码编辑器',
        'Socket.io 实时状态同步和聊天',
        'Learn 助教巡视机制和答疑服务',
        '任务看板 + 成就动画系统',
      ]}
    />
  )
}

export function StudyMap() {
  return (
    <PlaceholderPage
      title="学习地图"
      icon={<Map size={36} />}
      phase={2}
      description="以校园平面图为底图，实时显示正在学习的同学，通过进度和方向智能匹配队友，一键组队。"
      features={[
        '校园地图 + 彩色学习光点实时展示',
        '智能匹配算法（学习方向+进度+时段+风格）',
        '一键发起组队邀请',
        '学习地图动态滚动条',
        '组队后自动对齐学习流和创建学习室',
      ]}
    />
  )
}

export function Workshop() {
  return (
    <PlaceholderPage
      title="项目工坊"
      icon={<Hammer size={36} />}
      phase={3}
      description="学习流的终点连接实战项目，从理论到作品无缝衔接。20+ 项目模板，在线 IDE，一键生成作品集。"
      features={[
        '20+ 常见项目模板（爬虫、博客、数据分析等）',
        '分步指导 + 代码骨架 + 坑点提示',
        '内置在线 IDE，支持代码运行预览',
        'Learn 实时读取代码上下文并提供建议',
        '作品展示墙 + 一键作品集生成',
        '支持自定义域名和二维码分享',
      ]}
    />
  )
}

export function Profile() {
  return (
    <PlaceholderPage
      title="个人主页"
      icon={<User size={36} />}
      phase={3}
      description="展示你的学习旅程、技能树、完成的项目作品集，以及游戏化成就系统。"
      features={[
        '学习历程时间轴（关键里程碑滚动展示）',
        '技能树点亮动画',
        '作品集页面 + 在线 Demo 链接',
        '游戏化等级和徽章系统',
        '生成可分享的学习成就海报',
      ]}
    />
  )
}

export function Report() {
  return (
    <PlaceholderPage
      title="学习报告"
      icon={<BarChart3 size={36} />}
      phase={3}
      description="每日、每周、每月的学习数据深度分析，Learn 智能评价和建议，帮你持续优化学习策略。"
      features={[
        '每日小结：完成节点数、时长、专注度曲线',
        '每周报告：时长趋势折线图、科目饼图、技能雷达',
        '小组进度报告：贡献排行、瓶颈分析、效率对比',
        'Learn 综合评价与个性化建议',
        '导出 PDF / 生成分享海报',
      ]}
    />
  )
}

