import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodos, addTodo, toggleTodo, deleteTodo, clearCompletedTodos, updateTodo } from '../services/storage.js'

export default function TodoPage() {
  const navigate = useNavigate()
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('pending') // 'pending' | 'completed'
  const [showAddModal, setShowAddModal] = useState(false)
  const [newText, setNewText] = useState('')
  const [newReminderEnabled, setNewReminderEnabled] = useState(false)
  const [newReminderDate, setNewReminderDate] = useState('')
  const inputRef = useRef(null)

  // 筛选后的列表
  const filteredTodos = todos.filter((t) => filter === 'pending' ? !t.completed : t.completed)
  const pendingCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.filter((t) => t.completed).length

  useEffect(() => {
    loadTodos()
  }, [])

  function loadTodos() {
    setTodos(getTodos())
  }

  const handleToggle = (id) => {
    toggleTodo(id)
    loadTodos()
  }

  const handleDelete = (id) => {
    deleteTodo(id)
    loadTodos()
  }

  const handleToggleReminder = (todo) => {
    if (!todo.reminderEnabled && newReminderEnabled) {
      // 启用提醒 - 使用默认时间（1小时后）
      const remindAt = Date.now() + 60 * 60 * 1000
      updateTodo(todo.id, { reminderEnabled: true, reminderAt: remindAt })
      loadTodos()
    } else if (todo.reminderEnabled && !newReminderEnabled) {
      // 关闭提醒
      updateTodo(todo.id, { reminderEnabled: false, reminderAt: null })
      loadTodos()
    }
  }

  const handleAddTodo = () => {
    if (!newText.trim()) return
    let reminderAt = null
    if (newReminderEnabled && newReminderDate) {
      reminderAt = new Date(newReminderDate).getTime()
      if (reminderAt <= Date.now()) reminderAt = null
    }
    addTodo(newText.trim(), reminderAt)
    setNewText('')
    setNewReminderEnabled(false)
    setNewReminderDate('')
    setShowAddModal(false)
    loadTodos()
  }

  const handleClearCompleted = () => {
    if (confirm(`确定清除已完成的 ${completedCount} 条待办？`)) {
      clearCompletedTodos()
      loadTodos()
    }
  }

  const formatDateTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const formatReminderTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  // 最小日期为当前时间
  const minDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-dark-border/30">
        <button onClick={() => navigate(-1)} className="text-text-secondary text-lg">‹</button>
        <h1 className="text-text-primary font-semibold text-base">待办</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-8 h-8 rounded-full bg-coral-gradient text-white flex items-center justify-center text-lg shadow-lg shadow-coral-light/20 active:scale-95"
        >
          +
        </button>
      </div>

      {/* 筛选标签 */}
      <div className="px-5 py-3 flex items-center gap-3">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            filter === 'pending'
          ? 'bg-dark-bg text-coral-light'
                  : 'bg-dark-card text-text-secondary hover:text-text-primary'
          }`}
        >
          进行中
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            filter === 'completed'
          ? 'bg-dark-card text-text-primary ring-1 ring-dark-border/50'
                  : 'bg-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          已完成 ({completedCount})
        </button>
      </div>

      {/* 待办列表 */}
      <div className="flex-1 px-5 pb-24 overflow-y-auto">
        {filteredTodos.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-3xl block mb-3">{filter === 'pending' ? '📝' : '✅'}</span>
            <p className="text-text-secondary/50 text-sm">
              {filter === 'pending' ? '暂无待办事项' : '还没有完成的待办'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-dark-card rounded-2xl p-4 border border-dark-border/30 group transition-all ${todo.completed ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* 复选框 */}
                  <button
                    onClick={() => handleToggle(todo.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      todo.completed
                        ? 'bg-[#4ADE80] border-[#4ADE80]'
                        : 'border-text-secondary/40 hover:border-coral-light'
                    }`}
                  >
                    {todo.completed && (
                      <svg className="w-3 h-3 text-[#0A0A0A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* 内容区 */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${todo.completed ? 'line-through text-text-secondary/40' : 'text-text-primary'}`}>
                      {todo.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-text-secondary/35">
                        {formatDateTime(todo.createdAt)}
                      </span>
                      {todo.reminderEnabled && todo.reminderAt && (
                        <span className="text-[11px] text-coral-light/70">
                          🔔 {formatReminderTime(todo.reminderAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 右侧操作 */}
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 提醒开关 */}
                    <label className="relative inline-flex cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!(todo.reminderEnabled && todo.reminderAt)}
                        onChange={(e) => handleToggleReminder({ ...todo, reminderEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-5 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:bg-coral-light/30 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-secondary/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-coral-light"></div>
                    </label>

                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(todo.id) }}
                      className="text-red-400/60 hover:text-red-400 text-sm px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 清除已完成按钮 */}
        {filter === 'completed' && completedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="mt-6 w-full py-3 rounded-xl bg-red-500/10 text-red-400/70 text-sm hover:bg-red-500/20 transition-colors"
          >
            清除全部已完成 ({completedCount})
          </button>
        )}
      </div>

      {/* 底部添加按钮（仅在待办列表页显示） */}
      {filteredTodos.length > 0 && filter === 'pending' && (
        <div className="fixed bottom-6 left-5 right-5 z-40">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-3.5 bg-coral-gradient text-white rounded-2xl font-medium text-sm shadow-lg shadow-coral-light/20 active:scale-[0.98] transition-transform"
          >
            添加事项
          </button>
        </div>
      )}

      {/* 添加待办弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[70]" onClick={() => setShowAddModal(false)}>
          <div className="bg-dark-card rounded-t-3xl w-full max-w-lg p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">添加待办</h3>

              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="输入待办内容..."
                autoFocus
                className="w-full bg-dark-bg/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-secondary/30 outline-none border border-dark-border/30 focus:border-coral-light/40 mb-4"
              />

            {/* 提醒设置 */}
            <div className="flex items-center justify-between mb-5 p-3 bg-dark-bg/50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔔 提醒</span>
                <span className="text-xs text-text-secondary/50">{newReminderEnabled ? '开启' : '关闭'}</span>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={newReminderEnabled}
                  onChange={(e) => setNewReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-dark-card peer-focus:outline-none rounded-full peer peer-checked:bg-coral-light/30 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-secondary/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-coral-light"></div>
              </label>
            </div>

            {newReminderEnabled && (
              <div className="mb-5">
                <label className="text-xs text-text-secondary/50 block mb-1.5">选择提醒时间</label>
                <input
                  type="datetime-local"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  min={minDateTime()}
                  className="w-full bg-dark-bg/50 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none border border-dark-border/30 focus:border-coral-light/40"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-dark-card text-text-secondary font-medium text-sm border border-dark-border/30"
              >
                取消
              </button>
              <button
                onClick={handleAddTodo}
                disabled={!newText.trim()}
                className="flex-1 py-3 rounded-xl bg-coral-gradient text-white font-medium text-sm disabled:opacity-30 disabled:shadow-none shadow-lg shadow-coral-light/20 active:scale-95"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
