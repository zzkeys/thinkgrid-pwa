import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/ai/select', label: 'AI', icon: '✨' },
  { path: '/tags', label: '标签', icon: '🏷️' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  // 在某些页面隐藏底部导航
  const hidePaths = ['/note/new', '/note/edit', '/diary/new', '/todos']
  const shouldHide = hidePaths.some((p) => location.pathname.startsWith(p))

  if (shouldHide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="max-w-md mx-auto px-4 pb-2 pt-1">
        <div className="flex items-center justify-around bg-dark-card/95 backdrop-blur-lg rounded-full px-2 py-1.5 shadow-2xl border border-dark-border/50">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-coral-gradient text-white shadow-lg shadow-coral-light/20'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className={`text-lg ${isActive ? 'scale-110' : ''} transition-transform`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
