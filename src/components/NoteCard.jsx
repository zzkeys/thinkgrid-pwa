import { formatTime, getContentPreview, getTagName, getTagColor } from '../services/storage.js'

export default function NoteCard({ note, onClick }) {
  const hasTitle = note.title && note.title.trim()
  const preview = getContentPreview(note.content)

  return (
    <div
      onClick={onClick}
      className="bg-dark-card rounded-2xl p-4 mb-3 cursor-pointer hover:bg-[#222222] transition-colors duration-200 animate-fade-in border border-dark-border/50"
    >
      {/* 标题 - 只有标题不为空时才显示 */}
      {hasTitle && (
        <h3 className="text-text-primary font-semibold text-base mb-1.5 line-clamp-1">
          {note.title}
        </h3>
      )}

      {/* 内容预览 */}
      <p className={`text-text-secondary text-sm leading-relaxed line-clamp-2 mb-3 ${!hasTitle ? 'mt-0' : ''}`}>
        {preview}
      </p>

      {/* 标签 */}
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
