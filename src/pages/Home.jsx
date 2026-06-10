import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NoteCard from '../components/NoteCard.jsx'
import AICard from '../components/AICard.jsx'
import { getNotes, initStats } from '../services/storage.js'

export default function Home() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    initStats()
    loadNotes()
  }, [refreshKey])

  function loadNotes() {
    const allNotes = getNotes()
    setNotes(allNotes)
  }

  const handleGenerate = () => {
    navigate('/ai/select')
  }

  const handleNoteClick = (note) => {
    navigate(`/note/${note.id}`)
  }

  const handleCreateNote = () => {
    navigate('/note/new')
  }

  return (
    <div className="min-h-full bg-dark-bg">
      {/* 顶部标题 */}
      <header className="px-5 pt-4 pb-4">
        <h1 className="text-text-primary text-2xl font-bold tracking-tight">
          思格 <span className="text-text-secondary/60 text-sm font-normal ml-1">Think Grid</span>
        </h1>
      </header>

      {/* AI 洞察入口 */}
      <div className="px-5">
        <AICard onGenerate={handleGenerate} />
      </div>

      {/* 笔记列表头部 */}
      <div className="px-5 flex items-center justify-between mb-3">
        <h2 className="text-text-primary font-semibold text-base">我的笔记</h2>
        <span className="text-text-secondary/60 text-xs">{notes.length} 篇</span>
      </div>

      {/* 笔记列表 */}
      <div className="px-5">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-4">📝</span>
            <p className="text-text-secondary/60 text-sm mb-6">还没有笔记，开始记录吧</p>
            <button
              onClick={handleCreateNote}
              className="bg-coral-gradient text-white px-6 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-coral-light/20 transition-all"
            >
              写第一篇笔记
            </button>
          </div>
        ) : (
          <>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
              />
            ))}
            {/* 底部占位 */}
            <div className="h-4" />
          </>
        )}
      </div>

      {/* 新建笔记悬浮按钮 */}
      {notes.length > 0 && (
        <button
          onClick={handleCreateNote}
          className="fixed right-5 bottom-24 w-14 h-14 rounded-full bg-coral-gradient text-white text-2xl shadow-lg shadow-coral-light/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        >
          +
        </button>
      )}
    </div>
  )
}
