import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNoteById, saveNote, getTags, getTagName } from '../services/storage.js'
import { generateTitle, isAIConfigured } from '../services/ai.js'

export default function NoteEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [allTags, setAllTags] = useState([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [generatingTitle, setGeneratingTitle] = useState(false)

  useEffect(() => {
    setAllTags(getTags())

    if (isEditing) {
      const note = getNoteById(id)
      if (note) {
        setTitle(note.title || '')
        setContent(note.content || '')
        setSelectedTags(note.tags || [])
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [id, isEditing, navigate])

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      alert('请输入标题或内容')
      return
    }

    saveNote({
      id: isEditing ? id : null,
      title: title.trim() || '无标题',
      content: content.trim(),
      tags: selectedTags,
    })

    navigate('/', { replace: true })
  }

  const handleGenerateTitle = async () => {
    if (!content.trim()) {
      alert('请先输入笔记内容')
      return
    }
    if (!isAIConfigured()) {
      alert('请先在设置中配置 AI API Key')
      return
    }

    setGeneratingTitle(true)
    try {
      const generatedTitle = await generateTitle(content)
      setTitle(generatedTitle)
    } catch (error) {
      alert('生成标题失败：' + error.message)
    } finally {
      setGeneratingTitle(false)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    )
  }

  const handleAddTag = () => {
    if (!newTagName.trim()) return

    const colors = ['#E8845F', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newTag = { id: 'tag_' + Date.now(), name: newTagName.trim(), color: randomColor }
    const updatedTags = [...allTags, newTag]
    localStorage.setItem('thinkgrid_tags', JSON.stringify(updatedTags))
    setAllTags(updatedTags)
    setSelectedTags((prev) => [...prev, newTag.id])
    setNewTagName('')
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
          {isEditing ? '编辑笔记' : '新建笔记'}
        </h1>
        <button
          onClick={handleSave}
          className="bg-coral-gradient text-white px-5 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform"
        >
          保存
        </button>
      </header>

      {/* 编辑区域 */}
      <div className="px-5">
        {/* 标题输入 */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            className="flex-1 bg-transparent text-text-primary text-xl font-semibold placeholder-text-secondary/30 outline-none py-2"
          />
          <button
            onClick={handleGenerateTitle}
            disabled={generatingTitle}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-coral-light text-xs font-medium border border-dark-border/50 hover:border-coral-light/30 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {generatingTitle ? (
              <>
                <span className="w-3 h-3 border-2 border-coral-light/30 border-t-coral-light rounded-full animate-spin" />
                生成中
              </>
            ) : (
              <>
                <span>✨</span> AI 生成标题
              </>
            )}
          </button>
        </div>

        {/* 标签选择 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs">标签</span>
            <button
              onClick={() => setShowTagSelector(!showTagSelector)}
              className="text-coral-light text-xs font-medium"
            >
              {showTagSelector ? '收起' : '+ 管理标签'}
            </button>
          </div>

          {/* 已选标签 */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedTags.map((tagId) => (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: (allTags.find(t => t.id === tagId)?.color || '#E8845F') + '20',
                  color: allTags.find(t => t.id === tagId)?.color || '#E8845F',
                }}
              >
                {getTagName(tagId)}
                <button
                  onClick={() => toggleTag(tagId)}
                  className="opacity-60 hover:opacity-100 ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedTags.length === 0 && (
              <span className="text-text-secondary/40 text-xs">未选择标签</span>
            )}
          </div>

          {/* 标签选择器 */}
          {showTagSelector && (
            <div className="bg-[#141414] rounded-xl p-3 mb-2 border border-dark-border/50">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'ring-2 ring-white/20'
                        : ''
                    }`}
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && ' ✓'}
                  </button>
                ))}
              </div>

              {/* 添加新标签 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="新建标签..."
                  className="flex-1 bg-dark-card rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none border border-dark-border/50 focus:border-coral-light/50"
                />
                <button
                  onClick={handleAddTag}
                  className="bg-coral-gradient text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                >
                  添加
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 正文编辑 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录你的思考..."
          className="w-full bg-transparent text-text-primary placeholder-text-secondary/30 outline-none resize-none min-h-[300px] leading-relaxed text-base"
        />
      </div>
    </div>
  )
}
