import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getSettings, saveSettings, getNotes, getTags, exportToJSON, exportToMarkdown, exportToText, importFromJSON } from '../services/storage.js'
import { isAIConfigured, getAIProviderName, testAPIConnection, AI_MODELS } from '../services/ai.js'

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
  // 新 AI 设置状态
  const [tempAIEnabled, setTempAIEnabled] = useState(true)
  const [tempAIModel, setTempAIModel] = useState('glm-4-flash')
  const [tempApiUrl, setTempApiUrl] = useState('')
  const [tempApiKey, setTempApiKey] = useState('')
  const [tempCustomPromptEnabled, setTempCustomPromptEnabled] = useState(false)
  const [tempCustomPrompt, setTempCustomPrompt] = useState('')
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [exportStatus, setExportStatus] = useState(null)
  const [pendingExport, setPendingExport] = useState(null) // { format: 'json'|'md'|'txt', type: 'all'|'notes'|'diaries'|'todos' }

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
    // 新 AI 设置
    setTempAIEnabled(st.aiEnabled !== false)
    setTempAIModel(st.aiModel || 'glm-4-flash')
    setTempApiUrl(st.apiUrl || '')
    setTempApiKey(st.apiKey || '')
    setTempCustomPromptEnabled(st.customPromptEnabled || false)
    setTempCustomPrompt(st.customPrompt || '')
  }

  const handleSaveSettings = () => {
    const newSettings = {
      ...settings,
      // 新 AI 配置
      aiEnabled: tempAIEnabled,
      aiProvider: settings.aiProvider,
      aiModel: tempAIModel,
      apiUrl: tempApiUrl.trim(),
      apiKey: tempApiKey.trim(),
      customPromptEnabled: tempCustomPromptEnabled,
      customPrompt: tempCustomPrompt.trim(),
      // 兼容旧配置
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
      // 使用临时输入的配置进行测试
      const result = await testAPIConnection({
        provider: settings.aiProvider,
        model: tempAIModel,
        apiKey: tempApiKey.trim(),
        apiUrl: tempApiUrl.trim() || undefined,
      })
      setTestStatus({ type: 'success', message: result.message })
    } catch (error) {
      setTestStatus({ type: 'error', message: error.message })
    } finally {
      setTesting(false)
    }
  }

  // 点击导出按钮，先显示类型选择
  const handleExportClick = (format) => {
    setPendingExport({ format, type: null })
  }

  // 选择类型后执行导出
  const doExport = (format, type) => {
    setPendingExport(null)
    setExportStatus(null)
    let result
    if (format === 'json') result = exportToJSON(type)
    else if (format === 'md') result = exportToMarkdown(type)
    else if (format === 'txt') result = exportToText(type)

    if (result && result.success) {
      const typeLabel = { all: '完整备份', notes: '笔记', diaries: '日记', todos: '待办' }[type] || ''
      const formatName = format === 'json' ? 'JSON' : format === 'md' ? 'Markdown' : '纯文本'
      setExportStatus({ type: 'success', message: `${formatName} · ${typeLabel} 导出成功！` })
      setTimeout(() => setExportStatus(null), 3000)
    } else {
      setExportStatus({ type: 'error', message: `导出失败：${result?.error || '未知错误'}` })
      setTimeout(() => setExportStatus(null), 4000)
    }
  }

  const handleTypeSelect = (type) => {
    if (pendingExport) {
      doExport(pendingExport.format, type)
    }
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
            <div className="bg-dark-card/60 rounded-xl p-3 text-center">
              <p className="text-text-primary text-xl font-bold">{stats.noteCount}</p>
              <p className="text-text-secondary/60 text-xs mt-0.5">笔记</p>
            </div>
            <div className="bg-dark-card/60 rounded-xl p-3 text-center">
              <p className="text-text-primary text-xl font-bold">{stats.tagCount}</p>
              <p className="text-text-secondary/60 text-xs mt-0.5">标签</p>
            </div>
            <div className="bg-dark-card/60 rounded-xl p-3 text-center">
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
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-dark-card/80 transition-colors"
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
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-dark-card/80 transition-colors"
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
          <div className="bg-dark-card rounded-3xl w-full max-w-md p-6 pb-24 animate-fade-in max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-primary font-semibold text-lg">AI 设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-dark-card flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            {/* AI 功能开关 */}
            <div className="mb-6">
              <label className="text-text-secondary text-xs mb-3 block font-medium">AI 功能</label>
              <div className="bg-dark-bg rounded-2xl p-4 border border-dark-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="text-text-primary text-sm font-medium">启用 AI 助手</p>
                      <p className="text-text-secondary/50 text-[11px]">开启后可使用 AI 辅助功能</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTempAIEnabled(!tempAIEnabled)}
                    className={`w-12 h-7 rounded-full transition-all relative ${
                      tempAIEnabled ? 'bg-coral-light' : 'bg-dark-border/50'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                      tempAIEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* 提供商选择 */}
            <div className="mb-6">
              <label className="text-text-secondary text-xs mb-3 block font-medium">AI 提供商</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(AI_MODELS).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => {
                      handleSwitchProvider(key)
                      setTempAIModel(info.models[0].id)
                      setTestStatus(null)
                    }}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      settings.aiProvider === key
                        ? 'bg-coral-gradient text-white shadow-lg shadow-coral-light/20'
                        : 'bg-dark-bg text-text-secondary border border-dark-border/50 hover:border-dark-border'
                    }`}
                  >
                    {info.name}
                  </button>
                ))}
              </div>
            </div>

            {/* API 配置 */}
            <div className="mb-6">
              <label className="text-text-secondary text-xs mb-3 block font-medium">API 配置</label>

              {/* API 地址 */}
              <div className="bg-dark-bg rounded-2xl p-4 border border-dark-border/30 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">☁️</span>
                  <span className="text-text-primary text-sm">API 地址</span>
                </div>
                <input
                  type="text"
                  value={tempApiUrl}
                  onChange={(e) => { setTempApiUrl(e.target.value); setTestStatus(null) }}
                  placeholder={AI_MODELS[settings.aiProvider]?.defaultUrl || 'https://...'}
                  className="w-full bg-dark-card/80 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50 transition-colors"
                />
              </div>

              {/* API 密钥 */}
              <div className="bg-dark-bg rounded-2xl p-4 border border-dark-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🔑</span>
                  <span className="text-text-primary text-sm">API 密钥</span>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={tempApiKey}
                    onChange={(e) => { setTempApiKey(e.target.value); setTestStatus(null) }}
                    placeholder="输入您的 API Key"
                    className="w-full bg-dark-card rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50 transition-colors pr-12"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-secondary text-sm w-8 h-8 flex items-center justify-center"
                  >
                    {showKey ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI 模型 */}
            <div className="mb-6">
              <label className="text-text-secondary text-xs mb-3 block font-medium">AI 模型</label>
              <button
                onClick={() => setShowModelSelect(true)}
                className="w-full bg-dark-card rounded-2xl p-4 border border-dark-border/30 flex items-center justify-between hover:border-dark-border/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">🧠</span>
                  <div className="text-left">
                    <p className="text-text-primary text-sm">模型选择</p>
                    <p className="text-text-secondary/50 text-[11px]">
                      {AI_MODELS[settings.aiProvider]?.models.find(m => m.id === tempAIModel)?.name || tempAIModel}
                    </p>
                  </div>
                </div>
                <span className="text-text-secondary/40">›</span>
              </button>
            </div>

            {/* 自定义提示词 */}
            <div className="mb-6">
              <label className="text-text-secondary text-xs mb-3 block font-medium">自定义提示词</label>
              <div className="bg-dark-card rounded-2xl p-4 border border-dark-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-primary text-sm">启用自定义提示词</span>
                  <button
                    onClick={() => setTempCustomPromptEnabled(!tempCustomPromptEnabled)}
                    className={`w-10 h-6 rounded-full transition-all relative ${
                      tempCustomPromptEnabled ? 'bg-coral-light' : 'bg-dark-border/50'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                      tempCustomPromptEnabled ? 'left-[18px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                {tempCustomPromptEnabled && (
                  <textarea
                    value={tempCustomPrompt}
                    onChange={(e) => setTempCustomPrompt(e.target.value)}
                    placeholder="输入自定义的 AI 提示词..."
                    rows={3}
                    className="w-full bg-dark-card rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50 transition-colors resize-none"
                  />
                )}
              </div>
            </div>

            {/* 测试连接 */}
            <button
              onClick={handleTestAPI}
              disabled={testing || !tempApiKey}
              className="w-full py-3.5 rounded-xl bg-[#1A3A2F] text-[#4ADE80] font-medium text-sm border border-[#4ADE80]/30 hover:border-[#4ADE80]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#4ADE80]/30 border-t-[#4ADE80] rounded-full animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <span>🔌</span> 测试 API 连接
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

            {/* 温馨提示 */}
            <div className="bg-dark-card/60 rounded-xl p-4 mb-6 border border-dark-border/30">
              <p className="text-coral-light text-[11px] leading-relaxed mb-1">💡 温馨提示</p>
              <ul className="text-text-secondary/50 text-[11px] leading-relaxed space-y-1 list-disc list-inside">
                <li>选择模型后会自动填充 API 地址</li>
                <li>API 密钥仅存储在本地，不会上传</li>
                <li>支持所有兼容 OpenAI 格式的 AI 服务</li>
              </ul>
            </div>

            {/* 底部操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 rounded-xl bg-dark-card text-text-secondary font-medium text-sm border border-dark-border/50 hover:border-dark-border transition-colors"
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

      {/* 模型选择弹窗 */}
      {showModelSelect && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60]" onClick={() => setShowModelSelect(false)}>
          <div className="bg-dark-card rounded-t-3xl w-full max-w-md p-6 animate-fade-in max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-primary font-semibold text-lg">选择模型</h3>
              <button
                onClick={() => setShowModelSelect(false)}
                className="w-8 h-8 rounded-full bg-dark-card flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {AI_MODELS[settings.aiProvider]?.models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setTempAIModel(model.id)
                    setShowModelSelect(false)
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-left text-sm transition-all ${
                    tempAIModel === model.id
                      ? 'bg-coral-light/20 text-coral-light border border-coral-light/30'
                      : 'bg-dark-card text-text-primary border border-dark-border/30 hover:border-dark-border/60'
                  }`}
                >
                  {model.name}
                </button>
              ))}
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

              {/* 导出状态提示 */}
              {exportStatus && (
                <div className={`rounded-xl p-3 mb-3 text-sm flex items-center gap-2 animate-fade-in ${
                  exportStatus.type === 'success'
                    ? 'bg-[#1A3A2F]/80 text-[#4ADE80] border border-[#4ADE80]/30'
                    : 'bg-[#3A1A1A]/80 text-red-400 border border-red-400/30'
                }`}>
                  <span>{exportStatus.type === 'success' ? '✅' : '❌'}</span>
                  <span>{exportStatus.message}</span>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => handleExportClick('json')}
                  className="w-full py-3 rounded-xl bg-dark-bg text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>📦</span> 导出为 JSON
                </button>
                <button
                  onClick={() => handleExportClick('md')}
                  className="w-full py-3 rounded-xl bg-dark-bg text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>📝</span> 导出为 Markdown
                </button>
                <button
                  onClick={() => handleExportClick('txt')}
                  className="w-full py-3 rounded-xl bg-dark-bg text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
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
                className="w-full py-3 rounded-xl bg-dark-card text-text-primary text-sm font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all flex items-center justify-center gap-2"
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

      {/* 导出类型选择弹窗 */}
      {pendingExport && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60]" onClick={() => setPendingExport(null)}>
          <div className="bg-dark-card rounded-t-3xl w-full max-w-md p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-primary font-semibold text-lg">选择导出范围</h3>
              <button
                onClick={() => setPendingExport(null)}
                className="w-8 h-8 rounded-full bg-dark-card flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-text-secondary/60 text-xs mb-4">选择要导出的数据类型</p>
            <div className="space-y-2.5">
              {[
                { id: 'all', label: '全部', icon: '📦', desc: '笔记 + 日记 + 待办' },
                { id: 'notes', label: '笔记', icon: '📝', desc: '仅普通笔记' },
                { id: 'diaries', label: '日记', icon: '📔', desc: '仅日记记录' },
                { id: 'todos', label: '待办清单', icon: '⏳', desc: '仅待办事项' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTypeSelect(item.id)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-dark-bg hover:bg-dark-card/80 transition-all text-left flex items-center gap-3 border border-dark-border/30 hover:border-coral-light/20"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{item.label}</p>
                    <p className="text-text-secondary/40 text-[11px]">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
