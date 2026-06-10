import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotes } from '../services/storage.js'
import { isAIConfigured } from '../services/ai.js'

export default function AISelect() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    if (!isAIConfigured()) {
      alert('请先在设置中配置 AI 接口')
      navigate('/profile', { replace: true })
      return
    }
    setNotes(getNotes())
  }, [navigate])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      if (prev.length >= 3) {
        alert('最多选择 3 条笔记')
        return prev
      }
      return [...prev, id]
    })
  }

  const handleGenerate = () => {
    if (selectedIds.length === 0) {
      alert('请至少选择 1 条笔记')
      return
    }
    // 将选中的笔记 ID 传递到结果页
    navigate('/ai/result', { state: { selectedIds } })
  }

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
        <h1 className="text-text-primary font-semibold text-base">选择笔记</h1>
        <div className="w-10" />
      </header>

      <div className="px-5">
        {/* 提示 */}
        <div className="bg-dark-card/60 rounded-2xl p-4 mb-4 border border-dark-border/50">
          <p className="text-text-secondary/80 text-sm">
            选择 <span className="text-coral-light font-medium">1-3 条</span> 笔记，AI 将为你生成深度洞察。
          </p>
          <p className="text-text-secondary/40 text-xs mt-1.5">
            已选择 {selectedIds.length}/3 条
          </p>
        </div>

        {/* 笔记列表 */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">📝</span>
            <p className="text-text-secondary/60 text-sm">还没有笔记</p>
            <button
              onClick={() => navigate('/note/new')}
              className="mt-4 text-coral-light text-sm font-medium"
            >
              + 写第一篇笔记
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {notes.map((note) => {
                const isSelected = selectedIds.includes(note.id)
                return (
                  <div
                    key={note.id}
                    onClick={() => toggleSelect(note.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-coral-light/10 border-coral-light/30'
                        : 'bg-dark-card border-dark-border/50 hover:border-dark-border'
                    }`}
                  >
                    {/* 选择指示器 */}
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                      isSelected
                        ? 'bg-coral-light border-coral-light'
                        : 'border-dark-border'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>

                    {/* 笔记信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text-primary text-sm font-medium line-clamp-1 mb-0.5">
                        {note.title || '无标题'}
                      </h3>
                      <p className="text-text-secondary/60 text-xs line-clamp-1">
                        {note.content || '暂无内容'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={selectedIds.length === 0}
              className={`w-full py-3.5 rounded-2xl font-medium text-sm transition-all ${
                selectedIds.length > 0
                  ? 'bg-coral-gradient text-white shadow-lg shadow-coral-light/20 active:scale-[0.98]'
                  : 'bg-dark-border/30 text-text-secondary/40 cursor-not-allowed'
              }`}
            >
              ✨ 生成洞察（{selectedIds.length} 条笔记）
            </button>
          </>
        )}
      </div>
    </div>
  )
}
