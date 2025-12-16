import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const toNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function GET() {
  const chain = 'Ink'
  const chainSlug = 'ink'

  const chainsUrl = 'https://api.llama.fi/v2/chains'
  const histUrl = `https://api.llama.fi/v2/historicalChainTvl/${chainSlug}`

  try {
    const [chainsRes, histRes] = await Promise.all([
      fetch(chainsUrl, { cache: 'no-store' }),
      fetch(histUrl, { cache: 'no-store' }),
    ])

    const chainsJson: any[] = chainsRes.ok ? await chainsRes.json() : []
    const inkRow =
      chainsJson.find((c) => String(c?.name || '').toLowerCase() === chainSlug) ||
      chainsJson.find((c) => String(c?.chain || '').toLowerCase() === chainSlug) ||
      null

    const tvl = toNum(inkRow?.tvl)

    const tvlHist: Array<{ date: number; tvl: number }> = histRes.ok ? await histRes.json() : []
    const last = tvlHist.length ? tvlHist[tvlHist.length - 1] : null
    const prev = tvlHist.length > 1 ? tvlHist[tvlHist.length - 2] : null

    const lastTvl = toNum(last?.tvl)
    const prevTvl = toNum(prev?.tvl)

    const tvl_change_24h_pct =
      typeof lastTvl === 'number' && typeof prevTvl === 'number' && prevTvl > 0
        ? ((lastTvl - prevTvl) / prevTvl) * 100
        : null

    return NextResponse.json({
      ok: true,
      chain,
      tvl,
      tvl_change_24h_pct,
      source: { chainsUrl, histUrl },
      ts: Date.now(),
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, chain, tvl: null, tvl_change_24h_pct: null, error: e?.message || String(e) },
      { status: 500 }
    )
  }
}
