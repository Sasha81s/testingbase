'use client'

import { useState } from 'react'

type DetailRow = { label: string; valueText: string }
type MetricRow = {
  id: string
  label: string
  valueText: string
  hasDropdown?: boolean
  details?: DetailRow[]
}

export default function KeyMetrics({ rows }: { rows: MetricRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section className="km-wrap">
      <div className="km-card">
        <div className="km-title">Key Metrics</div>

        <div className="km-list">
          {rows.map((r) => {
            const isOpen = openId === r.id
            return (
              <div key={r.id} className="km-block">
                <div
                  className={'km-row' + (r.hasDropdown ? ' km-click' : '')}
                  onClick={() => {
                    if (!r.hasDropdown) return
                    setOpenId(isOpen ? null : r.id)
                  }}
                >
                  <div className="km-left">
                    <span className="km-label">{r.label}</span>
                    {r.hasDropdown ? (
                      <span className="km-caret">{isOpen ? '▲' : '▼'}</span>
                    ) : null}
                  </div>
                  <div className="km-right">{r.valueText}</div>
                </div>

                {isOpen && r.details?.length ? (
                  <div className="km-details">
                    {r.details.map((d, i) => (
                      <div key={i} className="km-detail-row">
                        <div className="km-detail-left">{d.label}</div>
                        <div className="km-detail-right">{d.valueText}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
