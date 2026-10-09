import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiKey, setApiKey, removeApiKey, hasApiKey, testApiKey } from '../services/aiService'
import { ArrowLeft, Eye, EyeOff, Check, ExternalLink, Trash2, Zap } from 'lucide-react'

const steps = [
  '打开 硅基流动官网（cloud.siliconflow.cn）注册账号',
  '点击右上角头像 → 「API 密钥」→「新建 API 密钥」',
  '复制 Key 粘贴到下方',
]

export default function SettingsPage() {
  const [key, setKeyState] = useState(getApiKey())
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const navigate = useNavigate()

  const handleSave = () => {
    setApiKey(key.trim())
    setSaved(true)
    setTestResult(null)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    setKeyState('')
    removeApiKey()
    setSaved(false)
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!key.trim()) return
    setTesting(true)
    setTestResult(null)
    const result = await testApiKey(key.trim())
    setTestResult(result)
    setTesting(false)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      {/* 顶栏 */}
      <div
        className="px-6 py-4 flex items-center gap-3 flex-shrink-0 sketch-card sketch-a"
        style={{ borderBottom: '2px dashed var(--color-border)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-sketch" style={{ color: 'var(--color-text-primary)' }}>~ 设置 ~</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg space-y-6">
          {/* API Key 配置区 */}
          <div className="sketch-card sketch-b p-5">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-semibold flex items-center gap-2 font-sketch text-base"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Zap size={15} style={{ color: 'var(--color-accent)' }} />
                AI 服务配置
              </h2>
              {hasApiKey() && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium animate-float"
                  style={{
                    background: '#E8F4EC',
                    color: '#5A9E7A',
                    borderRadius: '20px 12px 18px 14px',
                  }}
                >
                  已就绪
                </span>
              )}
            </div>

            <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              配置硅基流动 API Key 后，Learn 可以智能生成学习路径和对话。国内直连，免费使用。
            </p>

            {/* 获取步骤 — 虚线连接的步骤条 */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3">
                <span
                  className="sketch-circle w-6 h-6 flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ color: '#FFF8F0' }}
                >
                  1
                </span>
                <span
                  className="text-xs font-semibold font-sketch"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  获取 API Key
                </span>
              </div>

              <div className="ml-3 space-y-0">
                {steps.map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {/* 虚线连接竖线 */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span
                        className="block w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
                        style={{
                          borderColor: 'var(--color-sketch)',
                          background: i === steps.length - 1 ? 'var(--color-sketch)' : 'transparent',
                          borderRadius: i === 0 ? '40% 60% 70% 30%' : i === 1 ? '50% 40% 60% 50%' : '60% 50% 40% 60%',
                        }}
                      />
                      {i < steps.length - 1 && (
                        <div
                          className="w-0.5 flex-1"
                          style={{
                            borderLeft: '2px dashed var(--color-border)',
                            minHeight: '20px',
                          }}
                        />
                      )}
                    </div>
                    <span className="text-xs pb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href="https://cloud.siliconflow.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-6 mt-1 inline-flex items-center gap-1.5 text-xs font-medium transition-colors sketch-a"
                style={{ color: 'var(--color-accent)' }}
              >
                <ExternalLink size={12} />
                前往硅基流动官网
              </a>

              {/* 输入框 */}
              <div className="ml-3 mt-4">
                <label
                  className="text-xs font-medium mb-1.5 block font-sketch"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={e => {
                      setKeyState(e.target.value)
                      setTestResult(null)
                    }}
                    placeholder="sk-..."
                    className="w-full px-3 py-2.5 text-sm font-mono transition-all pr-9 sketch-a"
                    style={{
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* 测试结果 — 手绘风格 */}
            {testResult && (
              <div
                className="mb-3 px-4 py-2.5 text-xs font-sketch sketch-a"
                style={{
                  background: testResult.ok ? '#E8F4EC' : '#FCEAEA',
                  color: testResult.ok ? '#5A9E7A' : '#C06050',
                }}
              >
                {testResult.ok
                  ? '~ 连接成功，API Key 有效 ~'
                  : `~ 连接失败：${testResult.error || '请检查 Key 是否正确'} ~`}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!key.trim()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {saved ? <><Check size={14} /> 已保存</> : '保存配置'}
              </button>
              {key.trim() && (
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {testing ? '测试中...' : '测试连接'}
                </button>
              )}
              {key && (
                <button
                  onClick={handleClear}
                  className="btn-secondary text-sm"
                  style={{ color: '#C06050' }}
                >
                  <Trash2 size={14} /> 清除
                </button>
              )}
            </div>
          </div>

          {/* 底部说明区 */}
          <div className="sketch-card sketch-d p-4" style={{ border: '2px dashed var(--color-border)' }}>
            <div className="text-xs space-y-2 font-sketch" style={{ color: 'var(--color-text-muted)' }}>
              <p>~ 使用硅基流动平台，国内直连无需代理，新用户注册赠送免费额度。</p>
              <p>~ 所有配置存储在浏览器本地，不会上传到任何服务器。</p>
              <p>~ 未完成配置时，Learn 会使用预设模板回复，功能有限。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
