import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveDiary, WEATHER_OPTIONS, MOOD_OPTIONS, getTodayDiary } from '../services/storage.js'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export default function DiaryEdit() {
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // 日期状态
  const [diaryDate, setDiaryDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  // 内容
  const [content, setContent] = useState('')

  // 天气和心情
  const [weather, setWeather] = useState(null)
  const [mood, setMood] = useState(null)
  const [showWeatherPicker, setShowWeatherPicker] = useState(false)
  const [showMoodPicker, setShowMoodPicker] = useState(false)

  // 图片
  const [images, setImages] = useState([])

  // 发布中
  const [publishing, setPublishing] = useState(false)

  // 字数统计
  const charCount = content.replace(/\s/g, '').length

  useEffect(() => {
    // 检查今天是否已有日记
    const todayDiary = getTodayDiary()
    if (todayDiary) {
      setContent(todayDiary.content || '')
      if (todayDiary.weather) setWeather(todayDiary.weather)
      if (todayDiary.mood) setMood(todayDiary.mood)
      if (todayDiary.images) setImages(todayDiary.images || [])
    }
  }, [])

  // 格式化日期显示
  const formatDateDisplay = (date) => {
    return `${date.getDate()} ${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`
  }

  // 处理相机拍照
  const handleCamera = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      })
      if (photo.base64String) {
        const imgDataUrl = `data:image/jpeg;base64,${photo.base64String}`
        setImages((prev) => [...prev, { src: imgDataUrl, alt: '照片' }])
      }
    } catch (e) {
      console.log('Camera cancelled')
    }
  }

  // 处理相册选择
  const handleAlbum = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      })
      if (photo.base64String) {
        const imgDataUrl = `data:image/jpeg;base64,${photo.base64String}`
        setImages((prev) => [...prev, { src: imgDataUrl, alt: '照片' }])
      }
    } catch (e) {
      console.log('Album selection cancelled')
    }
  }

  // 处理文件选择（非Capacitor环境降级）
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target.result
      setImages((prev) => [...prev, { src: result, alt: file.name.split('.')[0] }])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 发布日记
  const handlePublish = () => {
    if (!content.trim() && images.length === 0) return
    setPublishing(true)

    try {
      const diaryData = {
        title: '', // 日记没有标题
        content: content.trim(),
        weather: weather?.id || null,
        mood: mood?.id || null,
        images: images.map((img) => ({ src: img.src, alt: img.alt })),
      }

      saveDiary(diaryData)

      setTimeout(() => {
        navigate('/')
      }, 300)
    } catch (e) {
      console.error('Save diary failed:', e)
      setPublishing(false)
    }
  }

  // 删除图片
  const handleDeleteImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // 切换月份
  const changeMonth = (delta) => {
    const newDate = new Date(diaryDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setDiaryDate(newDate)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-dark-border/30">
        <button onClick={() => navigate(-1)} className="text-text-secondary text-lg">
          ✕
        </button>
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold text-text-primary">{formatDateDisplay(diaryDate)}</span>
          <button onClick={() => setShowDatePicker(!showDatePicker)} className="ml-1 text-text-secondary text-sm">
            ▾
          </button>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing || (!content.trim() && images.length === 0)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            publishing || (!content.trim() && images.length === 0)
              ? 'bg-[#1A1A1A] text-text-secondary/30'
              : 'bg-coral-gradient text-white shadow-lg shadow-coral-light/20 active:scale-95'
          }`}
        >
          {publishing ? '...' : '发布'}
        </button>
      </div>

      {/* 日期选择器 */}
      {showDatePicker && (
        <div className="bg-[#141414] px-5 py-3 border-b border-dark-border/30 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => changeMonth(-1)} className="text-text-secondary px-3">◀</button>
            <span className="text-sm text-text-primary font-medium">
              {diaryDate.getFullYear()}年{diaryDate.getMonth() + 1}月
            </span>
            <button onClick={() => changeMonth(1)} className="text-text-secondary px-3">▶</button>
          </div>
          {/* 简化的日历网格 */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="text-text-secondary/40 py-1">{d}</div>
            ))}
            {Array.from({ length: getDaysInMonth(diaryDate) }, (_, i) => {
              const day = i + 1
              const isSelected = day === diaryDate.getDate()
              return (
                <button
                  key={day}
                  onClick={() => {
                    const newDate = new Date(diaryDate)
                    newDate.setDate(day)
                    setDiaryDate(newDate)
                    setShowDatePicker(false)
                  }}
                  className={`py-1 rounded-full transition-all ${
                    isSelected
                      ? 'bg-coral-gradient text-white'
                      : 'text-text-secondary hover:bg-[#252525]'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 文本输入区域 */}
      <div className="flex-1 px-5 pt-4 pb-2 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="我想说..."
          className="w-full h-48 bg-transparent text-text-primary placeholder-text-secondary/30 text-base leading-relaxed resize-none outline-none"
        />

        {/* 已插入的图片预览 */}
        {images.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {images.map((img, index) => (
              <div key={index} className="relative flex-shrink-0 group">
                <img src={img.src} alt={img.alt} className="w-24 h-24 object-cover rounded-xl" />
                <button
                  onClick={() => handleDeleteImage(index)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-80 hover:opacity-100 shadow-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="border-t border-dark-border/30 px-6 py-4">
        {/* 字数统计 */}
        <div className="flex justify-end mb-3">
          <span className="text-xs text-text-secondary/40">{charCount > 0 ? `共${charCount}字` : ''}</span>
        </div>

        {/* 工具图标 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* 相机 */}
            <button
              onClick={handleCamera}
              className="flex flex-col items-center gap-1 group"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                false ? 'bg-coral-light/20' : 'bg-[#1A1A1A] group-hover:bg-[#252525]'
              }`}>
                📷
              </span>
              <span className="text-[10px] text-text-secondary/50">相机</span>
            </button>

            {/* 相册 */}
            <button
              onClick={() => {
                if (Capacitor.isNativePlatform()) {
                  handleAlbum()
                } else {
                  fileInputRef.current?.click()
                }
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[#1A1A1A] group-hover:bg-[#252525] transition-all">
                🖼️
              </span>
              <span className="text-[10px] text-text-secondary/50">相册</span>
            </button>

            {/* 天气 */}
            <div className="relative">
              <button
                onClick={() => { setShowWeatherPicker(!showWeatherPicker); setShowMoodPicker(false) }}
                className={`flex flex-col items-center gap-1 ${weather ? '' : ''}`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                  weather ? 'bg-blue-500/20' : 'bg-[#1A1A1A] hover:bg-[#252525]'
                }`}>
                  {weather ? WEATHER_OPTIONS.find(w => w.id === weather)?.icon : '☁️'}
                </span>
                <span className={`text-[10px] ${weather ? 'text-blue-400' : 'text-text-secondary/50'}`}>
                  {weather ? WEATHER_OPTIONS.find(w => w.id === weather)?.label : '天气'}
                </span>
              </button>

              {showWeatherPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1E1E1E] rounded-2xl p-3 border border-dark-border/50 shadow-xl z-50 animate-fade-in">
                  <div className="grid grid-cols-4 gap-2">
                    {WEATHER_OPTIONS.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => { setWeather(w.id); setShowWeatherPicker(false) }}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                          weather === w.id ? 'bg-blue-500/20 ring-1 ring-blue-400/30' : 'hover:bg-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-lg">{w.icon}</span>
                        <span className="text-[9px] text-text-secondary mt-0.5">{w.label}</span>
                      </button>
                    ))}
                  </div>
                  {weather && (
                    <button
                      onClick={() => setWeather(null)}
                      className="w-full mt-2 text-[10px] text-red-400/60 hover:text-red-400 text-center"
                    >
                      清除
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 心情 */}
            <div className="relative">
              <button
                onClick={() => { setShowMoodPicker(!showMoodPicker); setShowWeatherPicker(false) }}
                className="flex flex-col items-center gap-1"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                  mood ? '' : 'bg-[#1A1A1A] hover:bg-[#252525]'
                }`}
                style={mood ? { backgroundColor: MOOD_OPTIONS.find(m => m.id === mood)?.color + '20' } : {}}
                >
                  {mood ? MOOD_OPTIONS.find(m => m.id === mood)?.emoji : '💛'}
                </span>
                <span className={`text-[10px] ${mood ? 'opacity-90' : 'text-text-secondary/50'}`}
                  style={mood ? { color: MOOD_OPTIONS.find(m => m.id === mood)?.color } : {}}
                >
                  {mood ? MOOD_OPTIONS.find(m => m.id === mood)?.label : '心情'}
                </span>
              </button>

              {showMoodPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1E1E1E] rounded-2xl p-3 border border-dark-border/50 shadow-xl z-50 animate-fade-in">
                  <div className="grid grid-cols-4 gap-2">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setMood(m.id); setShowMoodPicker(false) }}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                          mood === m.id ? 'ring-1' : 'hover:bg-[#2A2A2A]'
                        }`}
                        style={mood === m.id ? { backgroundColor: m.color + '20', borderColor: m.color + '60' } : {}}
                      >
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-[9px] mt-0.5" style={{ color: m.color }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                  {mood && (
                    <button
                      onClick={() => setMood(null)}
                      className="w-full mt-2 text-[10px] text-red-400/60 hover:text-red-400 text-center"
                    >
                      清除
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

// 辅助函数：获取某月天数
function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}
