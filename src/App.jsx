import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Home from './pages/Home.jsx'
import NoteEdit from './pages/NoteEdit.jsx'
import NoteDetail from './pages/NoteDetail.jsx'
import Tags from './pages/Tags.jsx'
import Profile from './pages/Profile.jsx'
import AISelect from './pages/AISelect.jsx'
import AIResult from './pages/AIResult.jsx'
import BottomNav from './components/BottomNav.jsx'

function App() {
  const navigate = useNavigate()
  const [showExitToast, _setShowExitToast] = useState(false)
  const [showEditConfirm, _setShowEditConfirm] = useState(false)

  // 使用 refs 来存储最新的 state，以便在监听器中使用
  const showExitToastRef = useRef(showExitToast)
  const showEditConfirmRef = useRef(showEditConfirm)
  const exitTimerRef = useRef(null)

  // 包装 setState 以同时更新 ref
  const setShowExitToast = (value) => {
    const newValue = typeof value === 'function' ? value(showExitToastRef.current) : value
    showExitToastRef.current = newValue
    _setShowExitToast(newValue)
  }

  const setShowEditConfirm = (value) => {
    const newValue = typeof value === 'function' ? value(showEditConfirmRef.current) : value
    showEditConfirmRef.current = newValue
    _setShowEditConfirm(newValue)
  }

  useEffect(() => {
    let listener = null

    // 添加返回按钮监听器
    const setupListener = async () => {
      try {
        listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          const currentShowEditConfirm = showEditConfirmRef.current
          const currentShowExitToast = showExitToastRef.current
          // 在 Capacitor WebView 中，使用 window.location.pathname 获取当前路径
          // React Router 使用 history API 导航，window.location 会同步更新
          const currentPath = window.location.pathname

          // 如果正在显示编辑确认框，则关闭它
          if (currentShowEditConfirm) {
            setShowEditConfirm(false)
            return
          }

          // 如果正在显示退出提示，则退出应用
          if (currentShowExitToast) {
            // 只在原生平台退出应用
            if (Capacitor.isNativePlatform()) {
              CapacitorApp.exitApp()
            }
            return
          }

          // 根据当前路由处理返回逻辑
          if (currentPath === '/' || currentPath === '' || currentPath === '#/') {
            // 在首页，显示退出提示
            setShowExitToast(true)
            // 2秒后自动隐藏提示
            if (exitTimerRef.current) {
              clearTimeout(exitTimerRef.current)
            }
            exitTimerRef.current = setTimeout(() => {
              setShowExitToast(false)
            }, 2000)
          } else if (currentPath === '/note/new' || currentPath.startsWith('/note/edit')) {
            // 在编辑页面，显示自定义确认框
            setShowEditConfirm(true)
          } else {
            // 在其他页面，直接返回上一页
            navigate(-1)
          }
        })
      } catch (e) {
        console.error('Failed to add back button listener:', e)
      }
    }

    setupListener()

    return () => {
      if (listener) {
        listener.remove()
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
      }
    }
  }, [navigate])

  const handleEditConfirm = (confirm) => {
    setShowEditConfirm(false)
    if (confirm) {
      navigate(-1)
    }
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/note/new" element={<NoteEdit />} />
          <Route path="/note/edit/:id" element={<NoteEdit />} />
          <Route path="/note/:id" element={<NoteDetail />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/ai/select" element={<AISelect />} />
          <Route path="/ai/result" element={<AIResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />

      {/* 退出提示 Toast */}
      {showExitToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#1A1A1A] text-text-primary px-5 py-3 rounded-xl shadow-lg z-50 text-sm border border-dark-border/50">
          再按一次退出应用
        </div>
      )}

      {/* 编辑页面退出确认框 */}
      {showEditConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60]" onClick={() => setShowEditConfirm(false)}>
          <div className="bg-dark-card rounded-t-3xl w-full max-w-lg p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-2">退出编辑？</h3>
            <p className="text-text-secondary mb-6">未保存的内容将丢失</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleEditConfirm(false)}
                className="flex-1 py-3.5 rounded-xl bg-[#0F0F0F] text-text-secondary font-medium text-sm border border-dark-border/50 hover:border-dark-border transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleEditConfirm(true)}
                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-medium text-sm"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
