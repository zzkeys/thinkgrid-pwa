import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NoteCard from '../components/NoteCard.jsx'
import AICard from '../components/AICard.jsx'
import { getNotes, getDiaryStats, getTodayDiary, getTodos } from '../services/storage.js'
import { WEATHER_OPTIONS, MOOD_OPTIONS } from '../services/storage.js'

export default function Home() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [diaryStats, setDiaryStats] = useState({ total: 0, streak: 0, thisMonth: 0 })
  const [todayDiary, setTodayDiary] = useState(null)
  const [todoCount, setTodoCount] = useState(0)
  const [showQuote, setShowQuote] = useState(true)

  // 只显示普通笔记（排除日记）
  const normalNotes = notes.filter((n) => n.type !== 'diary')

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setNotes(getNotes())
    setDiaryStats(getDiaryStats())
    setTodayDiary(getTodayDiary())
    setTodoCount(getTodos().filter((t) => !t.completed).length)
  }

  const handleGenerate = () => {
    navigate('/ai/select')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* 头部区域 */}
      <div className="px-5 pt-5 pb-3">
        {/* 标题行 */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-wide">思格</h1>
            <p className="text-text-secondary/50 text-xs mt-0.5">记录每一个思考瞬间</p>
          </div>
          <button
            onClick={() => setShowQuote(!showQuote)}
            className="text-text-secondary/30 hover:text-text-secondary/60 text-xs px-2 py-1"
          >
            {showQuote ? '隐藏' : '引言'}
          </button>
        </div>

        {/* 引言 */}
        {showQuote && (
          <div className="mt-3 bg-gradient-to-r from-coral-light/10 via-transparent to-blue-500/10 rounded-xl px-4 py-3 border border-dark-border/20 animate-fade-in">
            <p className="text-text-secondary/70 text-sm italic leading-relaxed">
              " 把自律变成习惯，日子就会慢慢发光。"
            </p>
          </div>
        )}
      </div>

      {/* 横排双卡片：日记 + 待办 */}
      <div className="px-5 mt-1 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* 日记卡片 */}
          <button
            onClick={() => navigate('/diary/new')}
            className="bg-dark-card rounded-2xl p-4 text-left border border-dark-border/30 hover:border-coral-light/20 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-coral-light/5 rounded-full -translate-y-6 translate-x-6"></div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📔</span>
              <span className="text-text-primary font-semibold text-sm">日记</span>
            </div>
            <p className="text-text-secondary/40 text-[11px] leading-relaxed mb-2.5">
              一日一拾，记录此刻
            </p>
            <div className="flex items-center gap-1.5">
              {todayDiary ? (
                <span className="px-2.5 py-1 bg-green-500/15 text-green-400 text-[10px] rounded-full">
                  已记录
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-coral-gradient text-white text-[10px] rounded-full shadow-sm">
                  记录今日
                </span>
              )}
            </div>

            {/* 天气心情预览 */}
            {todayDiary && (
              <div className="flex items-center gap-2 mt-2">
                {todayDiary.weather && (
                  <span className="text-xs">{WEATHER_OPTIONS.find(w => w.id === todayDiary.weather)?.icon}</span>
                )}
                {todayDiary.mood && (
                  <span className="text-xs">{MOOD_OPTIONS.find(m => m.id === todayDiary.mood)?.emoji}</span>
                )}
              </div>
            )}

            <div className="mt-2 text-[10px] text-text-secondary/25">
              连续{diaryStats.streak}天 · 本月{diaryStats.thisMonth}篇
            </div>
          </button>

          {/* 待办清单卡片 */}
          <button
            onClick={() => navigate('/todos')}
            className="bg-dark-card rounded-2xl p-4 text-left border border-dark-border/30 hover:border-blue-500/20 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6"></div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⏳</span>
              <span className="text-text-primary font-semibold text-sm">待办清单</span>
            </div>
            <p className="text-text-secondary/40 text-[11px] leading-relaxed mb-2.5">
              规划每一天
            </p>
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 text-[10px] rounded-full ${
                todoCount > 0 ? 'bg-blue-500/15 text-blue-400' : 'bg-[#1A1A1A] text-text-secondary/30'
              }`}>
                {todoCount > 0 ? `${todoCount}项待处理` : '暂无待办'}
              </span>
              <span className="text-text-secondary/25 text-[10px]">
                去管理 →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* AI 洞察入口 */}
      <div className="px-5">
        <AICard onGenerate={handleGenerate} />
      </div>

      {/* 笔记列表标题 */}
      <div className="px-5 mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-text-primary font-semibold text-sm">我的笔记</h2>
        <button
          onClick={() => navigate('/note/new')}
          className="text-coral-light text-xs hover:text-coral-light/80 transition-colors"
        >
          + 新建
        </button>
      </div>

      {/* 笔记列表（仅普通笔记） */}
      <div className="px-5 pb-28">
        {normalNotes.length === 0 ? (
          <div className="py-12 text-center animate-fade-in">
            <span className="text-4xl block mb-3">✍️</span>
            <p className="text-text-secondary/40 text-sm mb-1">还没有笔记</p>
            <p className="text-text-secondary/25 text-xs">点击右上角开始记录</p>
          </div>
        ) : (
          <div className="space-y-0 animate-fade-in">
            {normalNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => navigate(`/note/${note.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
