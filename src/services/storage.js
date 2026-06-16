// 本地存储服务
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { LocalNotifications } from '@capacitor/local-notifications'

const STORAGE_KEYS = {
  NOTES: 'thinkgrid_notes',
  TAGS: 'thinkgrid_tags',
  SETTINGS: 'thinkgrid_settings',
  STATS: 'thinkgrid_stats',
  TODOS: 'thinkgrid_todos',
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

// 按日期获取笔记
export function getNotesByDate(date) {
  const notes = getNotes()
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const nextDate = new Date(targetDate)
  nextDate.setDate(nextDate.getDate() + 1)
  
  return notes.filter((note) => {
    const noteDate = new Date(note.createdAt)
    return noteDate >= targetDate && noteDate < nextDate
  })
}

// 获取有笔记的日期列表（某个月）
export function getDatesWithNotes(year, month) {
  const notes = getNotes()
  const datesWithNotes = new Set()
  
  notes.forEach((note) => {
    const noteDate = new Date(note.createdAt)
    if (noteDate.getFullYear() === year && noteDate.getMonth() === month) {
      datesWithNotes.add(noteDate.getDay())
    }
  })
  
  return datesWithNotes
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
    // AI 功能开关
    aiEnabled: true,
    // AI 提供商和模型
    aiProvider: 'zhipu', // 'deepseek' | 'qwen' | 'zhipu'
    aiModel: 'glm-4-flash', // 具体模型名称
    // API 配置
    apiUrl: '', // 自定义 API 地址（为空则使用默认）
    apiKey: '', // 统一的 API Key
    // 自定义提示词
    customPromptEnabled: false,
    customPrompt: '',
    // 兼容旧配置
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

// ==================== 导入导出 ====================

// 根据类型筛选数据
function filterByType(data, type) {
  if (type === 'all') return data
  if (type === 'notes') return data.filter((n) => n.type !== 'diary')
  if (type === 'diaries') return data.filter((n) => n.type === 'diary')
  return data
}

// 导出为 JSON 备份（支持选择类型）
export function exportToJSON(type = 'all') {
  try {
    const allNotes = getNotes()
    const notes = filterByType(allNotes, type)
    const tags = getTags()
    // 如果导出的是筛选后的笔记，也只导出相关标签
    const noteTagIds = new Set(notes.flatMap((n) => n.tags || []))
    const filteredTags = tags.filter((t) => noteTagIds.has(t.id))

    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      exportType: type,
      notes: notes,
      tags: type === 'todos' ? [] : filteredTags,
      settings: type === 'todos' ? {} : getSettings(),
      stats: type === 'todos' ? {} : getStats(),
    }
    if (type === 'todos' || type === 'all') {
      data.todos = getTodos()
    }
    const jsonStr = JSON.stringify(data, null, 2)
    const typeLabel = { all: '完整备份', notes: '笔记', diaries: '日记', todos: '待办' }[type] || '数据'
    downloadFile(jsonStr, `thinkgrid_${type}_${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
    return { success: true, type, label: typeLabel }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 通用下载函数（自动适配 Web / Android）
async function downloadFile(content, filename, mimeType) {
  // 在原生平台（Android App）使用 Filesystem API 写入下载目录
  if (Capacitor.isNativePlatform()) {
    try {
      // 对于文本类型，需要转成 base64
      let data = content
      if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('markdown')) {
        // 将文本转为 base64
        const encoder = new TextEncoder()
        const bytes = encoder.encode(content)
        data = btoa(String.fromCharCode(...bytes))
      }

      // 写入 Downloads 目录（Android 10+ 通过 MediaStore 自动处理）
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Downloads,
        encoding: mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('markdown')
          ? Encoding.UTF8
          : undefined,
        recursive: true,
      })

      return { success: true, native: true, uri: result.uri }
    } catch (error) {
      console.error('Filesystem write failed:', error)
      // 降级：尝试通过分享方式保存
      try {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8' })
        const base64 = await blobToBase64(blob)
        await Filesystem.writeFile({
          path: filename,
          data: base64.split(',')[1], // 去掉 data:... 前缀
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        })
        return { success: true, native: true, fallback: true }
      } catch (e2) {
        return { success: false, error: e2.message }
      }
    }
  }

  // Web / PWA：使用 Blob + <a> 下载
  const charset = mimeType.includes('text') || mimeType.includes('markdown') ? ';charset=utf-8' : ''
  const blob = new Blob([content], { type: mimeType + charset })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  a.setAttribute('target', '_blank')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { success: true, native: false }
}

// Blob 转 base64 辅助函数
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// 导出为 Markdown（支持选择类型）
export function exportToMarkdown(type = 'all') {
  try {
    const allNotes = getNotes()
    const notes = filterByType(allNotes, type)
    const tags = getTags()

    let markdown = `# 思格笔记导出${type !== 'all' ? '（' + { notes: '笔记', diaries: '日记', todos: '待办' }[type] + '）' : ''}\n\n`
    markdown += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`
    markdown += `---\n\n`

    notes.forEach((note, index) => {
      markdown += `## ${index + 1}. ${note.title || '无标题'}\n\n`

      if (note.type === 'diary') {
        if (note.weather) {
          const w = WEATHER_OPTIONS.find(w => w.id === note.weather)
          if (w) markdown += `**天气**：${w.icon} ${w.label}\n\n`
        }
        if (note.mood) {
          const m = MOOD_OPTIONS.find(m => m.id === note.mood)
          if (m) markdown += `**心情**：${m.emoji} ${m.label}\n\n`
        }
      }

      if (note.tags && note.tags.length > 0) {
        const tagNames = note.tags.map((tid) => {
          const tag = tags.find((t) => t.id === tid)
          return tag ? tag.name : ''
        }).filter(Boolean)
        if (tagNames.length > 0) {
          markdown += `**标签**：${tagNames.join('、')}\n\n`
        }
      }

      markdown += `**时间**：${new Date(note.createdAt).toLocaleString('zh-CN')}\n\n`
      markdown += `${note.content || '暂无内容'}\n\n`
      markdown += `---\n\n`
    })

    // 导出待办
    if (type === 'todos' || type === 'all') {
      const todos = getTodos()
      if (todos.length > 0) {
        markdown += `## 待办清单\n\n`
        todos.forEach((t, i) => {
          markdown += `- [${t.completed ? 'x' : ' '}] ${t.text}${t.reminderAt ? ' 🔔' + new Date(t.reminderAt).toLocaleString('zh-CN') : ''}\n`
        })
        markdown += `\n---\n\n`
      }
    }

    const typeLabel = { all: '完整', notes: '笔记', diaries: '日记', todos: '待办' }[type] || ''
    downloadFile(markdown, `thinkgrid_${type}_${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown')
    return { success: true, type, label: typeLabel }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 导出为纯文本（支持选择类型）
export function exportToText(type = 'all') {
  try {
    const allNotes = getNotes()
    const notes = filterByType(allNotes, type)
    const tags = getTags()

    let text = `思格笔记导出${type !== 'all' ? '（' + { notes: '笔记', diaries: '日记', todos: '待办' }[type] + '）' : ''}\n`
    text += `导出时间：${new Date().toLocaleString('zh-CN')}\n`
    text += `================================\n\n`

    notes.forEach((note, index) => {
      text += `[${index + 1}] ${note.title || '无标题'}\n`

      if (note.type === 'diary') {
        if (note.weather) {
          const w = WEATHER_OPTIONS.find(w => w.id === note.weather)
          if (w) text += `天气：${w.icon} ${w.label}\n`
        }
        if (note.mood) {
          const m = MOOD_OPTIONS.find(m => m.id === note.mood)
          if (m) text += `心情：${m.emoji} ${m.label}\n`
        }
      }

      if (note.tags && note.tags.length > 0) {
        const tagNames = note.tags.map((tid) => {
          const tag = tags.find((t) => t.id === tid)
          return tag ? tag.name : ''
        }).filter(Boolean)
        if (tagNames.length > 0) {
          text += `标签：${tagNames.join('、')}\n`
        }
      }

      text += `时间：${new Date(note.createdAt).toLocaleString('zh-CN')}\n`
      text += `--------------------------------\n`
      text += `${note.content || '暂无内容'}\n\n`
    })

    // 导出待办
    if (type === 'todos' || type === 'all') {
      const todos = getTodos()
      if (todos.length > 0) {
        text += `\n待办清单\n`
        text += `================================\n`
        todos.forEach((t, i) => {
          text += `[${t.completed ? 'x' : ' '}] ${t.text}${t.reminderAt ? ' 🔔' + new Date(t.reminderAt).toLocaleString('zh-CN') : ''}\n`
        })
      }
    }

    const typeLabel = { all: '完整', notes: '笔记', diaries: '日记', todos: '待办' }[type] || ''
    downloadFile(text, `thinkgrid_${type}_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain')
    return { success: true, type, label: typeLabel }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 从 JSON 导入
export function importFromJSON(fileContent) {
  try {
    const data = JSON.parse(fileContent)

    if (!data.notes || !Array.isArray(data.notes)) {
      throw new Error('无效的备份文件格式')
    }

    // 合并笔记（避免重复ID）
    const existingNotes = getNotes()
    const existingIds = new Set(existingNotes.map((n) => n.id))
    const newNotes = data.notes.filter((n) => !existingIds.has(n.id))

    // 合并标签
    if (data.tags && Array.isArray(data.tags)) {
      const existingTags = getTags()
      const existingTagIds = new Set(existingTags.map((t) => t.id))
      const newTags = data.tags.filter((t) => !existingTagIds.has(t.id))
      if (newTags.length > 0) {
        saveTags([...existingTags, ...newTags])
      }
    }

    // 保存笔记
    if (newNotes.length > 0) {
      saveNotes([...newNotes, ...existingNotes])
    }

    return {
      success: true,
      importedNotes: newNotes.length,
      skippedNotes: data.notes.length - newNotes.length,
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ==================== 待办事项 CRUD ====================

const TODO_STORAGE_KEY = 'thinkgrid_todos'

// 获取所有待办事项（按创建时间倒序，未完成的在前）
export function getTodos() {
  try {
    const data = localStorage.getItem(TODO_STORAGE_KEY)
    if (!data) return []
    const todos = JSON.parse(data)
    // 未完成在前，已完成在后；同状态按时间倒序
    return todos.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.createdAt - a.createdAt
    })
  } catch {
    return []
  }
}

// 保存待办列表
function saveTodos(todos) {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos))
}

// 添加待办事项
export function addTodo(text, reminderAt = null) {
  if (!text || !text.trim()) return null
  const todos = getTodos()
  const now = Date.now()
  const newTodo = {
    id: now.toString(36) + Math.random().toString(36).substring(2, 8),
    text: text.trim(),
    completed: false,
    createdAt: now,
    completedAt: null,
    reminderAt: reminderAt, // 提醒时间戳（null = 不提醒）
    reminderEnabled: !!reminderAt,
    notificationId: null,
  }
  // 设置本地通知
  if (newTodo.reminderEnabled && reminderAt && reminderAt > now) {
    scheduleTodoNotification(newTodo)
  }
  todos.unshift(newTodo)
  saveTodos(todos)
  return newTodo
}

// 更新待办事项
export function updateTodo(id, updates) {
  const todos = getTodos()
  const index = todos.findIndex((t) => t.id === id)
  if (index < 0) return null

  const oldTodo = todos[index]
  const updatedTodo = { ...oldTodo, ...updates }
  todos[index] = updatedTodo
  saveTodos(todos)

  // 如果提醒时间变了，重新设置通知
  if ('reminderAt' in updates || 'reminderEnabled' in updates) {
    if (updatedTodo.reminderEnabled && updatedTodo.reminderAt && !updatedTodo.completed) {
      scheduleTodoNotification(updatedTodo)
    } else if (oldTodo.notificationId) {
      cancelTodoNotification(oldTodo.notificationId)
      updatedTodo.notificationId = null
      todos[index] = updatedTodo
      saveTodos(todos)
    }
  }

  return updatedTodo
}

// 切换待办完成状态
export function toggleTodo(id) {
  const todos = getTodos()
  const todo = todos.find((t) => t.id === id)
  if (!todo) return null
  todo.completed = !todo.completed
  todo.completedAt = todo.completed ? Date.now() : null

  // 完成时取消通知，重新打开未完成且有提醒时恢复
  if (todo.completed && todo.notificationId) {
    cancelTodoNotification(todo.notificationId)
    todo.notificationId = null
  } else if (!todo.completed && todo.reminderEnabled && todo.reminderAt && todo.reminderAt > Date.now()) {
    scheduleTodoNotification(todo)
  }

  saveTodos(todos)
  return todo
}

// 删除待办事项
export function deleteTodo(id) {
  let todos = getTodos()
  todos = todos.filter((t) => t.id !== id)
  saveTodos(todos)
}

// 清除已完成的待办
export function clearCompletedTodos() {
  const todos = getTodos()
  const completed = todos.filter((t) => t.completed)
  // 取消已完成待办的通知
  completed.forEach((t) => {
    if (t.notificationId) cancelTodoNotification(t.notificationId)
  })
  const remaining = todos.filter((t) => !t.completed)
  saveTodos(remaining)
  return todos.length - remaining.length
}

// ==================== 待办通知功能 ====================

// 安排本地通知
async function scheduleTodoNotification(todo) {
  try {
    // 先取消旧通知
    if (todo.notificationId) {
      await cancelTodoNotification(todo.notificationId)
    }

    if (!Capacitor.isNativePlatform()) return

    const notifications = await LocalNotifications.requestPermissions()
    if (!notifications.display) return

    const now = Date.now()
    const scheduleTime = new Date(todo.reminderAt).getTime()

    if (scheduleTime <= now) return

    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(todo.id, 36) || Math.abs(hashCode(todo.id)) % 100000,
          title: '⏰ 待办提醒',
          body: todo.text,
          schedule: { at: new Date(scheduleTime) },
          sound: 'default',
          smallIcon: 'ic_stat_notify',
          channelId: 'thinkgrid_todos',
          channelName: '思格待办提醒',
        },
      ],
    })

    todo.notificationId = String(parseInt(todo.id, 36) || Math.abs(hashCode(todo.id)) % 100000)
  } catch (e) {
    console.error('Schedule notification failed:', e)
  }
}

async function cancelTodoNotification(notificationId) {
  try {
    if (!Capacitor.isNativePlatform()) return
    await LocalNotifications.cancel({ notifications: [{ id: Number(notificationId) }] })
  } catch (e) {
    console.error('Cancel notification failed:', e)
  }
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return hash
}

// ==================== 日记相关 ====================

// 笔记类型常量
export const NOTE_TYPES = {
  NORMAL: 'note',      // 普通笔记
  DIARY: 'diary',      // 日记
}

// 天气选项
export const WEATHER_OPTIONS = [
  { id: 'sunny', icon: '☀️', label: '晴' },
  { id: 'cloudy', icon: '☁️', label: '多云' },
  { id: 'rainy', icon: '🌧️', label: '雨' },
  { id: 'snowy', icon: '❄️', label: '雪' },
  { id: 'windy', icon: '💨', label: '风' },
  { id: 'thunder', icon: '⛈️', label: '雷' },
  { id: 'foggy', icon: '🌫️', label: '雾' },
]

// 心情选项
export const MOOD_OPTIONS = [
  { id: 'happy', emoji: '😊', label: '开心', color: '#FFD93D' },
  { id: 'sad', emoji: '😢', label: '难过', color: '#6BCB77' },
  { id: 'angry', emoji: '😠', label: '生气', color: '#FF6B6B' },
  { id: 'calm', emoji: '😌', label: '平静', color: '#4D96FF' },
  { id: 'excited', emoji: '🤩', label: '兴奋', color: '#FF9E00' },
  { id: 'tired', emoji: '😴', label: '疲惫', color: '#A8A8A8' },
  { id: 'anxious', emoji: '😰', label: '焦虑', color: '#C9B1FF' },
  { id: 'love', emoji: '🥰', label: '甜蜜', color: '#FF6BD6' },
]

// 获取日记列表（按日期倒序）
export function getDiaries() {
  const notes = getNotes()
  return notes
    .filter((n) => n.type === NOTE_TYPES.DIARY)
    .sort((a, b) => b.createdAt - a.createdAt)
}

// 获取今日日记
export function getTodayDiary() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const diaries = getDiaries()
  return diaries.find((d) => {
    const dDate = new Date(d.createdAt)
    return dDate >= today && dDate < tomorrow
  }) || null
}

// 保存日记（使用 saveNote，自动添加 type: 'diary'）
export function saveDiary(diaryData) {
  return saveNote({
    ...diaryData,
    type: NOTE_TYPES.DIARY,
  })
}

// 获取日记统计（连续写日记天数等）
export function getDiaryStats() {
  const diaries = getDiaries()
  if (diaries.length === 0) return { total: 0, streak: 0, thisMonth: 0 }

  // 统计总篇数
  const total = diaries.length

  // 本月篇数
  const now = new Date()
  const thisMonth = diaries.filter((d) => {
    const dDate = new Date(d.createdAt)
    return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()
  }).length

  // 计算连续天数
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(today)

  while (true) {
    const dayStart = checkDate.getTime()
    const nextDay = new Date(checkDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const hasDiary = diaries.some((d) => {
      const dDate = d.createdAt
      return dDate >= dayStart && dDate < nextDay.getTime()
    })

    if (hasDiary) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      // 如果是今天还没有写，不算断签
      if (streak === 0 && checkDate.getTime() === today.getTime()) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      }
      break
    }
  }

  return { total, streak, thisMonth }
}
