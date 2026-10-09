import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StudyRoom, RoomMember, MemberTask, RoomStatus, WhiteboardStroke, WhiteboardTextNote, WhiteboardMindNode, WhiteboardMindEdge, WhiteboardData, SharedResource, ResourceBookmark, ResourceCategory } from '../types'

let roomIdCounter = 1

function generateRoomId(): string {
  return `room-${Date.now()}-${roomIdCounter++}`
}

function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function generateResourceId(): string {
  return `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface RoomState {
  rooms: StudyRoom[]
  activeRoomId: string | null
  selectedDeskIndex: number | null  // 当前选中的工位索引

  // Actions
  createRoom: (title: string, description: string, members: RoomMember[]) => StudyRoom
  getActiveRoom: () => StudyRoom | null
  setActiveRoom: (id: string | null) => void
  selectDesk: (index: number | null) => void
  updateTaskStatus: (roomId: string, memberId: string, taskId: string, status: MemberTask['status']) => void
  updateTaskNote: (roomId: string, memberId: string, taskId: string, note: string) => void
  addTask: (roomId: string, memberId: string, title: string) => void
  addTaskWithDate: (roomId: string, memberId: string, title: string, dueDate: string) => void
  moveMember: (roomId: string, memberId: string, newDeskIndex: number) => void
  setRoomStatus: (roomId: string, status: RoomStatus) => void
  deleteRoom: (roomId: string) => void

  // 白板操作
  addStroke: (roomId: string, stroke: WhiteboardStroke) => void
  addText: (roomId: string, text: WhiteboardTextNote) => void
  addMindNode: (roomId: string, node: WhiteboardMindNode) => void
  addMindEdge: (roomId: string, edge: WhiteboardMindEdge) => void
  updateMindNode: (roomId: string, nodeId: string, updates: Partial<WhiteboardMindNode>) => void
  deleteMindNode: (roomId: string, nodeId: string) => void
  clearWhiteboard: (roomId: string) => void

  // 资源书架操作
  addResource: (roomId: string, resource: Omit<SharedResource, 'id' | 'createdAt' | 'aiTagged' | 'tags' | 'category'>) => SharedResource
  deleteResource: (roomId: string, resourceId: string) => void
  updateResourceTags: (roomId: string, resourceId: string, tags: string[], category: ResourceCategory) => void
  addBookmark: (roomId: string, memberId: string, resourceId: string) => void
  removeBookmark: (roomId: string, memberId: string, resourceId: string) => void
  getMemberBookmarks: (roomId: string, memberId: string) => SharedResource[]
  autoTagPending: (roomId: string) => SharedResource[]
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      rooms: [],
      activeRoomId: null,
      selectedDeskIndex: null,

      createRoom: (title, description, members) => {
        const room: StudyRoom = {
          id: generateRoomId(),
          title,
          description,
          members: members.map((m, i) => ({
            ...m,
            deskIndex: i, // 按顺序分配工位 0~N
            tasks: m.tasks.map(t => ({
              ...t,
              id: t.id || generateTaskId(),
            })),
          })),
          status: 'studying',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          whiteboard: { strokes: [], texts: [], mindNodes: [], mindEdges: [] },
          sharedResources: [],
          bookmarks: [],
        }
        set(s => ({ rooms: [...s.rooms, room], activeRoomId: room.id }))
        return room
      },

      getActiveRoom: () => {
        const { rooms, activeRoomId } = get()
        return rooms.find(r => r.id === activeRoomId) ?? null
      },

      setActiveRoom: (id) => set({ activeRoomId: id, selectedDeskIndex: null }),

      selectDesk: (index) => set({ selectedDeskIndex: index }),

      updateTaskStatus: (roomId, memberId, taskId, status) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            return {
              ...r,
              updatedAt: new Date().toISOString(),
              members: r.members.map(m => {
                if (m.id !== memberId) return m
                return {
                  ...m,
                  tasks: m.tasks.map(t =>
                    t.id === taskId ? { ...t, status } : t
                  ),
                }
              }),
            }
          }),
        }))
      },

      updateTaskNote: (roomId, memberId, taskId, note) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            return {
              ...r,
              updatedAt: new Date().toISOString(),
              members: r.members.map(m => {
                if (m.id !== memberId) return m
                return {
                  ...m,
                  tasks: m.tasks.map(t =>
                    t.id === taskId ? { ...t, note } : t
                  ),
                }
              }),
            }
          }),
        }))
      },

      addTask: (roomId, memberId, title) => {
        const newTask: MemberTask = {
          id: generateTaskId(),
          title,
          status: 'todo',
          dueDate: new Date().toISOString().split('T')[0],
        }
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            return {
              ...r,
              updatedAt: new Date().toISOString(),
              members: r.members.map(m => {
                if (m.id !== memberId) return m
                return { ...m, tasks: [...m.tasks, newTask] }
              }),
            }
          }),
        }))
      },

      addTaskWithDate: (roomId, memberId, title, dueDate) => {
        const newTask: MemberTask = {
          id: generateTaskId(),
          title,
          status: 'todo',
          dueDate,
        }
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            return {
              ...r,
              updatedAt: new Date().toISOString(),
              members: r.members.map(m => {
                if (m.id !== memberId) return m
                return { ...m, tasks: [...m.tasks, newTask] }
              }),
            }
          }),
        }))
      },

      moveMember: (roomId, memberId, newDeskIndex) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            // 检查目标工位是否已被占用
            const occupied = r.members.find(
              m => m.id !== memberId && m.deskIndex === newDeskIndex
            )
            if (occupied) return r
            return {
              ...r,
              updatedAt: new Date().toISOString(),
              members: r.members.map(m =>
                m.id === memberId ? { ...m, deskIndex: newDeskIndex } : m
              ),
            }
          }),
        }))
      },

      setRoomStatus: (roomId, status) => {
        set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId ? { ...r, status, updatedAt: new Date().toISOString() } : r
          ),
        }))
      },

      deleteRoom: (roomId) => {
        set(s => ({
          rooms: s.rooms.filter(r => r.id !== roomId),
          activeRoomId: s.activeRoomId === roomId ? null : s.activeRoomId,
          selectedDeskIndex: null,
        }))
      },

      // 白板操作
      addStroke: (roomId, stroke) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const wb = r.whiteboard || { strokes: [], texts: [], mindNodes: [], mindEdges: [] }
            return { ...r, updatedAt: new Date().toISOString(), whiteboard: { ...wb, strokes: [...wb.strokes, stroke] } }
          }),
        }))
      },

      addText: (roomId, text) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const wb = r.whiteboard || { strokes: [], texts: [], mindNodes: [], mindEdges: [] }
            return { ...r, updatedAt: new Date().toISOString(), whiteboard: { ...wb, texts: [...wb.texts, text] } }
          }),
        }))
      },

      addMindNode: (roomId, node) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const wb = r.whiteboard || { strokes: [], texts: [], mindNodes: [], mindEdges: [] }
            return { ...r, updatedAt: new Date().toISOString(), whiteboard: { ...wb, mindNodes: [...wb.mindNodes, node] } }
          }),
        }))
      },

      addMindEdge: (roomId, edge) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const wb = r.whiteboard || { strokes: [], texts: [], mindNodes: [], mindEdges: [] }
            // 避免重复边
            const exists = wb.mindEdges.some(e =>
              (e.fromNodeId === edge.fromNodeId && e.toNodeId === edge.toNodeId) ||
              (e.fromNodeId === edge.toNodeId && e.toNodeId === edge.fromNodeId)
            )
            if (exists) return r
            return { ...r, updatedAt: new Date().toISOString(), whiteboard: { ...wb, mindEdges: [...wb.mindEdges, edge] } }
          }),
        }))
      },

      updateMindNode: (roomId, nodeId, updates) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const wb = r.whiteboard || { strokes: [], texts: [], mindNodes: [], mindEdges: [] }
            return {
              ...r, updatedAt: new Date().toISOString(),
              whiteboard: { ...wb, mindNodes: wb.mindNodes.map(n => n.id === nodeId ? { ...n, ...updates } : n) },
            }
          }),
        }))
      },

      deleteMindNode: (roomId, nodeId) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const wb = r.whiteboard || { strokes: [], texts: [], mindNodes: [], mindEdges: [] }
            return {
              ...r, updatedAt: new Date().toISOString(),
              whiteboard: {
                ...wb,
                mindNodes: wb.mindNodes.filter(n => n.id !== nodeId),
                mindEdges: wb.mindEdges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId),
              },
            }
          }),
        }))
      },

      clearWhiteboard: (roomId) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            return { ...r, updatedAt: new Date().toISOString(), whiteboard: { strokes: [], texts: [], mindNodes: [], mindEdges: [] } }
          }),
        }))
      },

      // ══════════════════════════════════════
      // 资源书架操作
      // ══════════════════════════════════════
      addResource: (roomId, data) => {
        const resource: SharedResource = {
          id: generateResourceId(),
          title: data.title,
          type: data.type,
          url: data.url,
          description: data.description,
          tags: [],
          category: 'other',
          addedBy: data.addedBy,
          addedByName: data.addedByName,
          createdAt: new Date().toISOString(),
          aiTagged: false,
        }
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const resources = r.sharedResources || []
            return { ...r, updatedAt: new Date().toISOString(), sharedResources: [...resources, resource] }
          }),
        }))
        return resource
      },

      deleteResource: (roomId, resourceId) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const resources = (r.sharedResources || []).filter(res => res.id !== resourceId)
            const bookmarks = (r.bookmarks || []).filter(b => b.resourceId !== resourceId)
            return { ...r, updatedAt: new Date().toISOString(), sharedResources: resources, bookmarks }
          }),
        }))
      },

      updateResourceTags: (roomId, resourceId, tags, category) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const resources = (r.sharedResources || []).map(res =>
              res.id === resourceId ? { ...res, tags, category, aiTagged: true } : res
            )
            return { ...r, updatedAt: new Date().toISOString(), sharedResources: resources }
          }),
        }))
      },

      addBookmark: (roomId, memberId, resourceId) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const bookmarks = r.bookmarks || []
            // 避免重复
            if (bookmarks.some(b => b.memberId === memberId && b.resourceId === resourceId)) return r
            const newBm: ResourceBookmark = { memberId, resourceId, bookmarkedAt: new Date().toISOString() }
            return { ...r, updatedAt: new Date().toISOString(), bookmarks: [...bookmarks, newBm] }
          }),
        }))
      },

      removeBookmark: (roomId, memberId, resourceId) => {
        set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const bookmarks = (r.bookmarks || []).filter(
              b => !(b.memberId === memberId && b.resourceId === resourceId)
            )
            return { ...r, updatedAt: new Date().toISOString(), bookmarks }
          }),
        }))
      },

      getMemberBookmarks: (roomId, memberId) => {
        const room = get().rooms.find(r => r.id === roomId)
        if (!room) return []
        const bmIds = (room.bookmarks || [])
          .filter(b => b.memberId === memberId)
          .map(b => b.resourceId)
        return (room.sharedResources || []).filter(r => bmIds.includes(r.id))
      },

      autoTagPending: (roomId) => {
        const room = get().rooms.find(r => r.id === roomId)
        if (!room) return []
        return (room.sharedResources || []).filter(r => !r.aiTagged)
      },
    }),
    { name: 'learnflow_rooms' }
  )
)
