import { formatTime, getTagName, getTagColor } from '../services/storage.js'

// 从内容中提取第一张图片 src
function extractFirstImage(content) {
  if (!content) return null
  const match = content.match(/!\[([^\]]*)\]\((data:image\/[^)]+)\)/)
  return match ? match[2] : null
}

// 清理内容预览（去除图片markdown和base64）
function cleanPreview(content, maxLength = 100) {
  if (!content) return '暂无内容'
  // 移除所有图片 markdown ![...](...)
  let text = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
  // 移除文档链接 markdown [...](data:...)
  text = text.replace(/\[[^\]]*\]\(data:[^)]+\)/g, '')
  // 移除链接 markdown 但保留文字
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  // 清理多余换行
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  if (!text) return '[图片]'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export default function NoteCard({ note, onClick }) {
  const hasTitle = note.title && note.title.trim()
  const firstImage = extractFirstImage(note.content)
  const preview = cleanPreview(note.content)

  return (
    <div
      onClick={onClick}
      className="bg-dark-card rounded-2xl p-4 mb-3 cursor-pointer hover:bg-[#222222] transition-colors duration-200 animate-fade-in border border-dark-border/50"
    >
      {/* 有图片时显示缩略图布局 */}
      {firstImage ? (
        <div className="flex gap-3 mb-2">
          {/* 缩略图 */}
          <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-dark-border/30">
            <img 
              src={firstImage} 
              alt="" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {/* 标题 + 内容 */}
          <div className="flex-1 min-w-0">
            {hasTitle && (
              <h3 className="text-text-primary font-semibold text-sm mb-1 line-clamp-1">
                {note.title}
              </h3>
            )}
            <p className={`text-text-secondary text-xs leading-relaxed line-clamp-2 ${!hasTitle ? 'mt-0' : ''}`}>
              {preview}
            </p>
          </div>
        </div>
      ) : (
        /* 无图片时保持原有布局 */
        <>
          {hasTitle && (
            <h3 className="text-text-primary font-semibold text-base mb-1.5 line-clamp-1">
              {note.title}
            </h3>
          )}
          <p className={`text-text-secondary text-sm leading-relaxed line-clamp-2 mb-3 ${!hasTitle ? 'mt-0' : ''}`}>
            {preview}
          </p>
        </>
      )}

      {/* 标签（有图片时紧凑显示） */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {note.tags.slice(0, 3).map((tagId) => (
            <span
              key={tagId}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: getTagColor(tagId) + '20',
                color: getTagColor(tagId),
              }}
            >
              {getTagName(tagId)}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-text-secondary">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* 时间 */}
      <div className="flex items-center justify-between">
        <span className="text-text-secondary/60 text-xs">
          {formatTime(note.updatedAt || note.createdAt)}
        </span>
      </div>
    </div>
  )
}
