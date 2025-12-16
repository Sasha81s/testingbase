export type ColumnKey =
  | 'name'
  | 'category'
  | 'tvl'
  | 'tvl_1d_pct'
  | 'tvl_7d_pct'
  | 'tvl_1m_pct'
  | 'fees_24h'
 // | 'revenue_24h'
  | 'fees_7d'
  //| 'revenue_7d'
  | 'fees_30d'
//  | 'revenue_30d'
  | 'fees_1y'
 // | 'revenue_1y'
 // | 'cumulative_revenue'
  | 'spot_volume_24h'
  | 'spot_volume_7d'
  | 'spot_change_7d'
  | 'spot_cumulative_volume'

export const DEFAULT_COLUMNS: ColumnKey[] = [
  'name',
  'category',
  'tvl',
  'tvl_1d_pct',
  'tvl_7d_pct',
  'tvl_1m_pct',
  'fees_24h',
 // 'revenue_24h',
  'spot_volume_24h',
]

export const ADVANCED_COLUMNS: ColumnKey[] = [
  ...DEFAULT_COLUMNS,
  'fees_7d',
 // 'revenue_7d',
  'fees_30d',
// 'revenue_30d',
  'fees_1y',
 // 'revenue_1y',
 // 'cumulative_revenue',
  'spot_volume_7d',
  'spot_change_7d',
  'spot_cumulative_volume',
]
