import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getSettings, saveSettings, getNotes, getTags } from '../services/storage.js'
import { isAIConfigured, getAIProviderName } from '../services/ai.js'

export default function Profile() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ noteCount: 0, tagCount: 0, daysUsed: 1 })
  const [settings, setSettings] = useState(getSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [tempDeepseekKey, setTempDeepseekKey] = useState('')
  const [tempQwenKey, setTempQwenKey] = useState('')
  const [tempZhipuKey, setTempZhipuKey] = useState('')
  const [tempUserName, setTempUserName] = useState('')
  const [tempUserBio, setTempUserBio] = useState('')

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
  }

  const handleSwitchProvider = (provider) => {
    const newSettings = { ...settings, aiProvider: provider }
    saveSettings(newSettings)
    setSettings(newSettings)
  }

  return (
    <div className="min-h-full bg-dark-bg">
      {/* 顶部 */}
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-text-primary text-2xl font-bold">我的</h1>
      </header>

      <div className="px-5">
        {/* 用户信息卡片 */}
        <div className="bg-dark-card rounded-2xl p-5 mb-4 border border-dark-border/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral-light to-coral-dark flex items-center justify-center text-3xl">
              👤
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

        {/* 设置弹窗 */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={() => setShowSettings(false)}>
            <div className="bg-dark-card rounded-t-3xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-text-primary font-semibold text-lg mb-5">设置</h3>

              {/* 用户信息设置 */}
              <div className="mb-5">
                <label className="text-text-secondary text-xs mb-1.5 block">用户名</label>
                <input
                  type="text"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  className="w-full bg-[#0F0F0F] rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50"
                />
              </div>
              <div className="mb-5">
                <label className="text-text-secondary text-xs mb-1.5 block">个人简介</label>
                <input
                  type="text"
                  value={tempUserBio}
                  onChange={(e) => setTempUserBio(e.target.value)}
                  className="w-full bg-[#0F0F0F] rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50"
                />
              </div>

              {/* AI 提供商选择 */}
              <div className="mb-5">
                <label className="text-text-secondary text-xs mb-2 block">AI 提供商</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSwitchProvider('deepseek')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      settings.aiProvider === 'deepseek'
                        ? 'bg-coral-gradient text-white'
                        : 'bg-[#0F0F0F] text-text-secondary border border-dark-border/50'
                    }`}
                  >
                    DeepSeek
                  </button>
                  <button
                    onClick={() => handleSwitchProvider('qwen')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      settings.aiProvider === 'qwen'
                        ? 'bg-coral-gradient text-white'
                        : 'bg-[#0F0F0F] text-text-secondary border border-dark-border/50'
                    }`}
                  >
                    通义千问
                  </button>
                  <button
                    onClick={() => handleSwitchProvider('zhipu')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      settings.aiProvider === 'zhipu'
                        ? 'bg-coral-gradient text-white'
                        : 'bg-[#0F0F0F] text-text-secondary border border-dark-border/50'
                    }`}
                  >
                    智谱 GLM
                  </button>
                </div>
              </div>

              {/* API Key 设置 */}
              <div className="mb-4">
                <label className="text-text-secondary text-xs mb-1.5 block">
                  {settings.aiProvider === 'deepseek' ? 'DeepSeek' : settings.aiProvider === 'qwen' ? '通义千问' : '智谱 GLM'} API Key
                </label>
                <input
                  type="password"
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
                  }}
                  placeholder={`输入 ${settings.aiProvider === 'deepseek' ? 'DeepSeek' : settings.aiProvider === 'qwen' ? '通义千问' : '智谱 GLM'} API Key`}
                  className="w-full bg-[#0F0F0F] rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50"
                />
                <p className="text-text-secondary/40 text-[10px] mt-1">
                  {settings.aiProvider === 'deepseek'
                    ? '在 https://platform.deepseek.com 获取'
                    : settings.aiProvider === 'qwen'
                      ? '在 https://dashscope.aliyun.com 获取'
                      : '在 https://open.bigmodel.cn 获取'}
                </p>
              </div>

              {/* 保存按钮 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 rounded-xl bg-dark-border/30 text-text-primary font-medium text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-3 rounded-xl bg-coral-gradient text-white font-medium text-sm"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

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
          <p className="text-text-secondary/30 text-xs">思格 Think Grid v1.0</p>
          <p className="text-text-secondary/20 text-[10px] mt-1">PWA 笔记应用 · 本地存储</p>
        </div>
      </div>
    </div>
  )
}
