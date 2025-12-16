import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CHAIN = 'Ink'
const CHAIN_SLUG = 'ink'
const norm = (s: any) => String(s ?? '').trim().toLowerCase()

const toNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const pct = (now: number | null, prev: number | null) => {
  if (now === null || prev === null || prev === 0) return null
  return ((now - prev) / prev) * 100
}

const pctSafe = (now: number | null, prev: number | null) => {
  const p = pct(now, prev)
  if (p === null) return null
  if (prev !== null && prev < 1000) return null
  if (Math.abs(p) > 100000) return null
  return p
}

const pickKeyCI = (obj: any, want: string) => {
  if (!obj || typeof obj !== 'object') return null
  const w = norm(want)
  const k = Object.keys(obj).find((x) => norm(x) === w)
  return k ? obj[k] : null
}


const tvlPointVal = (p: any) =>
  toNum(p?.totalLiquidityUSD ?? p?.tvl ?? p?.totalLiquidity ?? p?.value ?? p?.usd) 

const tvlSeriesFromChain = (
  detail: any,
  chainName: string,
  chainSlug: string
): { date: number; v: number }[] => {
  const chainTvls = detail?.chainTvls
  const chainObj = pickKeyCI(chainTvls, chainName) ?? pickKeyCI(chainTvls, chainSlug) ?? null

  const arr = chainObj?.tvl
  if (!Array.isArray(arr)) return []

  return arr
    .map((x: any) => {
      const date = toNum(x?.date)
      const v = tvlPointVal(x)
      return { date, v }
    })
    .filter((x: any): x is { date: number; v: number } => x.date !== null && x.v !== null)
}


const tvlAtDaysAgo = (series: { date: number; v: number }[], daysAgo: number) => {
  if (!series.length) return null
  const last = series[series.length - 1]
  const target = last.date - daysAgo * 86400

  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].date <= target) return series[i].v
  }
  return null
}


async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const text = await res.text()

    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {}

    return { ok: res.ok, status: res.status, url, json, text }
  } catch (e: any) {
    return { ok: false, status: 0, url, json: null, text: null, error: e?.message || String(e) }
  }
}



function getAny(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null) return v
  }
  return null
}

function pickBreakdown(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k]
    if (v && typeof v === 'object') return v
  }
  return null
}

function pickChainSeries(breakdown: any, chain: string, chainSlug: string) {
  if (!breakdown || typeof breakdown !== 'object') return null

  const direct =
    breakdown?.[chain] ??
    breakdown?.[chainSlug] ??
    breakdown?.[String(chain).toLowerCase()] ??
    breakdown?.[String(chainSlug).toLowerCase()] ??
    null

  if (direct) return direct

  // fallback: case-insensitive key match
  const keys = Object.keys(breakdown)
  const hit = keys.find((k) => String(k).toLowerCase() === String(chain).toLowerCase())
  if (hit) return breakdown[hit]

  const hit2 = keys.find((k) => String(k).toLowerCase() === String(chainSlug).toLowerCase())
  if (hit2) return breakdown[hit2]

  return null
}

function seriesToVals(series: any): number[] {
  if (!Array.isArray(series)) return []
  const out: number[] = []

  for (const row of series) {
    // can be [ts, value] or { date, value } or { timestamp, total } etc
    if (Array.isArray(row)) {
      const v = toNum(row[row.length - 1])
      if (v !== null) out.push(v)
      continue
    }
    const v =
      toNum(row?.value) ??
      toNum(row?.total) ??
      toNum(row?.tvl) ??
      toNum(row?.fees) ??
      toNum(row?.revenue) ??
      toNum(row?.volume) ??
      toNum(row?.[1]) ??
      null

    if (v !== null) out.push(v)
  }

  return out
}

function sumLast(vals: number[], n: number) {
  if (!vals.length) return null
  const start = Math.max(0, vals.length - n)
  let s = 0
  for (let i = start; i < vals.length; i++) s += vals[i]
  return s
}

function lastVal(vals: number[]) {
  if (!vals.length) return null
  return vals[vals.length - 1]
}

function weeklyChangeFromDaily(vals: number[]) {
  // compare last 7 days sum vs previous 7 days sum
  if (vals.length < 14) return null
  const last7 = vals.slice(vals.length - 7)
  const prev7 = vals.slice(vals.length - 14, vals.length - 7)
  const a = last7.reduce((x, y) => x + y, 0)
  const b = prev7.reduce((x, y) => x + y, 0)
  return pct(a, b)
}

export async function GET(req: Request) {
  const protocolsUrl = 'https://api.llama.fi/protocols'

  const u = new URL(req.url)
const debugSlug = u.searchParams.get('debug')

if (debugSlug) {
const feesUrl = `https://api.llama.fi/summary/fees/${encodeURIComponent(debugSlug)}`

const revenueUrls = [
  `https://api.llama.fi/summary/revenue/${encodeURIComponent(debugSlug)}`,
  `https://api.llama.fi/summary/fees/${encodeURIComponent(debugSlug)}?dataType=revenue`,
  `https://api.llama.fi/summary/fees/${encodeURIComponent(debugSlug)}?dataType=protocolRevenue`,
  `https://api.llama.fi/summary/fees/${encodeURIComponent(debugSlug)}?dataType=ProtocolRevenue`,
]

const feesRes = await fetchJson(feesUrl)
const revenueResList = await Promise.all(revenueUrls.map((u) => fetchJson(u)))

return NextResponse.json({
  ok: true,
  debug: debugSlug,

  fees: {
    url: feesRes.url,
    ok: feesRes.ok,
    status: feesRes.status,
    text: feesRes.text,
    json: feesRes.json,
  },

  revenue: revenueResList.map((r) => ({
    url: r.url,
    ok: r.ok,
    status: r.status,
    text: r.text,
    json: r.json,
  })),
})
}

try {
    const res = await fetchJson(protocolsUrl)
    if (!res.ok || !Array.isArray(res.json)) {
      return NextResponse.json(
        { ok: false, chain: CHAIN, error: { url: protocolsUrl, status: res.status } },
        { status: 500 }
      )
    }

    const all: any[] = res.json

    // ink protocols only, top 25 by ink tvl
const hasInk = (p: any) => {
  const chains = Array.isArray(p?.chains) ? p.chains : []
  const hasChain =
    chains.some((c: any) => String(c).toLowerCase() === CHAIN_SLUG) ||
    chains.some((c: any) => String(c).toLowerCase() === CHAIN.toLowerCase())

  const tvls = p?.chainTvls
  const hasTvlKey =
    (tvls && typeof tvls === 'object' && (tvls.Ink != null || tvls.ink != null)) ||
    (tvls &&
      typeof tvls === 'object' &&
      Object.keys(tvls).some((k) => String(k).toLowerCase() === CHAIN_SLUG)) ||
    (tvls &&
      typeof tvls === 'object' &&
      Object.keys(tvls).some((k) => String(k).toLowerCase() === CHAIN.toLowerCase()))

  return hasChain || hasTvlKey
}

const baseRows = all
  .filter(hasInk)
  .map((p) => {
    const ink =
      p?.chainTvls?.Ink ??
      p?.chainTvls?.ink ??
      pickKeyCI(p?.chainTvls, CHAIN) ??
      pickKeyCI(p?.chainTvls, CHAIN_SLUG) ??
      null

    const inkTvl = toNum(ink?.tvl) ?? toNum(ink)
    const inkPrev1d = toNum(ink?.tvlPrevDay)
    const inkPrev7d = toNum(ink?.tvlPrevWeek)
    const inkPrev1m = toNum(ink?.tvlPrevMonth)

    const isInkOnly =
      Array.isArray(p?.chains) &&
      p.chains.length === 1 &&
      String(p.chains[0]).toLowerCase() === CHAIN_SLUG

    const tvl = inkTvl ?? (isInkOnly ? toNum(p?.tvl) : null)
    const prev1d = inkPrev1d ?? (isInkOnly ? toNum(p?.tvlPrevDay) : null)
    const prev7d = inkPrev7d ?? (isInkOnly ? toNum(p?.tvlPrevWeek) : null)
    const prev1m = inkPrev1m ?? (isInkOnly ? toNum(p?.tvlPrevMonth) : null)

    return {
      name: String(p?.name ?? p?.slug ?? ''),
      slug: String(p?.slug ?? ''),
      category: String(p?.category ?? ''),
      tvl,
      change_1d_pct: pctSafe(tvl, prev1d),
      change_7d_pct: pctSafe(tvl, prev7d),
      change_1m_pct: pctSafe(tvl, prev1m),
      isInkOnly,
    }
  })
  .filter((x) => x.name && x.slug)
  .sort((a, b) => ((b.tvl ?? 0) as number) - ((a.tvl ?? 0) as number))


// const overviewUrl = `https://api.llama.fi/overview/fees/${CHAIN}`
// const overviewRes = await fetchJson(overviewUrl)

// const overviewMap = new Map<string, any>()

// if (overviewRes.ok && overviewRes.json) {
//   const list =
//     overviewRes.json?.protocols ??
//     overviewRes.json?.data ??
//     overviewRes.json?.rows ??
//     overviewRes.json

//   if (Array.isArray(list)) {
//     for (const p of list) {
//       const key = String(p?.slug ?? p?.name ?? p?.protocol ?? '').toLowerCase()
//       if (key) overviewMap.set(key, p)
//     }
//   }
// }

 
    // enrich with fees/revenue + spot volume
    const enriched = await Promise.all(
      baseRows.map(async (r) => {
        const slug = r.slug


        let change_1d_pct = r.change_1d_pct
let change_7d_pct = r.change_7d_pct
let change_1m_pct = r.change_1m_pct

if (change_1d_pct === null || change_7d_pct === null || change_1m_pct === null) {
  const detailRes = await fetchJson(`https://api.llama.fi/protocol/${encodeURIComponent(slug)}`)
  if (detailRes.ok && detailRes.json) {
    const s = tvlSeriesFromChain(detailRes.json, CHAIN, CHAIN_SLUG)

    const now = s.length ? s[s.length - 1].v : null
    const d1 = tvlAtDaysAgo(s, 1)
    const d7 = tvlAtDaysAgo(s, 7)
    const d30 = tvlAtDaysAgo(s, 30)

    change_1d_pct = pctSafe(now, d1)
    change_7d_pct = pctSafe(now, d7)
    change_1m_pct = pctSafe(now, d30)
  }
}


        // fees + revenue
        const feesUrl = `https://api.llama.fi/summary/fees/${encodeURIComponent(slug)}`
const isDex =
  String(r.category || '').toLowerCase() === 'dexs' ||
  String(r.category || '').toLowerCase() === 'dex'

const dexsUrl = isDex
  ? `https://api.llama.fi/summary/dexs/${encodeURIComponent(slug)}`
  : null

const [feesRes, dexsRes] = await Promise.all([
  fetchJson(feesUrl),
  dexsUrl ? fetchJson(dexsUrl) : Promise.resolve({ ok: false, status: 0, url: '', json: null }),
])


let fees_24h: number | null = null
// let revenue_24h: number | null = null
let fees_7d: number | null = null
// let revenue_7d: number | null = null
let fees_30d: number | null = null
// let revenue_30d: number | null = null
let fees_1y: number | null = null
// let revenue_1y: number | null = null
// let cumulative_revenue: number | null = null


if (feesRes.ok && feesRes.json) {
  const j = feesRes.json

  const feesBreakdown = pickBreakdown(j, [
    'totalDataChartBreakdown',
    'totalFeesChartBreakdown',
    'feesChartBreakdown',
  ])

  const feesSeries = seriesToVals(pickChainSeries(feesBreakdown, CHAIN, CHAIN_SLUG))

  const chainFees24 = lastVal(feesSeries)
  const chainFees7 = sumLast(feesSeries, 7)
  const chainFees30 = sumLast(feesSeries, 30)
  const chainFees1y = sumLast(feesSeries, 365)

  const totalFees24 =
    toNum(getAny(j, ['total24h', 'fees24h', 'totalFees24h'])) ??
    toNum(getAny(j, ['total', 'fees'])) ??
    null

  const totalFees7 = toNum(getAny(j, ['total7d', 'fees7d', 'totalFees7d']))
  const totalFees30 = toNum(getAny(j, ['total30d', 'fees30d', 'totalFees30d']))
  const totalFees1y = toNum(getAny(j, ['total1y', 'fees1y', 'totalFees1y']))

  fees_24h = chainFees24 ?? (r.isInkOnly ? totalFees24 : null)
  fees_7d = chainFees7 ?? (r.isInkOnly ? totalFees7 : null)
  fees_30d = chainFees30 ?? (r.isInkOnly ? totalFees30 : null)
  fees_1y = chainFees1y ?? (r.isInkOnly ? totalFees1y : null)
}


// const ov = overviewMap.get(String(slug).toLowerCase()) || overviewMap.get(String(r.name).toLowerCase()) || null

// if (ov) {
//   const rev24 =
//     toNum(ov?.revenue24h) ??
//     toNum(ov?.revenue_24h) ??
//     toNum(ov?.revenue24hUsd) ??
//     toNum(ov?.total24hRevenue) ??
//     toNum(ov?.total24hRevenueUsd) ??
//     null

//   revenue_24h = rev24
// }


// if (revenue_24h === null && feesRes.ok && feesRes.json) {
//   const maybe =
//     toNum(feesRes.json?.revenue24h) ??
//     toNum(feesRes.json?.protocolRevenue24h) ??
//     toNum(feesRes.json?.total24hRevenue) ??
//     null

//   if (maybe !== null) revenue_24h = maybe
// }


        let spot_volume_24h: number | null = null
        let spot_volume_7d: number | null = null
        let spot_change_7d: number | null = null
        let spot_cumulative_volume: number | null = null

        if (dexsRes.ok && dexsRes.json) {
          const j = dexsRes.json

          const volBreakdown = pickBreakdown(j, [
            'totalDataChartBreakdown',
            'totalVolumeChartBreakdown',
            'volumeChartBreakdown',
          ])

          const volSeries = seriesToVals(pickChainSeries(volBreakdown, CHAIN, CHAIN_SLUG))

          const chainVol24 = lastVal(volSeries)
          const chainVol7 = sumLast(volSeries, 7)
          const chainVolAll = volSeries.length ? volSeries.reduce((a, b) => a + b, 0) : null
          const chainVolChange7 = weeklyChangeFromDaily(volSeries)

          // totals fallback only if ink-only
          const totalVol24 = toNum(getAny(j, ['total24h', 'totalVolume24h', 'volume24h']))
          const totalVol7 = toNum(getAny(j, ['total7d', 'totalVolume7d', 'volume7d']))
          const totalVolAll = toNum(getAny(j, ['totalAllTime', 'cumulativeVolume', 'totalVolumeAllTime']))
const totalVolChange7 = toNum(getAny(j, ['change_7d', 'weeklyChange', 'weekly_change_pct']))

spot_change_7d = chainVolChange7 ?? null
// only use total change if ink-only and it is not 0 (0 is usually a missing placeholder)
if (spot_change_7d === null && r.isInkOnly && typeof totalVolChange7 === 'number' && totalVolChange7 !== 0) {
  spot_change_7d = totalVolChange7
}

          spot_volume_24h = chainVol24 ?? (r.isInkOnly ? totalVol24 : null)
          spot_volume_7d = chainVol7 ?? (r.isInkOnly ? totalVol7 : null)
          spot_cumulative_volume = chainVolAll ?? (r.isInkOnly ? totalVolAll : null)
        }

return {
  name: r.name,
  slug: r.slug,
  category: r.category,
  tvl: r.tvl,

  change_1d_pct: change_1d_pct,
  change_7d_pct: change_7d_pct,
  change_1m_pct: change_1m_pct,

  fees_24h,
  // revenue_24h,
  fees_7d,
  // revenue_7d,
  fees_30d,
  // revenue_30d,
  fees_1y,
  // revenue_1y,
  // cumulative_revenue,

  spot_volume_24h,
  spot_volume_7d,
  spot_change_7d,
  spot_cumulative_volume,
}
      })
    )


return NextResponse.json({
  ok: true,
  chain: CHAIN,
  counts: {
    allProtocols: all.length,
    baseRows: baseRows.length,
    enriched: enriched.length,
  },
  rows: enriched,
  source: protocolsUrl,
  ts: Date.now(),
})

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, chain: CHAIN, error: { msg: e?.message || String(e) } },
      { status: 500 }
    )
  }
}
