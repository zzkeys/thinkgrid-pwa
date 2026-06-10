import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotes } from '../services/storage.js'
import { isAIConfigured } from '../services/ai.js'

const TIME_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '最近7天' },
  { key: 'month', label: '最近30天' },
]

function getFilterTimestamp(key) {
  const now = new Date()
  switch (key) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    case 'week':
      return now.getTime() - 7 * 24 * 60 * 60 * 1000
    case 'month':
      return now.getTime() - 30 * 24 * 60 * 60 * 1000
    default:
      return 0
  }
}

export default function AISelect() {
  const navigate = useNavigate()
  const [allNotes, setAllNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [timeFilter, setTimeFilter] = useState('all')
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    if (!isAIConfigured()) {
      alert('请先在设置中配置 AI 接口')
      navigate('/profile', { replace: true })
      return
    }
    const notes = getNotes()
    setAllNotes(notes)
    setFilteredNotes(notes)
  }, [navigate])

  useEffect(() => {
    const cutoff = getFilterTimestamp(timeFilter)
    const filtered = allNotes.filter((n) => new Date(n.createdAt).getTime() >= cutoff)
    setFilteredNotes(filtered)
    // 清除已选中但不在筛选结果中的笔记
    setSelectedIds((prev) => prev.filter((id) => filtered.some((n) => n.id === id)))
    setSelectAll(false)
  }, [timeFilter, allNotes])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      return [...prev, id]
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredNotes.map((n) => n.id))
    }
    setSelectAll(!selectAll)
  }

  const handleGenerate = () => {
    if (selectedIds.length === 0) {
      alert('请至少选择 1 条笔记')
      return
    }
    navigate('/ai/result', { state: { selectedIds } })
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
        <h1 className="text-text-primary font-semibold text-base">AI 洞察</h1>
        <div className="w-10" />
      </header>

      <div className="px-5">
        {/* 提示 */}
        <div className="bg-dark-card/60 rounded-2xl p-4 mb-4 border border-dark-border/50">
          <p className="text-text-secondary/80 text-sm">
            选择笔记，AI 将为你生成深度洞察。
          </p>
          <p className="text-text-secondary/40 text-xs mt-1.5">
            已选择 {selectedIds.length} 条 / 共 {filteredNotes.length} 条
          </p>
        </div>

        {/* 时间筛选 */}
        <div className="mb-4">
          <label className="text-text-secondary text-xs mb-2 block">时间范围</label>
          <div className="flex gap-2">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTimeFilter(f.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  timeFilter === f.key
                    ? 'bg-coral-gradient text-white'
                    : 'bg-[#0F0F0F] text-text-secondary border border-dark-border/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 全选按钮 */}
        {filteredNotes.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary/60 text-xs">{filteredNotes.length} 条笔记</span>
            <button
              onClick={handleSelectAll}
              className="text-coral-light text-xs font-medium"
            >
              {selectAll ? '取消全选' : '全选'}
            </button>
          </div>
        )}

        {/* 笔记列表 */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">📝</span>
            <p className="text-text-secondary/60 text-sm">该时间段没有笔记</p>
            <button
              onClick={() => navigate('/note/new')}
              className="mt-4 text-coral-light text-sm font-medium"
            >
              + 写一篇笔记
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {filteredNotes.map((note) => {
                const isSelected = selectedIds.includes(note.id)
                const dateStr = new Date(note.createdAt).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
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
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-text-primary text-sm font-medium line-clamp-1 flex-1">
                          {note.title || '无标题'}
                        </h3>
                        <span className="text-text-secondary/30 text-[10px] ml-2 flex-shrink-0">{dateStr}</span>
                      </div>
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
