import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getNotes, getNoteById } from '../services/storage.js'
import { generateInsight } from '../services/ai.js'

export default function AIResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [selectedNotes, setSelectedNotes] = useState([])

  useEffect(() => {
    if (!location.state?.selectedIds) {
      navigate('/ai/select', { replace: true })
      return
    }
    loadAndGenerate()
  }, [location.state])

  async function loadAndGenerate() {
    setLoading(true)
    setError('')
    setResult(null)

    const ids = location.state.selectedIds
    const notes = ids.map((id) => getNoteById(id)).filter(Boolean)
    setSelectedNotes(notes)

    try {
      const insight = await generateInsight(notes)
      setResult(insight)
    } catch (err) {
      setError(err.message || '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-dark-bg">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2"
        >
          <span className="text-xl">←</span>
        </button>
        <h1 className="text-text-primary font-semibold text-base">AI 洞察结果</h1>
        <div className="w-10" />
      </header>

      <div className="px-5 pb-32">
        {/* 选中的笔记 */}
        <div className="mb-4">
          <p className="text-text-secondary/60 text-xs mb-2">分析的笔记：</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedNotes.map((note) => (
              <span
                key={note.id}
                className="inline-flex items-center px-2.5 py-1 bg-coral-light/10 text-coral-light rounded-full text-xs"
              >
                {note.title || '无标题'}
              </span>
            ))}
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-12 h-12 rounded-full border-2 border-coral-light/30 border-t-coral-light animate-spin mb-4" />
            <p className="text-text-secondary text-sm">AI 正在分析你的笔记...</p>
            <p className="text-text-secondary/40 text-xs mt-1">这可能需要几秒钟</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center animate-fade-in">
            <span className="text-2xl mb-2 block">⚠️</span>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={loadAndGenerate}
              className="bg-coral-gradient text-white px-5 py-2 rounded-full text-sm font-medium"
            >
              重试
            </button>
          </div>
        )}

        {/* 结果展示 */}
        {result && !loading && (
          <div className="space-y-4 animate-fade-in">
            {/* 核心主题 */}
            <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎯</span>
                <h3 className="text-coral-light font-semibold text-base">核心主题</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {result.themes.map((theme, i) => (
                  <span key={i} className="px-2.5 py-0.5 bg-coral-light/20 text-coral-light rounded-full text-xs font-medium">
                    {theme}
                  </span>
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">{result.themesAnalysis}</p>
            </div>

            {/* 思维盲点 */}
            <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💡</span>
                <h3 className="text-yellow-400 font-semibold text-base">思维盲点</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {result.blindSpots.map((spot, i) => (
                  <span key={i} className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-xs font-medium">
                    {spot}
                  </span>
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">{result.blindSpotsAnalysis}</p>
            </div>

            {/* 深刻问题 */}
            <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤔</span>
                <h3 className="text-purple-400 font-semibold text-base">深刻问题</h3>
              </div>
              <div className="space-y-2 mb-3">
                {result.questions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-purple-400/60 text-xs mt-0.5">{i + 1}.</span>
                    <p className="text-purple-300 text-sm leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed border-t border-dark-border/50 pt-3">{result.questionsAnalysis}</p>
            </div>

            {/* 重新生成按钮 */}
            <button
              onClick={loadAndGenerate}
              className="w-full py-3 rounded-2xl border border-dark-border/50 text-text-secondary text-sm font-medium hover:border-coral-light/30 hover:text-coral-light transition-all"
            >
              🔄 重新生成
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
