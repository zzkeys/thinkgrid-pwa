import { useState, useEffect, useRef } from 'react'
import { getTodos, addTodo, toggleTodo, deleteTodo, clearCompletedTodos, formatTime } from '../services/storage.js'

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [newTodoText, setNewTodoText] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)
  const inputRef = useRef(null)

  // 分离未完成和已完成
  const pendingTodos = todos.filter((t) => !t.completed)
  const completedTodos = todos.filter((t) => t.completed)

  useEffect(() => {
    loadTodos()
  }, [])

  function loadTodos() {
    setTodos(getTodos())
  }

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return
    addTodo(newTodoText)
    setNewTodoText('')
    loadTodos()
    inputRef.current?.focus()
  }

  const handleToggle = (id) => {
    toggleTodo(id)
    loadTodos()
  }

  const handleDelete = (id) => {
    deleteTodo(id)
    loadTodos()
  }

  const handleClearCompleted = () => {
    clearCompletedTodos()
    loadTodos()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTodo()
    }
  }

  return (
    <div className="bg-dark-card rounded-2xl border border-dark-border/50 overflow-hidden mb-4">
      {/* 头部 */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-dark-border/30">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <h3 className="text-text-primary font-semibold text-sm">待办清单</h3>
        </div>
        <div className="flex items-center gap-3">
          {completedTodos.length > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-text-secondary/50 text-[11px] hover:text-red-400 transition-colors"
            >
              清除已完({completedTodos.length})
            </button>
          )}
          <span className="text-text-secondary/40 text-[11px]">
            {pendingTodos.length}/{todos.length}
          </span>
        </div>
      </div>

      {/* 添加输入框 */}
      <div className="px-5 py-3 border-b border-dark-border/20">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="添加待办事项..."
            className="flex-1 bg-[#0F0F0F] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 outline-none border border-dark-border/30 focus:border-coral-light/40 transition-colors"
          />
          <button
            onClick={handleAddTodo}
            disabled={!newTodoText.trim()}
            className="w-10 h-10 rounded-xl bg-coral-gradient text-white flex items-center justify-center text-lg font-medium shadow-lg shadow-coral-light/20 active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none flex-shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* 时间线列表 */}
      <div className="px-5 py-2">
        {todos.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-3xl block mb-2">✨</span>
            <p className="text-text-secondary/50 text-xs">暂无待办事项</p>
            <p className="text-text-secondary/30 text-[10px] mt-1">添加一个开始吧</p>
          </div>
        ) : (
          <>
            {/* 未完成 */}
            {pendingTodos.map((todo, index) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isFirst={index === 0}
                isLast={pendingTodos.length === 1 || index === pendingTodos.length - 1}
                showCompletedSection={false}
                onToggle={() => handleToggle(todo.id)}
                onDelete={() => handleDelete(todo.id)}
              />
            ))}

            {/* 已完成的分隔线 */}
            {completedTodos.length > 0 && (
              <div className="relative py-3">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center justify-center gap-2 text-text-secondary/40 text-[11px] hover:text-text-secondary/60 transition-colors"
                >
                  <div className="flex-1 h-px bg-dark-border/30" />
                  <span>已完成 {showCompleted ? '▲' : '▼'} ({completedTodos.length})</span>
                  <div className="flex-1 h-px bg-dark-border/30" />
                </button>

                {/* 已完成的待办 */}
                {showCompleted && completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isFirst={false}
                    isLast={false}
                    showCompletedSection={true}
                    onToggle={() => handleToggle(todo.id)}
                    onDelete={() => handleDelete(todo.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// 单个待办项（时间线样式）
function TodoItem({ todo, isFirst, isLast, showCompletedSection, onToggle, onDelete }) {
  const timeStr = formatTime(todo.createdAt)

  return (
    <div className={`group relative flex items-start gap-3 py-2.5 ${showCompletedSection ? 'opacity-60' : ''}`}>
      {/* 时间线竖线 + 圆点 */}
      <div className="flex-shrink-0 flex flex-col items-center pt-1">
        {/* 圆点 */}
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            todo.completed
              ? 'bg-[#4ADE80]/20 border-[#4ADE80]'
              : 'border-coral-light/60 hover:border-coral-light'
          }`}
        >
          {todo.completed && (
            <svg className="w-3 h-3 text-[#4ADE80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* 内容区域 */}
      <div className={`flex-1 min-w-0 pb-1 ${!isLast ? 'border-l border-dark-border/25 ml-[9px]' : ''} pl-3`}>
        <div className="flex items-start justify-between gap-2">
          <p
            onClick={onToggle}
            className={`text-sm leading-relaxed cursor-pointer transition-all ${
              todo.completed
                ? 'line-through text-text-secondary/40'
                : 'text-text-primary'
            }`}
          >
            {todo.text}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="opacity-0 group-hover:opacity-100 text-text-secondary/40 hover:text-red-400 text-xs px-1 transition-all flex-shrink-0"
          >
            ×
          </button>
        </div>
        <span className="text-[10px] text-text-secondary/30 mt-0.5 block">
          {timeStr}
        </span>
      </div>
    </div>
  )
}
