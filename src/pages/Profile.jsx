import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getSettings, saveSettings, getNotes, getTags, exportToJSON, exportToMarkdown, exportToText, importFromJSON } from '../services/storage.js'
import { isAIConfigured, getAIProviderName, testAPIConnection } from '../services/ai.js'

export default function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [stats, setStats] = useState({ noteCount: 0, tagCount: 0, daysUsed: 1 })
  const [settings, setSettings] = useState(getSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [showDataManage, setShowDataManage] = useState(false)
  const [tempDeepseekKey, setTempDeepseekKey] = useState('')
  const [tempQwenKey, setTempQwenKey] = useState('')
  const [tempZhipuKey, setTempZhipuKey] = useState('')
  const [tempUserName, setTempUserName] = useState('')
  const [tempUserBio, setTempUserBio] = useState('')
  const [testStatus, setTestStatus] = useState(null)
  const [testing, setTesting] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    const s = getStats()
    const noteCount = getNotes().length
    const tagCount = getTags().length
    setStats({
      ...s,
      noteCount,
      tagCount,
    })
    const st = getSettings()
    setSettings(st)
    setTempDeepseekKey(st.deepseekApiKey || '')
    setTempQwenKey(st.qwenApiKey || '')
    setTempZhipuKey(st.zhipuApiKey || '')
    setTempUserName(st.userName || '')
    setTempUserBio(st.userBio || '')
  }

  const handleSaveSettings = () => {
    const newSettings = {
      ...settings,
      deepseekApiKey: tempDeepseekKey.trim(),
      qwenApiKey: tempQwenKey.trim(),
      zhipuApiKey: tempZhipuKey.trim(),
      userName: tempUserName.trim() || '思格用户',
      userBio: tempUserBio.trim() || '用思格记录每一个思考瞬间',
    }
    saveSettings(newSettings)
    setSettings(newSettings)
    setShowSettings(false)
    setTestStatus(null)
  }

  const handleSwitchProvider = (provider) => {
    const newSettings = { ...settings, aiProvider: provider }
    saveSettings(newSettings)
    setSettings(newSettings)
    setTestStatus(null)
  }

  const handleTestAPI = async () => {
    setTesting(true)
    setTestStatus(null)
    try {
      // 获取当前临时输入的 API Key 进行测试
      const currentKey = settings.aiProvider === 'deepseek'
        ? tempDeepseekKey
        : settings.aiProvider === 'qwen'
          ? tempQwenKey
          : tempZhipuKey
      const result = await testAPIConnection(currentKey.trim() || undefined)
      setTestStatus({ type: 'success', message: result.message })
    } catch (error) {
      setTestStatus({ type: 'error', message: error.message })
    } finally {
      setTesting(false)
    }
  }

  const handleExport = (format) => {
    if (format === 'json') exportToJSON()
    else if (format === 'md') exportToMarkdown()
    else if (format === 'txt') exportToText()
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = importFromJSON(event.target.result)
      if (result.success) {
        setImportStatus({ type: 'success', message: `导入成功！新增 ${result.importedNotes} 条笔记，跳过 ${result.skippedNotes} 条重复笔记` })
        loadData()
      } else {
        setImportStatus({ type: 'error', message: `导入失败：${result.error}` })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-full bg-dark-bg">
      {/* 顶部 */}
      <header className="px-5 pt-4 pb-4">
        <h1 className="text-text-primary text-2xl font-bold">我的</h1>
      </header>

      <div className="px-5">
        {/* 用户信息卡片 */}
        <div className="bg-dark-card rounded-2xl p-5 mb-4 border border-dark-border/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-black/30 ring-2 ring-dark-border/30">
              <img src="/logo.png" alt="思格" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="text-text-primary font-semibold text-lg">{settings.userName || '思格用户'}</h2>
              <p className="text-text-secondary/60 text-xs mt-0.5">{settings.userBio || '用思格记录每一个思考瞬间'}</p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0F0F0F]/60 rounded-xl p-3 text-center">
              <p className="text-text-primary text-xl font-bold">{stats.noteCount}</p>
              <p className="text-text-secondary/60 text-xs mt-0.5">笔记</p>
            </div>
            <div className="bg-[#0F0F0F]/60 rounded-xl p-3 text-center">
              <p className="text-text-primary text-xl font-bold">{stats.tagCount}</p>
              <p className="text-text-secondary/60 text-xs mt-0.5">标签</p>
            </div>
            <div className="bg-[#0F0F0F]/60 rounded-xl p-3 text-center">
              <p className="text-text-primary text-xl font-bold">{stats.daysUsed}</p>
              <p className="text-text-secondary/60 text-xs mt-0.5">天</p>
            </div>
          </div>
        </div>

        {/* AI 状态 */}
        <div className="bg-dark-card rounded-2xl mb-4 border border-dark-border/50 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">✨</span>
              <div>
                <p className="text-text-primary text-sm font-medium">AI 洞察</p>
                <p className="text-text-secondary/60 text-xs">
                  {isAIConfigured() ? `${getAIProviderName()} 已配置` : '未配置'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-coral-light text-xs font-medium"
            >
              设置
            </button>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-dark-card rounded-2xl mb-4 border border-dark-border/50 overflow-hidden">
          <button
            onClick={() => setShowDataManage(true)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#222222] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span>💾</span>
              <span className="text-text-primary text-sm">数据管理</span>
            </div>
            <span className="text-text-secondary/40 text-sm">→</span>
          </button>
        </div>

        {/* 其他菜单项 */}
        <div className="bg-dark-card rounded-2xl border border-dark-border/50 overflow-hidden">
          <button
            onClick={() => navigate('/tags')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#222222] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span>🏷️</span>
              <span className="text-text-primary text-sm">标签管理</span>
            </div>
            <span className="text-text-secondary/40 text-sm">→</span>
          </button>
        </div>

        {/* 底部说明 */}
        <div className="mt-8 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-black/20">
              <img src="/logo.png" alt="思格" className="w-full h-full object-cover" />
            </div>
            <p className="text-text-secondary/30 text-xs">思格 Think Grid v1.0</p>
          </div>
          <p className="text-text-secondary/20 text-[10px]">PWA 笔记应用 · 本地存储</p>
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-dark-card rounded-3xl w-full max-w-md p-6 animate-fade-in max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-primary font-semibold text-lg">AI 设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-[#0F0F0F] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            {/* AI 提供商选择 */}
            <div className="mb-6">
              <label className="text-text-secondary text-xs mb-3 block font-medium">AI 提供商</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSwitchProvider('deepseek')}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.aiProvider === 'deepseek'
                      ? 'bg-coral-gradient text-white shadow-lg shadow-coral-light/20'
                      : 'bg-[#0F0F0F] text-text-secondary border border-dark-border/50 hover:border-dark-border'
                  }`}
                >
                  DeepSeek
                </button>
                <button
                  onClick={() => handleSwitchProvider('qwen')}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.aiProvider === 'qwen'
                      ? 'bg-coral-gradient text-white shadow-lg shadow-coral-light/20'
                      : 'bg-[#0F0F0F] text-text-secondary border border-dark-border/50 hover:border-dark-border'
                  }`}
                >
                  通义千问
                </button>
                <button
                  onClick={() => handleSwitchProvider('zhipu')}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.aiProvider === 'zhipu'
                      ? 'bg-coral-gradient text-white shadow-lg shadow-coral-light/20'
                      : 'bg-[#0F0F0F] text-text-secondary border border-dark-border/50 hover:border-dark-border'
                  }`}
                >
                  智谱 GLM
                </button>
              </div>
            </div>

            {/* API Key 输入区域 */}
            <div className="mb-4">
              <label className="text-text-secondary text-xs mb-3 block font-medium">
                {settings.aiProvider === 'deepseek' ? 'DeepSeek' : settings.aiProvider === 'qwen' ? '通义千问' : '智谱 GLM'} API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={
                    settings.aiProvider === 'deepseek'
                      ? tempDeepseekKey
                      : settings.aiProvider === 'qwen'
                        ? tempQwenKey
                        : tempZhipuKey
                  }
                  onChange={(e) => {
                    if (settings.aiProvider === 'deepseek') {
                      setTempDeepseekKey(e.target.value)
                    } else if (settings.aiProvider === 'qwen') {
                      setTempQwenKey(e.target.value)
                    } else {
                      setTempZhipuKey(e.target.value)
                    }
                    setTestStatus(null)
                  }}
                  placeholder="sk-... 或输入您的 API Key"
                  className="w-full bg-[#0F0F0F] rounded-xl px-4 py-3 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50 transition-colors pr-12"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-secondary text-sm w-8 h-8 flex items-center justify-center"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-text-secondary/40 text-[11px] mt-2">
                {settings.aiProvider === 'deepseek'
                  ? '💡 在 platform.deepseek.com 获取'
                  : settings.aiProvider === 'qwen'
                    ? '💡 在 dashscope.aliyun.com 获取'
                    : '💡 在 open.bigmodel.cn 获取'}
              </p>
            </div>

            {/* 直接保存提示 */}
            <div className="bg-coral-light/10 rounded-xl p-3 mb-4 border border-coral-light/20">
              <p className="text-coral-light text-[11px] leading-relaxed">
                💡 输入 API Key 后直接点击保存即可，测试连接是可选的
              </p>
            </div>

            {/* 测试连接 */}
            <button
              onClick={handleTestAPI}
              disabled={testing || !(tempDeepseekKey || tempQwenKey || tempZhipuKey)}
              className="w-full py-3 rounded-xl bg-[#1A3A2F] text-[#4ADE80] font-medium text-sm border border-[#4ADE80]/30 hover:border-[#4ADE80]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#4ADE80]/30 border-t-[#4ADE80] rounded-full animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <span>🔌</span> 测试连接（可选）
                </>
              )}
            </button>

            {/* 测试结果 */}
            {testStatus && (
              <div className={`rounded-xl p-4 mb-4 text-sm ${
                testStatus.type === 'success'
                  ? 'bg-[#1A3A2F]/80 text-[#4ADE80] border border-[#4ADE80]/30'
                  : 'bg-[#3A1A1A]/80 text-red-400 border border-red-400/30'
              }`}>
                <div className="flex items-center gap-2">
                  <span>{testStatus.type === 'success' ? '✅' : '❌'}</span>
                  <span>{testStatus.message}</span>
                </div>
              </div>
            )}

            {/* 安全提示 */}
            <div className="bg-[#0F0F0F]/60 rounded-xl p-4 mb-6 border border-dark-border/30">
              <p className="text-text-secondary/60 text-[11px] leading-relaxed">
                🔒 API Key 仅加密存储在您的本地设备中，不会上传至任何服务器
              </p>
            </div>

            {/* 底部操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 rounded-xl bg-[#0F0F0F] text-text-secondary font-medium text-sm border border-dark-border/50 hover:border-dark-border transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-3 rounded-xl bg-coral-gradient text-white font-medium text-sm shadow-lg shadow-coral-light/20 hover:shadow-coral-light/30 transition-all"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 数据管理弹窗 */}
      {showDataManage && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={() => setShowDataManage(false)}>
          <div className="bg-dark-card rounded-t-3xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-text-primary font-semibold text-lg mb-5">数据管理</h3>

            {/* 导出数据 */}
            <div className="mb-6">
              <label className="text-text-secondary text-xs mb-2 block">导出数据</label>
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full py-3 rounded-xl bg-[#0F0F0F] text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>📦</span> 导出完整备份 (JSON)
                </button>
                <button
                  onClick={() => handleExport('md')}
                  className="w-full py-3 rounded-xl bg-[#0F0F0F] text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>📝</span> 导出为 Markdown
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full py-3 rounded-xl bg-[#0F0F0F] text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>📄</span> 导出为纯文本
                </button>
              </div>
            </div>

            {/* 导入数据 */}
            <div className="mb-4">
              <label className="text-text-secondary text-xs mb-2 block">导入数据</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl bg-[#0F0F0F] text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
              >
                <span>📥</span> 从 JSON 备份导入
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-text-secondary/40 text-[10px] mt-1">支持导入之前导出的 JSON 备份文件</p>
            </div>

            {/* 导入结果 */}
            {importStatus && (
              <div className={`rounded-xl p-3 mb-4 text-xs ${
                importStatus.type === 'success'
                  ? 'bg-[#1A3A2F] text-[#4ADE80] border border-[#4ADE80]/20'
                  : 'bg-[#3A1A1A] text-red-400 border border-red-400/20'
              }`}>
                {importStatus.type === 'success' ? '✅ ' : '❌ '}{importStatus.message}
              </div>
            )}

            {/* 关闭按钮 */}
            <button
              onClick={() => setShowDataManage(false)}
              className="w-full py-3 rounded-xl bg-dark-border/30 text-text-primary font-medium text-sm mt-2"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
