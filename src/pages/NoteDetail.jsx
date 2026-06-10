import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNoteById, deleteNote, getTagName, getTagColor, formatTime } from '../services/storage.js'
import { generateQuickInsight } from '../services/ai.js'

export default function NoteDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [note, setNote] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [insight, setInsight] = useState(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  useEffect(() => {
    loadNote()
  }, [id])

  function loadNote() {
    const n = getNoteById(id)
    if (n) {
      setNote(n)
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleDelete = () => {
    deleteNote(id)
    navigate('/', { replace: true })
  }

  const handleEdit = () => {
    navigate(`/note/edit/${id}`)
  }

  const handleQuickInsight = async () => {
    setLoadingInsight(true)
    setInsight(null)
    try {
      const result = await generateQuickInsight(note)
      setInsight(result)
    } catch (error) {
      alert('AI 洞察失败：' + error.message)
    } finally {
      setLoadingInsight(false)
    }
  }

  if (!note) return null

  return (
    <div className="min-h-full bg-dark-bg">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-4 pt-14 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2"
        >
          <span className="text-xl">←</span>
        </button>
        <div className="flex gap-1">
          <button
            onClick={handleEdit}
            className="text-text-secondary hover:text-text-primary transition-colors p-2"
          >
            ✏️
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-text-secondary hover:text-red-400 transition-colors p-2"
          >
            🗑️
          </button>
        </div>
      </header>

      {/* 笔记内容 */}
      <div className="px-5 pb-32">
        {/* 标题 */}
        <h1 className="text-text-primary text-2xl font-bold mb-3 leading-tight">
          {note.title || '无标题'}
        </h1>

        {/* 标签 */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {note.tags.map((tagId) => (
              <span
                key={tagId}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getTagColor(tagId) + '20',
                  color: getTagColor(tagId),
                }}
              >
                {getTagName(tagId)}
              </span>
            ))}
          </div>
        )}

        {/* 时间 */}
        <p className="text-text-secondary/50 text-xs mb-6">
          {formatTime(note.createdAt)}
          {note.updatedAt !== note.createdAt && '（已编辑）'}
        </p>

        {/* 正文 */}
        <div className="text-text-primary leading-relaxed whitespace-pre-wrap text-base mb-8">
          {note.content || '暂无内容'}
        </div>

        {/* AI 快洞察按钮 */}
        <button
          onClick={handleQuickInsight}
          disabled={loadingInsight}
          className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-purple-500/20 to-coral-light/20 text-white border border-purple-500/30 hover:border-purple-500/50 transition-all disabled:opacity-50"
        >
          {loadingInsight ? '✨ AI 思考中...' : '✨ 快速洞察这条笔记'}
        </button>

        {/* AI 洞察结果 */}
        {insight && (
          <div className="mt-6 bg-dark-card rounded-2xl p-5 border border-dark-border/50 animate-fade-in">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>✨</span> AI 洞察
            </h3>

            {/* 核心主题 */}
            <div className="mb-4">
              <h4 className="text-coral-light text-sm font-medium mb-2">🎯 核心主题</h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {insight.themes.map((theme, i) => (
                  <span key={i} className="px-2 py-0.5 bg-coral-light/20 text-coral-light rounded-full text-xs">
                    {theme}
                  </span>
                ))}
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">{insight.themesAnalysis}</p>
            </div>

            {/* 思维盲点 */}
            <div className="mb-4">
              <h4 className="text-yellow-400 text-sm font-medium mb-2">💡 思维盲点</h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {insight.blindSpots.map((spot, i) => (
                  <span key={i} className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-xs">
                    {spot}
                  </span>
                ))}
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">{insight.blindSpotsAnalysis}</p>
            </div>

            {/* 深刻问题 */}
            <div>
              <h4 className="text-purple-400 text-sm font-medium mb-2">🤔 深刻问题</h4>
              <div className="space-y-1.5 mb-2">
                {insight.questions.map((q, i) => (
                  <p key={i} className="text-purple-300 text-xs">• {q}</p>
                ))}
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">{insight.questionsAnalysis}</p>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-dark-card rounded-t-3xl w-full max-w-md p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-text-primary font-semibold text-lg mb-2">删除笔记</h3>
            <p className="text-text-secondary text-sm mb-6">确定要删除「{note.title}」吗？此操作不可撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-dark-border/30 text-text-primary font-medium text-sm"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500/80 text-white font-medium text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
