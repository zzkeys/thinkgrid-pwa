export default function TagChip({ tag, count, onDelete, small = false }) {
  const sizeClasses = small
    ? 'px-2 py-0.5 text-[11px]'
    : 'px-3 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: tag.color + '20',
        color: tag.color,
        border: `1px solid ${tag.color}30`,
      }}
    >
      <span>{tag.name}</span>
      {count !== undefined && (
        <span className="opacity-60">({count})</span>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </span>
  )
}
