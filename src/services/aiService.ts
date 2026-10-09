import { FlowNodeData, NodeType, RecommendationItem, SharedResource, ResourceCategory, DailyPlan, PortfolioItem } from '../types'

// ===== API Key 管理 =====

const STORAGE_KEY = 'learnflow_ai_key'

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key)
}

export function removeApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasApiKey(): boolean {
  return !!getApiKey().trim()
}

// ===== 硅基流动 SiliconFlow API（国内直连，支持浏览器直调）=====

const MODEL = 'Qwen/Qwen2.5-14B-Instruct'
const BASE_URL = 'https://api.siliconflow.cn/v1/chat/completions'

async function callSiliconFlow(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('NO_API_KEY')
  }

  const resp = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10),
      ],
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    }),
  })

  if (!resp.ok) {
    if (resp.status === 429) {
      throw new Error('RATE_LIMIT')
    }
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('INVALID_KEY')
    }
    const errBody = await resp.text().catch(() => '')
    try {
      const errData = JSON.parse(errBody)
      const msg = errData?.error?.message || errData?.message || errBody
      throw new Error(msg)
    } catch {
      throw new Error(errBody || `API_ERROR (${resp.status})`)
    }
  }

  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('EMPTY_RESPONSE')

  return text.trim()
}

// ===== 乱码修复 =====

/** AI 模型偶尔会输出生僻汉字，替换回正确字符 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GARBLE_MAP: Record<string, string> = {
  '叚': '要',
  '叄': '建',
  '叅': '能',
  '叆': '可',
  '叇': '让',
  '旪': '时',
  '吔': '吧',
} as any

/** 修复中文重复字：定定 → 定, 到到 → 到 */
const DUPLICATE_RE = /([\u4e00-\u9fff])\1{1,}/g

/** 清理 AI 回复中的乱码和重复字 */
export function fixGarbledText(text: string): string {
  let fixed = text
  // 1. 替换已知生僻乱码字符
  for (const [bad, good] of Object.entries(GARBLE_MAP)) {
    fixed = fixed.split(bad).join(good)
  }
  // 2. 修复连续重复的中文字（定定 → 定, 到到 → 到）
  fixed = fixed.replace(DUPLICATE_RE, '$1')
  // 3. 修复数字后缺少空格：1定 → 1 定
  fixed = fixed.replace(/(\d)([\u4e00-\u9fff])/g, '$1 $2')
  return fixed
}

// ===== Markdown 清理 =====

/** 清除 AI 回复中可能残留的 markdown 格式，保留段落结构 */
export function cleanMarkdown(text: string): string {
  const cleaned = fixGarbledText(text)
  return cleaned
    .replace(/\*\*(.+?)\*\*/g, '$1')    // 粗体 **text** → text
    .replace(/\*(.+?)\*/g, '$1')         // 斜体 *text* → text
    .replace(/^#{1,6}\s+/gm, '')        // 标题 ## xxx → xxx
    .replace(/^[-*]\s+/gm, '')           // 列表 - xxx 或 * xxx → xxx
    .replace(/^希望这些(建议|方法|内容|信息|答案|回复|思路).*帮到[\u4e00-\u9fff]*[！!]?\s*$/gm, '')
    .replace(/^祝[\u4e00-\u9fff]*[！!]?\s*$/gm, '')
    .replace(/^[\u4e00-\u9fff]*加油[！!]?\s*$/gm, '')
    .replace(/^有问题(随时|可以|尽管)[\u4e00-\u9fff]*[~～]?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')         // 多余空行压缩为单空行
    .trim()
}

// ===== Learn 对话 =====

export interface LearnContext {
  userName?: string
  totalFlows?: number
  completedNodes?: number
  totalNodes?: number
  recentTopics?: string[]
}

function buildChatSystem(ctx?: LearnContext): string {
  let contextSection = ''
  if (ctx) {
    const parts: string[] = []
    if (ctx.userName) parts.push(`- 当前用户：${ctx.userName}`)
    if (ctx.totalFlows && ctx.totalFlows > 0) {
      parts.push(`- 已有 ${ctx.totalFlows} 个学习流`)
    }
    if (ctx.totalNodes && ctx.totalNodes > 0) {
      const pct = ctx.completedNodes ? Math.round((ctx.completedNodes / ctx.totalNodes) * 100) : 0
      parts.push(`- 学习进度：${ctx.completedNodes || 0}/${ctx.totalNodes} 个节点已完成 (${pct}%)`)
    }
    if (ctx.recentTopics && ctx.recentTopics.length > 0) {
      parts.push(`- 最近学习主题：${ctx.recentTopics.slice(0, 3).join('、')}`)
    }
    if (parts.length > 0) {
      contextSection = `\n\n## 用户当前学习情况\n${parts.join('\n')}`
    }
  }

  return `你是 Learn，LearnFlow 学习平台的智能学习助手。

## 你的身份
你是一个亲切、有料的学习伙伴，像一个懂你的学长/学姐。你的风格是：温和但不啰嗦，有条理但不死板，偶尔可以有一点点幽默。

## 你能做什么
1. **知识问答** — 用户问你某个概念/知识点，你简洁清晰地解释
2. **学习推荐** — 用户说"不知道学什么"，你根据他的学习情况推荐下一步
3. **学习建议** — 给学习方法、时间管理、效率提升的建议
4. **简短确认** — 用户说要创建学习流时，你只用一句话确认即可（不超过30字），不需要给具体建议

## 格式规则（非常重要！）
- 禁止使用任何 markdown 格式：不要用粗体(用**包裹)、斜体(用*包裹)、标题(##)、列表(-) 等
- 用自然的短句表达，不同要点之间用空行隔开，形成清晰的段落
- 每个段落控制在 1-2 句话，保持短小易读
- 换行即分段，不要把所有内容写在一大段里

## 输出质量（非常重要！）
- 必须使用标准简体中文汉字，不要使用生僻字或异体字
- 不要出现连续重复的汉字（如"定定"），每个字只用一次
- 数字和中文之间加空格（如"1 开始学习"而不是"1开始学习"）

## 对话规则
- 用中文回答，自然口语化
- 回答简洁，控制在 50-150 字之间
- 不要说"作为AI助手"之类的套话
- 结尾不要加"希望对你有帮助""祝你学习顺利""加油"之类的客套话，说完内容就停
- 推荐学习内容时要具体，结合用户当前进度${contextSection}`
}

export async function chatWithLearn(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  context?: LearnContext
): Promise<string> {
  return callSiliconFlow(buildChatSystem(context), history.slice(-10).concat([{ role: 'user', content: message }]))
}

// ===== 学习流生成 =====

interface GeneratedNode {
  id: string
  type: NodeType
  label: string
  description: string
  estimatedTime: number
  recommendations?: string  // AI 生成的推荐资料（文本格式，待解析）
}

interface GeneratedEdge {
  source: string
  target: string
}

interface GeneratedFlow {
  nodes: GeneratedNode[]
  edges: GeneratedEdge[]
}

const FLOW_SYSTEM = `
你是一个顶级的学习路径规划专家，精通教育心理学和课程设计。你设计的每个学习流都必须符合学习科学原理，让用户能够高效、系统地掌握目标主题。

## 核心设计原则（你必须严格遵守）

1. **脚手架原则（Scaffolding）**：从易到难，每一步都建立在上一步的基础上，不能出现"断层"
2. **螺旋上升**：重要概念要在不同节点中反复出现，每次深度递增
3. **多元智能**：结合听、看、做多种学习方式，照顾不同学习风格
4. **即时反馈**：每个知识模块后必须有练习或测验，避免"学完就忘"
5. **真实应用**：理论知识必须配合实际项目或案例，避免"纸上谈兵"

## 5种节点类型（用途清晰定义）

- **knowledge（知识节点）**：讲解核心概念、原理、理论。必须是"可理解"的——用类比、例子、图示来解释抽象概念。每个知识节点只讲1-2个核心概念，不能贪多。
- **practice（练习节点）**：动手练习，巩固刚刚学到的知识。必须是"可操作"的——给出具体练习题、编程题、或者操作步骤。练习难度要和刚学的内容匹配。
- **quiz（测验节点）**：阶段性检验掌握程度。用选择题、简答题、或"教给别人"的方式检验。放在每2-4个知识节点之后。
- **project（项目节点）**：综合实战项目，把多个知识点串联起来。必须是"可完成"的——范围适中，有清晰的起点和终点，能在1-3小时内完成。
- **custom（自定义节点）**：用户自定义内容，用于插入个人笔记、参考资料、或特殊需求。

## 学习路径设计规则（最高优先级）

1. **【绝对不能跑题】** 用户说"学Python"，你生成的每个节点都必须和Python直接相关。不能出现"学Python先学C语言基础"这种跑题内容。

2. **【先分析后生成】** 在生成节点之前，你必须在"大脑里"先思考：
   - 学这个主题的**最小前置知识**是什么？（如果用户可能不懂，必须先补）
   - 这个主题的**核心知识点**有哪些？（按难度排序）
   - 哪些知识点**必须按顺序学**？（有依赖关系的不能乱序）
   - 哪些可以**并行学习**？（独立的分支可以同时进行）
   - 如何在学习中**保持动机**？（穿插有趣的项目和小胜利）

3. **【难度梯度】** 整体难度必须"低→中→高"平滑上升：
   - 前1/3：基础知识，建立信心
   - 中1/3：核心内容，深入理解
   - 后1/3：高级主题，综合应用

4. **【知识依赖】** 如果B知识点依赖A，那么A必须在B之前。用edges表达这种依赖关系。

5. **【并行分支】** 如果X和Y之间没有依赖关系，可以并行学习。例如：
   - 学前端时，"HTML基础"和"CSS基础"可以并行
   - 用多条edges从同一个前置节点连到多个并行节点
   - 并行分支在合适的位置用quiz或project汇合

6. **【节点类型交替】** 避免连续3个以上同类型节点。理想节奏：
   - knowledge → practice → knowledge → practice → quiz → knowledge → project → ...

7. **【测验频率】** 每2-4个知识节点后插入一个quiz，防止知识遗忘。

8. **【项目驱动】** 如果主题适合做项目，至少安排2个项目节点（中期小项目 + 后期综合项目）。

9. **【节点数量】** 8-15个节点。太少覆盖不全，太多显得杂乱。

10. **【标签和描述质量】**
    - label：简洁有力，5-15字，必须是"具体名词/动词短语"，不能虚
      - ✅ 好的label：「变量和数据类型」「if条件判断」「猜数字游戏」
      - ❌ 差的label：「Python基础」「进阶内容」「实战练习」
    - description：补充说明，15-40字，说明"学完这个节点能做什么"
      - ✅ 好的description：「理解变量的概念和常见数据类型，能声明变量并赋值」
      - ❌ 差的description：「学习基础知识」「掌握进阶内容」

11. **【预估时间合理性】**
    - knowledge：30-60分钟（讲透1-2个概念）
    - practice：45-90分钟（做10-20道练习题）
    - quiz：15-30分钟（5-10道题）
    - project：120-360分钟（完整实现一个小项目）
    - custom：30-120分钟（根据用户自定义内容）

## 【强制要求】推荐资料（recommendations 字段）

⚠️ **每个节点必须包含 recommendations 字段，这是强制要求，不可省略！**

每个节点必须给出具体、真实、可操作的推荐资料。这些推荐是用户"学这个节点时真正用得上的资源"。

**格式要求（必须严格遵守）**：
recommendations 字段的值是一个字符串，每行一条推荐，格式为：
[类型] 标题 - 说明

类型只能是以下之一：书籍、视频、网站、课程、工具、其他

**示例**：
[书籍] 《深入理解计算机系统》 - 布莱恩特著，系统讲解计算机底层原理
[网站] LeetCode (https://leetcode.com) - 算法练习首选平台，题目分类清晰
[视频] 《MIT 6.001》 - B站可搜，经典课程录像，深入浅出

**根据节点类型推荐对应内容**：

1. **knowledge（知识节点）**——推荐帮助"理解概念"的资源：
   - 2-3本书籍（经典教材、入门书、参考书）
   - 1-2个视频课程（B站、Coursera、edX、慕课网等平台的**具体课程名称**）
   - ⚠️ 不要只说"推荐B站视频"，必须给出**具体视频标题**

2. **practice（练习节点）**——推荐"练手"的资源：
   - 2-3个练习平台（LeetCode、牛客、Codecademy、freeCodeCamp等，**给出具体平台名称**）
   - 1-2本练习册或习题集
   - ⚠️ 不要只说"多做练习"，必须给出**具体平台或书籍名称**

3. **quiz（测验节点）**——推荐"自测"的资源：
   - 具体的测验网站或题库（如牛客网、ExamXYZ、等等）
   - 如果主题是编程，推荐OJ平台的具体题目编号或名称

4. **project（项目节点）**——推荐"做项目"的参考：
   - 1-2个具体的项目教程或开源项目（给出项目名称、GitHub链接如果知道的话）
   - 相关的工具或框架文档

5. **custom（自定义节点）**——根据用户写的内容，给出1-2条最相关的推荐。

**推荐资料质量要求（非常重要！）**：
- ✅ 必须给出**具体名称**（书名、课程名、平台名），不能泛泛而谈
- ✅ 推荐的理由要**说清楚为什么推荐**（这本书好在哪？这个视频适合谁？）
- ✅ 如果知道**真实链接**，写上（不确定的话可以不写，但不要编造）
- ❌ 不要说"推荐一些学习资料"——这等于没说
- ❌ 不要说"可以参考相关书籍"——必须给出书名
- ❌ 不要编造不存在的书名、课程名、或链接

**【错误示例】**（你绝对不能这样写）：
- "推荐一些编程练习网站" ❌（太泛泛）
- "可以参考相关书籍" ❌（不具体）
- "B站有很多相关教程" ❌（没给出具体视频名）

**【正确示例】**（你必须这样写）：
- [网站] LeetCode (https://leetcode.com) - 算法练习首选平台，题目按难度和标签分类 ✅
- [视频] 《Python编程快速上手》 - B站UP主"编程不良人"，适合零基础入门 ✅
- [书籍] 《Python编程：从入门到实践》 - Eric Matthes著，有大量实例和项目 ✅

## 输出格式

只返回纯JSON，不要用markdown代码块包裹。JSON结构如下：

{
  "nodes": [
    {
      "id": "n1",
      "type": "knowledge",
      "label": "具体节点标题（5-15字）",
      "description": "学完这个节点能做什么（15-40字）",
      "estimatedTime": 45,
      "recommendations": "[书籍] 《具体书名》 - 作者，推荐理由\n[视频] 《具体视频标题》 - 平台，特点说明"
    }
  ],
  "edges": [
    {"source": "n1", "target": "n2"}
  ]
}

⚠️ **再次强调**：
1. 每个节点都必须有 recommendations 字段（文本格式，每行一条）
2. label必须具体，不能虚
3. description要说清楚"能做什么"
4. 节点的难度必须按顺序递增
5. 只返回JSON，不要有任何解释文字！
`

// 解析推荐资料文本为结构化数据
function parseRecommendations(text: string): RecommendationItem[] {
  if (!text || !text.trim()) return []

  const items: RecommendationItem[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)

  for (const line of lines) {
    // 匹配格式：[类型] 标题 - 说明
    // 类型可能是：书籍、视频、网站、课程、工具、其他
    const match = line.match(/^\[(:?书籍|视频|网站|课程|工具|其他)\]\s*(.+)$/)
    if (!match) continue

    const typeStr = match[1]
    let rest = match[2].trim()

    // 映射类型
    let type: RecommendationItem['type'] = 'other'
    if (typeStr === '书籍') type = 'book'
    else if (typeStr === '视频') type = 'video'
    else if (typeStr === '网站') type = 'website'
    else if (typeStr === '课程') type = 'course'
    else if (typeStr === '工具') type = 'tool'

    // 分离标题和说明（用 " - " 分隔）
    let title = rest
    let description: string | undefined

    const sepIndex = rest.indexOf(' - ')
    if (sepIndex > 0) {
      title = rest.substring(0, sepIndex).trim()
      description = rest.substring(sepIndex + 3).trim()
    }

    // 从标题中提取 URL（如果在括号中）
    let url: string | undefined
    const urlInTitle = title.match(/\(https?:\/\/[^\s\)]+\)/)
    if (urlInTitle) {
      url = urlInTitle[0].slice(1, -1) // 移除括号
      title = title.replace(/\(https?:\/\/[^\s\)]+\)/, '').trim()
    }

    // 如果从说明中没找到 URL，尝试从说明中提取
    if (!url && description) {
      const urlInDesc = description.match(/https?:\/\/[^\s\)\]]+/)
      if (urlInDesc) {
        url = urlInDesc[0]
      }
    }

    if (title) {
      items.push({
        type,
        title,
        url,
        description: description || undefined
      })
    }
  }

  return items
}

function buildFlowPrompt(topic: string): string {
  return `主题：${topic}\n\n要求：\n- 所有节点的 label 和 description 必须只包含与「${topic}」直接相关的内容\n- 如果主题是化学，节点里不能出现"Python""编程"等词\n- 如果主题是英语，节点里不能出现"Python""算法"等词\n- 请直接返回 JSON，不要有任何解释文字\n\n请生成：`
}

export async function generateFlowWithAI(topic: string): Promise<GeneratedFlow> {
  const userMsg = { role: 'user' as const, content: buildFlowPrompt(topic) }
  const raw = await callSiliconFlow(FLOW_SYSTEM, [userMsg], { temperature: 0.6 })

  // 清理可能的 markdown 代码块包裹
  let cleaned = raw
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  const data = JSON.parse(cleaned) as GeneratedFlow

  if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
    throw new Error('INVALID_STRUCTURE')
  }

  // 验证并修正节点
  const validTypes: NodeType[] = ['knowledge', 'practice', 'quiz', 'project', 'custom']

  data.nodes = data.nodes.map((n, i) => ({
    id: n.id || `n${i + 1}`,
    type: validTypes.includes(n.type) ? n.type : 'knowledge',
    label: String(n.label || `节点 ${i + 1}`).slice(0, 20),
    description: String(n.description || '').slice(0, 100),
    estimatedTime: Math.max(10, Math.min(180, Number(n.estimatedTime) || 30)),
    recommendations: n.recommendations || undefined, // 保留 AI 生成的推荐资料
  }))

  // 验证连线引用的节点 id 都存在
  const nodeIds = new Set(data.nodes.map(n => n.id))
  data.edges = (data.edges || []).filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target) && e.source !== e.target
  )

  // 如果没有连线，自动按顺序连接
  if (data.edges.length === 0 && data.nodes.length > 1) {
    data.edges = data.nodes.slice(0, -1).map((n, i) => ({
      source: n.id,
      target: data.nodes[i + 1].id,
    }))
  }

  return data
}

// ===== 将 AI 生成的数据转换为 React Flow 节点和边 =====

export function convertToFlowData(
  generated: GeneratedFlow,
  _flowTitle: string
): {
  nodes: { id: string; type: string; position: { x: number; y: number }; data: FlowNodeData }[]
  edges: { id: string; source: string; target: string }[]
} {
  const COLS = 4
  const NODE_W = 240
  const NODE_H = 100
  const GAP_X = 60
  const GAP_Y = 80

  const nodes = generated.nodes.map((n, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    return {
      id: n.id,
      type: 'flowNode',
      position: {
        x: 80 + col * (NODE_W + GAP_X),
        y: 80 + row * (NODE_H + GAP_Y),
      },
      data: {
        id: n.id,
        type: n.type,
        label: n.label,
        description: n.description,
        estimatedTime: n.estimatedTime,
        recommendations: n.recommendations ? parseRecommendations(n.recommendations) : undefined,
        status: 'not_started' as const,
        progress: 0,
      } satisfies FlowNodeData,
    }
  })

  const edges = generated.edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
  }))

  return { nodes, edges }
}

// ===== 资源自动打标签 =====

const TAG_SYSTEM = `你是一个学习资源分类助手。你需要为给定的学习资源打上合适的标签和分类。

## 分类选项（只能选一个）
frontend（前端）、backend（后端）、ai（人工智能）、design（设计）、math（数学）、language（语言）、exam（考试）、other（其他）

## 标签规则
- 输出3-5个中文标签，精准概括资源主题
- 标签要简短（2-6字），如：React、数据结构、英语语法
- 优先使用领域通用术语

## 输出格式
只返回纯JSON，不要任何解释文字：
{"category": "frontend", "tags": ["React", "Hooks", "状态管理"]}`

interface TagResult {
  category: ResourceCategory
  tags: string[]
}

export async function autoTagResource(resource: Pick<SharedResource, 'title' | 'type' | 'url' | 'description'>): Promise<TagResult> {
  const userMsg = {
    role: 'user' as const,
    content: `资源标题：${resource.title}\n资源类型：${resource.type}\n资源链接：${resource.url}\n资源描述：${resource.description || '无'}\n\n请分类并打标签：`,
  }

  const raw = await callSiliconFlow(TAG_SYSTEM, [userMsg], { temperature: 0.3, maxTokens: 256 })

  let cleaned = raw
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  const data = JSON.parse(cleaned) as TagResult
  const validCategories: ResourceCategory[] = ['frontend', 'backend', 'ai', 'design', 'math', 'language', 'exam', 'other']

  return {
    category: validCategories.includes(data.category) ? data.category : 'other',
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 6).map(t => String(t).slice(0, 12)) : [],
  }
}

export async function autoTagResources(resources: Pick<SharedResource, 'id' | 'title' | 'type' | 'url' | 'description'>[]): Promise<Map<string, TagResult>> {
  const results = new Map<string, TagResult>()

  for (const res of resources) {
    try {
      results.set(res.id, await autoTagResource(res))
    } catch {
      // 打标失败时给默认标签
      results.set(res.id, { category: 'other', tags: ['待分类'] })
    }
  }

  return results
}

// ===== AI猫老师对话 =====

const CAT_SYSTEM = `你是一只名叫"橘橘"的AI猫老师，住在LearnFlow的虚拟学习室里。你是一只可爱的橘猫，也是学习室里的智能助教。

## 你的性格
- 温柔可爱，像一只真正的猫一样说话，但又不失专业性
- 喜欢用"喵~"开头或结尾，但不每句都用
- 偶尔提到猫的习性（比如"让我伸个懒腰再回答你"）
- 语气亲近但不幼稚，像个懂很多的学长猫

## 你的能力
- 回答任何学习相关的问题（编程、数学、语言、考试等等）
- 给学习方法建议
- 推荐学习资源
- 和用户闲聊舒缓压力
- 在用户学累了的时候建议休息

## 格式规则（非常重要！）
- 禁止使用任何 markdown 格式：不要用粗体、斜体、标题、列表
- 用自然的短句表达
- 回答控制在 50-200 字之间
- 用中文回答
- 不要说"作为AI助手"之类的套话
- 结尾不要加"希望对你有帮助""祝你学习顺利"之类的客套话`

export async function chatWithCat(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  return callSiliconFlow(CAT_SYSTEM, history.slice(-10).concat([{ role: 'user', content: message }]), { temperature: 0.7 })
}

// ===== AI 每日计划生成 =====

export interface DailyPlanContext {
  userName?: string
  skills?: Record<string, number>     // 技能名 → 熟练度
  flows?: {
    title: string
    progress: number                  // 0-100
    totalNodes: number
    completedNodes: number
    recentTopics?: string[]           // 最近学习的节点标题
  }[]
  roomTasks?: {
    roomTitle: string
    memberName: string
    tasks: { title: string; status: string; dueDate?: string }[]
  }[]
  today: string                       // 今天日期
}

const DAILY_PLAN_SYSTEM = `你是 LearnFlow 的 AI 学习规划师。你需要根据用户的学习背景，为今天生成一份个性化学习计划。

## 你的设计原则
1. **基于现状**：根据用户的技能水平、正在学的学习流、小组任务来安排
2. **优先级排序**：小组任务和临近截止日期的任务优先
3. **可执行性**：每个任务要具体、可执行，不要太笼统
4. **关联已有内容**：尽量关联到用户已有的学习流和任务，不要凭空编造新主题

## 输出格式
只返回纯JSON，不要任何解释文字：

{
  "summary": "一句话总结今天的计划重点（20字以内）",
  "totalMinutes": 300,
  "items": [
    {
      "task": "任务标题（简短，10字以内）",
      "type": "study",
      "detail": "具体做什么（20字以内）",
      "priority": "high",
      "fromFlow": "关联的学习流名称（可选，没有就不写）",
      "fromRoom": "关联的学习室名称（可选，没有就不写）"
    }
  ]
}

字段说明：
- task: 任务标题，简短有力
- type: study(学习新知识) / practice(练习) / review(复习)
- detail: 一句话说明具体做什么
- priority: high/medium/low
- fromFlow: 如果这个任务来自某个学习流，写学习流名称（否则不写这个字段）
- fromRoom: 如果这个任务来自某个学习室的小组任务，写学习室名称（否则不写这个字段）
- totalMinutes: 所有任务预估时长的总和，建议4-8小时

规则：
- 生成4-8个计划项
- 按优先级从高到低排列
- 只生成需要完成的学习/练习/复习任务，不需要休息项`

export async function generateDailyPlan(context: DailyPlanContext): Promise<DailyPlan> {
  // 构建上下文描述
  const parts: string[] = []

  if (context.userName) {
    parts.push(`用户：${context.userName}`)
  }
  parts.push(`今天日期：${context.today}`)

  if (context.skills && Object.keys(context.skills).length > 0) {
    const skillList = Object.entries(context.skills)
      .sort(([, a], [, b]) => b - a)
      .map(([name, level]) => `${name}(熟练度${level})`)
      .join('、')
    parts.push(`技能掌握：${skillList}`)
  }

  if (context.flows && context.flows.length > 0) {
    const flowList = context.flows.map(f => {
      let desc = `「${f.title}」进度${f.progress}% (${f.completedNodes}/${f.totalNodes}节点)`
      if (f.recentTopics && f.recentTopics.length > 0) {
        desc += ` - 最近学习了：${f.recentTopics.slice(0, 3).join('、')}`
      }
      return desc
    }).join('\n')
    parts.push(`正在进行的学习流：\n${flowList}`)
  }

  if (context.roomTasks && context.roomTasks.length > 0) {
    const taskList = context.roomTasks.map(r => {
      const tasks = r.tasks
        .filter(t => t.status !== 'done')
        .map(t => {
          const due = t.dueDate ? `(截止${t.dueDate})` : ''
          return `  - ${t.title} ${due}`
        })
        .join('\n')
      return tasks ? `学习室「${r.roomTitle}」- ${r.memberName}的任务：\n${tasks}` : ''
    }).filter(s => s).join('\n')
    if (taskList) {
      parts.push(`小组学习室任务：\n${taskList}`)
    }
  }

  const userMsg = {
    role: 'user' as const,
    content: parts.join('\n\n') + '\n\n请为我生成今天的学习计划：',
  }

  const raw = await callSiliconFlow(DAILY_PLAN_SYSTEM, [userMsg], { temperature: 0.5, maxTokens: 2048 })

  let cleaned = raw
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  const data = JSON.parse(cleaned) as DailyPlan

  // 验证并修正
  const validTypes = ['study', 'practice', 'review'] as const
  const validPriorities = ['high', 'medium', 'low'] as const

  return {
    summary: String(data.summary || '今天加油！').slice(0, 30),
    totalMinutes: Math.max(0, Math.min(600, Number(data.totalMinutes) || 240)),
    items: (data.items || []).slice(0, 8).map(item => ({
      task: String(item.task || '学习任务').slice(0, 20),
      type: validTypes.includes(item.type) ? item.type : 'study',
      detail: String(item.detail || '').slice(0, 40),
      priority: validPriorities.includes(item.priority) ? item.priority : 'medium',
      fromFlow: item.fromFlow || undefined,
      fromRoom: item.fromRoom || undefined,
    })),
  }
}

export async function testApiKey(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 5,
        stream: false,
      }),
    })
    if (resp.ok) return { ok: true }
    const data = await resp.json().catch(() => null)
    const msg = data?.error?.message || data?.message || `HTTP ${resp.status}`
    return { ok: false, error: msg }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '网络错误' }
  }
}

// ===== AI 作品集生成 =====

const PORTFOLIO_SYSTEM = `你是 LearnFlow 平台的作品集生成助手。根据用户的文字描述，自动生成一个结构化的作品集条目。

## 你的任务
从用户的描述中提取关键信息，生成一个专业的作品集条目。

## 输出格式
只返回纯JSON，不要任何解释文字：

{
  "title": "项目标题（简短有力，不超过20字）",
  "description": "项目描述（说明功能和亮点，30-80字）",
  "techStack": ["技术1", "技术2", "技术3"],
  "demoUrl": "https://...（如果用户提到了在线链接就写，否则不写）",
  "repoUrl": "https://...（如果用户提到了GitHub等源码链接就写，否则不写）",
  "coverEmoji": "🎨"
}

规则：
- title: 根据项目内容起一个响亮的名字，如果用户没给名字就根据描述起名
- description: 突出项目的核心功能和亮点，语言简洁专业
- techStack: 从描述中推断使用的技术栈，列出3-5个关键技术
- demoUrl/repoUrl: 只在实际描述中有时才写，不要编造
- coverEmoji: 选一个最能代表项目的emoji图标
- 即使用户的描述很简短，也要尽量生成完整的条目`

export async function generatePortfolioItem(description: string): Promise<PortfolioItem> {
  const userMsg = {
    role: 'user' as const,
    content: `用户的描述：${description}\n\n请生成作品集条目：`,
  }

  const raw = await callSiliconFlow(PORTFOLIO_SYSTEM, [userMsg], { temperature: 0.6, maxTokens: 1024 })

  let cleaned = raw
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  const data = JSON.parse(cleaned)
  const id = `pf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  return {
    id,
    title: String(data.title || '未命名项目').slice(0, 30),
    description: String(data.description || description).slice(0, 120),
    techStack: Array.isArray(data.techStack) ? data.techStack.slice(0, 6).map((t: unknown) => String(t).slice(0, 20)) : ['Web'],
    demoUrl: data.demoUrl || undefined,
    repoUrl: data.repoUrl || undefined,
    coverEmoji: String(data.coverEmoji || '💻').slice(0, 4),
    date: new Date().toISOString().split('T')[0],
  }
}
