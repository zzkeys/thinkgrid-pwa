import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTags, addTag, deleteTag, getTagNoteCount, getNotes, getNotesByDate } from '../services/storage.js'

export default function Tags() {
  const navigate = useNavigate()
  const [tags, setTags] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#E8845F')

  // 日历相关状态
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTagId, setSelectedTagId] = useState(null)
  const [filteredNotes, setFilteredNotes] = useState([])
  const [allNotes, setAllNotes] = useState([])

  const COLORS = ['#E8845F', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F97316']

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  // 当选中日期或标签变化时，重新筛选笔记
  useEffect(() => {
    filterNotes()
  }, [selectedDate, selectedTagId, allNotes])

  function loadData() {
    setTags(getTags())
    const notes = getNotes()
    setAllNotes(notes)
  }

  function filterNotes() {
    let notes = [...allNotes]

    // 按日期筛选
    if (selectedDate) {
      const targetDate = new Date(selectedDate)
      targetDate.setHours(0, 0, 0, 0)
      const nextDate = new Date(targetDate)
      nextDate.setDate(nextDate.getDate() + 1)

      notes = notes.filter((note) => {
        const noteDate = new Date(note.createdAt)
        return noteDate >= targetDate && noteDate < nextDate
      })
    }

    // 按标签筛选
    if (selectedTagId) {
      notes = notes.filter((note) => note.tags && note.tags.includes(selectedTagId))
    }

    setFilteredNotes(notes)
  }

  // 获取某月有笔记的日期集合
  const datesWithNotes = useMemo(() => {
    const dates = new Set()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    allNotes.forEach((note) => {
      const noteDate = new Date(note.createdAt)
      if (noteDate.getFullYear() === year && noteDate.getMonth() === month) {
        dates.add(noteDate.getDate())
      }
    })

    return dates
  }, [currentDate, allNotes])

  // 日历辅助函数
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay()
  }

  function handlePrevMonth() {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  function handleNextMonth() {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  function handleDateClick(day) {
    if (!day) return

    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    
    // 如果点击的是已选中的日期，则清除筛选
    if (selectedDate && selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear()) {
      setSelectedDate(null)
    } else {
      setSelectedDate(clickedDate)
    }
  }

  function handleTagClick(tagId) {
    if (selectedTagId === tagId) {
      setSelectedTagId(null)
    } else {
      setSelectedTagId(tagId)
    }
  }

  function handleAddTag() {
    if (!newTagName.trim()) return
    addTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setShowAddForm(false)
    loadData()
  }

  function handleDeleteTag(tagId) {
    if (getTagNoteCount(tagId) > 0) {
      if (!confirm('该标签下有笔记，删除后笔记将失去此标签。确定删除？')) return
    }
    deleteTag(tagId)
    if (selectedTagId === tagId) {
      setSelectedTagId(null)
    }
    loadData()
  }

  // 渲染日历
  function renderCalendar() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const today = new Date()
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

    // 构建日历网格
    const days = []
    
    // 填充月初的空白
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />)
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const hasNote = datesWithNotes.has(day)
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year
      const isToday = isCurrentMonth && today.getDate() === day

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all ${
            isSelected
              ? 'bg-coral-light text-white font-bold scale-110'
              : hasNote
                ? 'text-coral-light font-medium'
                : 'text-text-secondary/60'
          } ${isToday && !isSelected ? 'border-2 border-coral-light/50' : ''}`}
        >
          {day}
        </button>
      )
    }

    return (
      <div className="bg-dark-card rounded-2xl p-4 mb-4 border border-dark-border/50">
        {/* 月份标题 */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={handlePrevMonth} className="text-text-secondary hover:text-text-primary p-1">
            ←
          </button>
          <span className="text-text-primary text-sm font-medium">
            {year}年 {month + 1}月
          </span>
          <button onClick={handleNextMonth} className="text-text-secondary hover:text-text-primary p-1">
            →
          </button>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((name) => (
            <div key={name} className="h-8 flex items-center justify-center text-text-secondary/40 text-xs">
              {name}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        {/* 有笔记的日期指示器 */}
        <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary/40">
          <div className="w-2 h-2 rounded-full bg-coral-light/60" />
          <span>有笔记</span>
        </div>
      </div>
    )
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
        <h1 className="text-text-primary font-semibold text-base">
          {selectedDate ? '日期筛选' : selectedTagId ? '标签筛选' : '笔记日历'}
        </h1>
        <button
          onClick={() => {
            setSelectedDate(null)
            setSelectedTagId(null)
          }}
          className="text-text-secondary/60 hover:text-text-primary text-xs"
        >
          {(selectedDate || selectedTagId) && '清除筛选'}
        </button>
      </header>

      <div className="px-5">
        {/* 日历组件 */}
        {renderCalendar()}

        {/* 笔记列表 */}
        <div className="mb-4">
          <h3 className="text-text-primary text-sm font-medium mb-2">
            笔记 ({filteredNotes.length})
          </h3>
          
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-3xl mb-2">📝</span>
              <p className="text-text-secondary/60 text-sm">
                {selectedDate || selectedTagId ? '没有符合条件的笔记' : '还没有笔记'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/note/${note.id}`)}
                  className="bg-dark-card rounded-xl p-3 cursor-pointer hover:bg-dark-card/80 transition-colors border border-dark-border/50"
                >
                  <h4 className="text-text-primary text-sm font-medium mb-1 line-clamp-1">
                    {note.title || '无标题'}
                  </h4>
                  <p className="text-text-secondary/60 text-xs line-clamp-2">
                    {note.content?.substring(0, 50) || '暂无内容'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-text-secondary/40 text-xs">
                      {new Date(note.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1">
                        {note.tags.slice(0, 2).map((tagId) => {
                          const tag = tags.find(t => t.id === tagId)
                          return tag ? (
                            <span
                              key={tagId}
                              className="px-1.5 py-0.5 rounded-full text-[10px]"
                              style={{
                                backgroundColor: tag.color + '20',
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 标签列表 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-text-primary text-sm font-medium">标签</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-coral-light text-xs font-medium"
            >
              {showAddForm ? '收起' : '+ 新建'}
            </button>
          </div>

          {/* 新建标签表单 */}
          {showAddForm && (
            <div className="bg-dark-card rounded-xl p-3 mb-3 border border-dark-border/50 animate-fade-in">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="标签名称"
                autoFocus
                className="w-full bg-dark-bg/50 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50 mb-3"
              />
              {/* 颜色选择 */}
              <div className="flex gap-2 mb-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newTagColor === color ? 'scale-110 ring-2 ring-white/30' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 rounded-xl bg-dark-border/30 text-text-secondary text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddTag}
                  className="flex-1 py-2 rounded-xl bg-coral-gradient text-white text-sm font-medium"
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {/* 标签列表 */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTagId === tag.id
              const count = getTagNoteCount(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.id)}
                  className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all min-w-[72px] ${
                    isSelected
                      ? 'ring-2 ring-white/20 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                  }}
                >
                  {tag.name}
                  <span className="opacity-60">({count})</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTag(tag.id)
                    }}
                    className="opacity-40 hover:opacity-100 ml-0.5 cursor-pointer"
                  >
                    ×
                  </span>
                </button>
              )
            })}
            {tags.length === 0 && (
              <p className="text-text-secondary/40 text-xs">还没有标签，点击上方"+ 新建"创建</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
