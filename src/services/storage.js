// 本地存储服务
const STORAGE_KEYS = {
  NOTES: 'thinkgrid_notes',
  TAGS: 'thinkgrid_tags',
  SETTINGS: 'thinkgrid_settings',
  STATS: 'thinkgrid_stats',
}

// ==================== 笔记 CRUD ====================

// 获取所有笔记
export function getNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 获取单条笔记
export function getNoteById(id) {
  const notes = getNotes()
  return notes.find((note) => note.id === id) || null
}

// 保存笔记（新建或更新）
export function saveNote(note) {
  const notes = getNotes()
  const now = Date.now()

  if (note.id) {
    // 更新
    const index = notes.findIndex((n) => n.id === note.id)
    if (index >= 0) {
      notes[index] = {
        ...notes[index],
        ...note,
        updatedAt: now,
      }
    }
    saveNotes(notes)
    updateStats('edit')
    return note.id
  } else {
    // 新建
    const newNote = {
      ...note,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      tags: note.tags || [],
    }
    notes.unshift(newNote)
    saveNotes(notes)
    updateStats('create')
    return newNote.id
  }
}

// 删除笔记
export function deleteNote(id) {
  let notes = getNotes()
  notes = notes.filter((n) => n.id !== id)
  saveNotes(notes)
  updateStats('delete')
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

// ==================== 标签管理 ====================

// 获取所有标签
export function getTags() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TAGS)
    return data ? JSON.parse(data) : getDefaultTags()
  } catch {
    return getDefaultTags()
  }
}

// 获取默认标签
function getDefaultTags() {
  const defaultTags = [
    { id: 'tag_1', name: '工作', color: '#E8845F' },
    { id: 'tag_2', name: '学习', color: '#3B82F6' },
    { id: 'tag_3', name: '灵感', color: '#8B5CF6' },
    { id: 'tag_4', name: '生活', color: '#10B981' },
  ]
  saveTags(defaultTags)
  return defaultTags
}

// 添加标签
export function addTag(name, color = '#E8845F') {
  const tags = getTags()
  const newTag = {
    id: 'tag_' + generateId(),
    name,
    color,
  }
  tags.push(newTag)
  saveTags(tags)
  return newTag
}

// 删除标签
export function deleteTag(id) {
  let tags = getTags()
  tags = tags.filter((t) => t.id !== id)
  saveTags(tags)

  // 同时移除笔记中的该标签
  const notes = getNotes()
  let changed = false
  const updatedNotes = notes.map((note) => {
    if (note.tags && note.tags.includes(id)) {
      changed = true
      return { ...note, tags: note.tags.filter((t) => t !== id) }
    }
    return note
  })
  if (changed) {
    saveNotes(updatedNotes)
  }
}

function saveTags(tags) {
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags))
}

// 获取标签对应的笔记数量
export function getTagNoteCount(tagId) {
  const notes = getNotes()
  return notes.filter((n) => n.tags && n.tags.includes(tagId)).length
}

// 获取标签名称（通过 ID）
export function getTagName(tagId) {
  const tags = getTags()
  const tag = tags.find((t) => t.id === tagId)
  return tag ? tag.name : ''
}

// 获取标签颜色（通过 ID）
export function getTagColor(tagId) {
  const tags = getTags()
  const tag = tags.find((t) => t.id === tagId)
  return tag ? tag.color : '#9CA3AF'
}

// ==================== 设置 ====================

// 获取设置
export function getSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return data ? JSON.parse(data) : getDefaultSettings()
  } catch {
    return getDefaultSettings()
  }
}

function getDefaultSettings() {
  return {
    aiProvider: 'deepseek', // 'deepseek' | 'qwen' | 'zhipu'
    deepseekApiKey: '',
    qwenApiKey: '',
    zhipuApiKey: '',
    userName: '思格用户',
    userBio: '用思格记录每一个思考瞬间',
  }
}

// 保存设置
export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
}

// ==================== 统计数据 ====================

// 获取统计
export function getStats() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS)
    return data ? JSON.parse(data) : getDefaultStats()
  } catch {
    return getDefaultStats()
  }
}

function getDefaultStats() {
  return {
    noteCount: 0,
    tagCount: 0,
    daysUsed: 1,
    firstUseDate: new Date().toDateString(),
  }
}

function updateStats(action) {
  const stats = getStats()
  const notes = getNotes()

  if (action === 'create') {
    stats.noteCount = notes.length
  } else if (action === 'delete') {
    stats.noteCount = notes.length
  } else if (action === 'edit') {
    // 编辑不影响数量
  }

  stats.tagCount = getTags().length

  // 计算使用天数
  const firstDate = new Date(stats.firstUseDate)
  const today = new Date()
  const diffTime = today - firstDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  stats.daysUsed = Math.max(1, diffDays)

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))
}

// 初始化统计
export function initStats() {
  const stats = getStats()
  stats.noteCount = getNotes().length
  stats.tagCount = getTags().length
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))
  return stats
}

// ==================== 工具函数 ====================

// 格式化时间
export function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

// 获取正文预览
export function getContentPreview(content, maxLength = 100) {
  if (!content) return '暂无内容'
  const text = content.replace(/\n/g, ' ').trim()
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
