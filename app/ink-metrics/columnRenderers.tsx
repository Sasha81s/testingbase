import type { ColumnKey } from './columns'

export type ProtocolRow = {
  name?: string | null
  category?: string | null
  tvl?: number | null
  change_1d_pct?: number | null
  change_7d_pct?: number | null
  change_1m_pct?: number | null

  fees_24h?: number | null
 // revenue_24h?: number | null
  fees_7d?: number | null
 // revenue_7d?: number | null
  fees_30d?: number | null
 // revenue_30d?: number | null
  fees_1y?: number | null
 // revenue_1y?: number | null
 // cumulative_revenue?: number | null

  spot_volume_24h?: number | null
  spot_volume_7d?: number | null
  spot_change_7d?: number | null
  spot_cumulative_volume?: number | null
}

function fmtUsdShort(n: number | null | undefined) {
  if (typeof n !== 'number') return ''
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  const f2 = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })

  if (abs >= 1e12) return `${sign}$${f2(abs / 1e12)}t`
  if (abs >= 1e9) return `${sign}$${f2(abs / 1e9)}b`
  if (abs >= 1e6) return `${sign}$${f2(abs / 1e6)}m`
  if (abs >= 1e3) return `${sign}$${f2(abs / 1e3)}k`
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number | null | undefined) {
  if (typeof n !== 'number') return ''
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

export const columnLabels: Record<ColumnKey, string> = {
  name: 'Name',
  category: 'Category',
  tvl: 'TVL',
  tvl_1d_pct: 'TVL 1d %',
  tvl_7d_pct: 'TVL 7d %',
  tvl_1m_pct: 'TVL 1m %',

  fees_24h: 'Fees 24h',
 // revenue_24h: 'Revenue 24h',
  fees_7d: 'Fees 7d',
 // revenue_7d: 'Revenue 7d',
  fees_30d: 'Fees 30d',
//  revenue_30d: 'Revenue 30d',
  fees_1y: 'Fees 1y',
 // revenue_1y: 'Revenue 1y',
 // cumulative_revenue: 'Cumulative Revenue',

  spot_volume_24h: 'Spot Volume 24h',
  spot_volume_7d: 'Spot Volume 7d',
  spot_change_7d: 'Spot Change 7d',
  spot_cumulative_volume: 'Spot Cumulative Volume',
}

export const columnRenderers: Record<ColumnKey, (r: ProtocolRow) => string> = {
  name: (r) => String(r?.name ?? ''),
  category: (r) => String(r?.category ?? ''),
  tvl: (r) => fmtUsdShort(r?.tvl ?? null),

  tvl_1d_pct: (r) => fmtPct(r?.change_1d_pct ?? null),
  tvl_7d_pct: (r) => fmtPct(r?.change_7d_pct ?? null),
  tvl_1m_pct: (r) => fmtPct(r?.change_1m_pct ?? null),

  fees_24h: (r) => fmtUsdShort(r?.fees_24h ?? null),
 // revenue_24h: (r) => fmtUsdShort(r?.revenue_24h ?? null),
  fees_7d: (r) => fmtUsdShort(r?.fees_7d ?? null),
//  revenue_7d: (r) => fmtUsdShort(r?.revenue_7d ?? null),
  fees_30d: (r) => fmtUsdShort(r?.fees_30d ?? null),
 // revenue_30d: (r) => fmtUsdShort(r?.revenue_30d ?? null),
  fees_1y: (r) => fmtUsdShort(r?.fees_1y ?? null),
//  revenue_1y: (r) => fmtUsdShort(r?.revenue_1y ?? null),
//  cumulative_revenue: (r) => fmtUsdShort(r?.cumulative_revenue ?? null),

  spot_volume_24h: (r) => fmtUsdShort(r?.spot_volume_24h ?? null),
  spot_volume_7d: (r) => fmtUsdShort(r?.spot_volume_7d ?? null),
  spot_change_7d: (r) => fmtPct(r?.spot_change_7d ?? null),
  spot_cumulative_volume: (r) => fmtUsdShort(r?.spot_cumulative_volume ?? null),
}
