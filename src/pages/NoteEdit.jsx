import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNoteById, saveNote, getTags, getTagName } from '../services/storage.js'
import { generateTitle, isAIConfigured } from '../services/ai.js'

export default function NoteEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [allTags, setAllTags] = useState([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [generatingTitle, setGeneratingTitle] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)

  // 提取内容中的图片
  const images = useMemo(() => {
    const imgRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g
    const result = []
    let match
    while ((match = imgRegex.exec(content)) !== null) {
      result.push({ alt: match[1], src: match[2], fullMatch: match[0] })
    }
    return result
  }, [content])

  // 删除指定图片
  const handleDeleteImage = (index) => {
    const img = images[index]
    if (!img) return
    const newContent = content.replace(img.fullMatch, '')
    setContent(newContent.replace(/\n{3,}/g, '\n\n').trim())
  }

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
      title: title.trim(), // 允许为空
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

  // 处理图片上传
  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 检查文件大小（限制 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      const imageMarkdown = `\n\n![图片](${base64})\n\n`

      // 插入到光标位置
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart
        const end = textareaRef.current.selectionEnd
        const newContent = content.substring(0, start) + imageMarkdown + content.substring(end)
        setContent(newContent)

        // 恢复光标位置
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + imageMarkdown.length
            textareaRef.current.selectionEnd = start + imageMarkdown.length
            textareaRef.current.focus()
          }
        }, 0)
      } else {
        // 如果无法获取光标位置，则附加到末尾
        setContent((prev) => prev + imageMarkdown)
      }
    }
    reader.readAsDataURL(file)

    // 清空 input，允许重复选择同一文件
    e.target.value = ''
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
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题（可选）"
          className="w-full bg-transparent text-text-primary text-xl font-semibold placeholder-text-secondary/30 outline-none py-2 mb-4"
        />

        {/* 工具栏 */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className="p-2 rounded-lgl bg-[#1A1A1A] text-text-secondary hover:text-text-primary transition-colors border border-dark-border/50"
            title="工具栏"
          >
            ⋯
          </button>
          <button
            onClick={handleImageUpload}
            className="p-2 rounded-lgl bg-[#1A1A1A] text-text-secondary hover:text-text-primary transition-colors border border-dark-border/50"
            title="上传图片"
          >
            📷
          </button>
          <button
            onClick={handleGenerateTitle}
            disabled={generatingTitle}
            className="p-2 rounded-lgl bg-[#1A1A1A] text-coral-light hover:text-coral-light/80 transition-colors border border-dark-border/50 disabled:opacity-50 flex items-center gap-1"
            title="AI 生成标题"
          >
            {generatingTitle ? (
              <span className="w-3 h-3 border-2 border-coral-light/30 border-t-coral-light rounded-full animate-spin" />
            ) : (
              <span>✨</span>
            )}
          </button>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs">已插入图片 ({images.length})</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {images.map((img, index) => (
                <div key={index} className="relative flex-shrink-0 group">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-20 h-20 object-cover rounded-xl border border-dark-border/50"
                  />
                  <button
                    onClick={() => handleDeleteImage(index)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录你的思考..."
          className="w-full bg-transparent text-text-primary placeholder-text-secondary/30 outline-none resize-none min-h-[300px] leading-relaxed text-base"
        />
      </div>
    </div>
  )
}
