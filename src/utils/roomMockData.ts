import { RoomMember } from '../types'

// 预设成员（可选成员池）
export const PRESET_MEMBERS: RoomMember[] = [
  {
    id: 'mem-1',
    name: 'Ariel',
    color: '#6366f1',
    tasks: [],
    deskIndex: 0,
  },
  {
    id: 'mem-2',
    name: '小明',
    color: '#f59e0b',
    tasks: [],
    deskIndex: 1,
  },
  {
    id: 'mem-3',
    name: '小红',
    color: '#ef4444',
    tasks: [],
    deskIndex: 2,
  },
  {
    id: 'mem-4',
    name: '大壮',
    color: '#10b981',
    tasks: [],
    deskIndex: 3,
  },
  {
    id: 'mem-5',
    name: '小美',
    color: '#ec4899',
    tasks: [],
    deskIndex: 4,
  },
  {
    id: 'mem-6',
    name: '阿杰',
    color: '#06b6d4',
    tasks: [],
    deskIndex: 5,
  },
]

// 示例项目模板
export const EXAMPLE_PROJECTS = [
  {
    title: 'React 官网重构',
    members: ['Ariel', '小明', '小红'],
    tasks: {
      Ariel: ['页面布局组件', '路由配置'],
      小明: ['API 接口对接', '数据流管理'],
      小红: ['UI 组件库搭建', '样式系统'],
    },
  },
  {
    title: '数据分析期末项目',
    members: ['大壮', '小美', '阿杰'],
    tasks: {
      大壮: ['数据清洗', '特征工程'],
      小美: ['可视化报表', '交互仪表盘'],
      阿杰: ['模型训练', '结果分析报告'],
    },
  },
]

// 快速任务模板
export const TASK_TEMPLATES = [
  '需求分析',
  '技术方案设计',
  '编码实现',
  '代码审查',
  '单元测试',
  '集成测试',
  '文档编写',
  '部署上线',
]
