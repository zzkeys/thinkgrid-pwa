import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTags, addTag, deleteTag, getTagNoteCount } from '../services/storage.js'

export default function Tags() {
  const navigate = useNavigate()
  const [tags, setTags] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#E8845F')

  const COLORS = ['#E8845F', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F97316']

  useEffect(() => {
    loadTags()
  }, [])

  function loadTags() {
    setTags(getTags())
  }

  const handleAddTag = () => {
    if (!newTagName.trim()) return
    addTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setShowAddForm(false)
    loadTags()
  }

  const handleDeleteTag = (tagId) => {
    if (getTagNoteCount(tagId) > 0) {
      if (!confirm('该标签下有笔记，删除后笔记将失去此标签。确定删除？')) return
    }
    deleteTag(tagId)
    loadTags()
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
        <h1 className="text-text-primary font-semibold text-base">标签管理</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-coral-light font-medium text-sm p-2"
        >
          + 新建
        </button>
      </header>

      <div className="px-5">
        {/* 新建标签表单 */}
        {showAddForm && (
          <div className="bg-dark-card rounded-2xl p-4 mb-4 border border-dark-border/50 animate-fade-in">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="标签名称"
              autoFocus
              className="w-full bg-[#0F0F0F] rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50 mb-3"
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
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">🏷️</span>
            <p className="text-text-secondary/60 text-sm">还没有标签</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => {
              const count = getTagNoteCount(tag.id)
              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between bg-dark-card rounded-2xl px-4 py-3 border border-dark-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-text-primary text-sm font-medium">{tag.name}</span>
                    <span className="text-text-secondary/40 text-xs">({count})</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-text-secondary/40 hover:text-red-400 transition-colors p-1"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
