import { isAIConfigured, getAIProviderName } from '../services/ai.js'

export default function AICard({ onGenerate }) {
  const configured = isAIConfigured()

  return (
    <div className="bg-gradient-to-br from-dark-card to-[#1E1E1E] rounded-2xl p-5 mb-4 border border-dark-border/50">
      {/* 标题区域 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">✨</span>
        <div>
          <h3 className="text-text-primary font-semibold text-base">AI 洞察</h3>
          <p className="text-text-secondary/60 text-xs mt-0.5">
            {configured ? `已配置 ${getAIProviderName()}` : '未配置 AI 接口'}
          </p>
        </div>
      </div>

      {/* 状态展示 */}
      <div className="bg-[#0F0F0F]/60 rounded-xl p-4 mb-4">
        <p className="text-text-secondary/80 text-sm leading-relaxed">
          {configured
            ? '选择 1-3 条笔记，AI 将为你分析核心主题、发现思维盲点、提出深刻问题。'
            : '请在「我的」-「设置」中配置 AI 接口（DeepSeek 或通义千问）后使用。'}
        </p>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={onGenerate}
        disabled={!configured}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
          configured
            ? 'bg-coral-gradient text-white hover:shadow-lg hover:shadow-coral-light/20 active:scale-[0.98]'
            : 'bg-dark-border/30 text-text-secondary/40 cursor-not-allowed'
        }`}
      >
        ✨ 立即生成今日日结
      </button>
    </div>
  )
}
