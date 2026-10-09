import { useNavigate } from 'react-router-dom'
import { Plus, Users, Clock, Target, Trash2, ArrowRight, Sparkles, ClipboardList } from 'lucide-react'
import { useRoomStore } from '../store/roomStore'
import { StudyRoom } from '../types'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getRoomProgress(room: StudyRoom) {
  let total = 0
  let done = 0
  room.members.forEach(m => {
    m.tasks.forEach(t => {
      total++
      if (t.status === 'done') done++
    })
  })
  return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
}

function RoomCard({ room, onEnter, onDelete }: { room: StudyRoom; onEnter: () => void; onDelete: () => void }) {
  const progress = getRoomProgress(room)
  const isActive = room.status === 'studying'

  return (
    <div
      className="sketch-card group cursor-pointer"
      style={{ borderRadius: 'var(--radius-sketch-a)' }}
    >
      <div className="p-5 flex flex-col gap-4">
        {/* 顶部：标题 + 状态 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="font-semibold text-base truncate"
                style={{ color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}
              >
                {room.title}
              </h3>
              {isActive && (
                <span
                  className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: '#10b98115',
                    color: '#10b981',
                    border: '1px solid #10b98130',
                  }}
                >
                  进行中
                </span>
              )}
            </div>
            {room.description && (
              <p
                className="text-sm truncate"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {room.description}
              </p>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
            title="删除"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* 中间：成员头像列表 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {room.members.slice(0, 6).map(m => (
            <span
              key={m.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: m.color }}
              title={m.name}
            >
              {m.name[0]}
            </span>
          ))}
          {room.members.length > 6 && (
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text-muted)',
              }}
            >
              +{room.members.length - 6}
            </span>
          )}
          <span
            className="text-xs ml-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {room.members.length} 人
          </span>
        </div>

        {/* 底部：统计信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(room.updatedAt)}
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList size={12} />
              {progress.done}/{progress.total} 任务
            </span>
          </div>

          {/* 进度条 */}
          <div className="flex items-center gap-2">
            <div
              className="w-16 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--color-border-light)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percent}%`,
                  background: progress.percent >= 100
                    ? '#10b981'
                    : progress.percent > 0
                    ? '#f59e0b'
                    : 'var(--color-sketch)',
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {progress.percent}%
            </span>
          </div>
        </div>

        {/* 进入按钮 */}
        <button
          onClick={onEnter}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm"
        >
          <span>进入学习室</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

export default function RoomListPage() {
  const navigate = useNavigate()
  const { rooms, deleteRoom } = useRoomStore()

  const handleDelete = (roomId: string) => {
    if (window.confirm('确定要删除这个学习室吗？任务记录将丢失。')) {
      deleteRoom(roomId)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}
            >
              小组学习室
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              创建自习室，和组员一起专注学习，实时同步任务进度
            </p>
          </div>
          <button
            onClick={() => navigate('/room/new')}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <Plus size={17} />
            <span>新建自习室</span>
          </button>
        </div>

        {/* 列表 */}
        {rooms.length === 0 ? (
          <div
            className="sketch-card p-12 text-center"
            style={{ borderRadius: 'var(--radius-sketch-a)' }}
          >
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{ background: 'var(--color-accent-bg)' }}
            >
              <Sparkles size={28} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              还没有学习室
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              创建你的第一个小组自习室，和组员一起高效学习
            </p>
            <button
              onClick={() => navigate('/room/new')}
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              <Plus size={17} />
              <span>创建第一个学习室</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms
              .slice()
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onEnter={() => navigate(`/room/${room.id}`)}
                  onDelete={() => handleDelete(room.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
