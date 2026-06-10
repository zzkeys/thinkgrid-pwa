import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import NoteEdit from './pages/NoteEdit.jsx'
import NoteDetail from './pages/NoteDetail.jsx'
import Tags from './pages/Tags.jsx'
import Profile from './pages/Profile.jsx'
import AISelect from './pages/AISelect.jsx'
import AIResult from './pages/AIResult.jsx'
import BottomNav from './components/BottomNav.jsx'

function App() {
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
    </div>
  )
}

export default App
