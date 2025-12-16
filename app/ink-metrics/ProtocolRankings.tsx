'use client'

import { useMemo, useState } from 'react'
import ProtocolColumnsToggle from './ProtocolColumnsToggle'
import { ADVANCED_COLUMNS, DEFAULT_COLUMNS, type ColumnKey } from './columns'
import { columnLabels, columnRenderers, type ProtocolRow } from './columnRenderers'

export default function ProtocolRankings({ rows }: { rows: ProtocolRow[] }) {
  const [advanced, setAdvanced] = useState(false)

  const cols: ColumnKey[] = useMemo(() => {
    return advanced ? ADVANCED_COLUMNS : DEFAULT_COLUMNS
  }, [advanced])

  return (
    <section className="pr-wrap">
      <div className="pr-card">
        <div className="pr-title">Protocol Rankings</div>

        <ProtocolColumnsToggle advanced={advanced} onToggle={setAdvanced} />

        <div className="pr-table-wrap">
          <table className="pr-table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th
                    key={c}
                    className={
                      c === 'name' || c === 'category' ? 'pr-left' : 'pr-right'
                    }
                  >
                    {columnLabels[c]}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r?.name ?? 'row'}-${i}`}>
                  {cols.map((c) => (
                    <td
                      key={c}
                      className={
                        c === 'name' || c === 'category'
                          ? 'pr-left'
                          : 'pr-right'
                      }
                    >
                      {columnRenderers[c](r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
