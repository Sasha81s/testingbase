'use client'

export default function ProtocolColumnsToggle({
  advanced,
  onToggle,
}: {
  advanced: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <div className="pr-toggle-row">
      <button
        type="button"
        className={'pr-toggle-btn' + (advanced ? ' on' : '')}
        onClick={() => onToggle(!advanced)}
      >
        {advanced ? 'Advanced: on' : 'Advanced: off'}
      </button>
    </div>
  )
}
