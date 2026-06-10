import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { App as CapacitorApp } from '@capacitor/app';
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
  const location = useLocation()
  const [showExitToast, setShowExitToast] = useState(false)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const exitTimerRef = useRef(null)
  const editConfirmTimerRef = useRef(null)

  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      // 如果正在显示编辑确认框，则关闭它
      if (showEditConfirm) {
        setShowEditConfirm(false)
        return
      }

      // 如果正在显示退出提示，则退出应用
      if (showExitToast) {
        CapacitorApp.exitApp()
        return
      }

      // 根据当前路由处理返回逻辑
      if (location.pathname === '/') {
        // 在首页，显示退出提示
        setShowExitToast(true)
        // 2秒后自动隐藏提示
        exitTimerRef.current = setTimeout(() => {
          setShowExitToast(false)
        }, 2000)
      } else if (location.pathname === '/note/new' || location.pathname.startsWith('/note/edit')) {
        // 在编辑页面，显示自定义确认框
        setShowEditConfirm(true)
      } else {
        // 在其他页面，直接返回上一页
        navigate(-1)
      }
    })

    return () => {
      backButtonListener.remove()
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
      }
      if (editConfirmTimerRef.current) {
        clearTimeout(editConfirmTimerRef.current)
      }
    }
  }, [location, navigate, showExitToast, showEditConfirm])

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
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          再按一次退出应用
        </div>
      )}

      {/* 编辑页面退出确认框 */}
      {showEditConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">退出编辑？</h3>
            <p className="text-gray-600 mb-6">未保存的内容将丢失</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleEditConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => handleEditConfirm(true)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
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
