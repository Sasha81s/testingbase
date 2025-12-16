import { headers } from "next/headers";
import KeyMetrics from "./KeyMetrics"
import ProtocolRankings from './ink-metrics/ProtocolRankings'
import type { ColumnKey } from './ink-metrics/columns'
import ProtocolColumnsToggle from './ink-metrics/ProtocolColumnsToggle'
import { columnLabels, columnRenderers } from './ink-metrics/columnRenderers'

export const dynamic = "force-dynamic";

async function getJson(path: string) {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
let proto = h.get("x-forwarded-proto") || "http";
if (host.startsWith("localhost")) proto = "http";
  const url = `${proto}://${host}${path}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const ct = res.headers.get("content-type") || "";

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `http ${res.status}`, body: text.slice(0, 200), url };
    }

    if (!ct.includes("application/json")) {
      const text = await res.text();
      return { ok: false, error: "not json", body: text.slice(0, 200), url };
    }

    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e), url };
  }
}



function fmtPct(n: number) {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

export default async function Page() {
const [inflows, app, chain, perps, bridged, dexs, stable, tvl, protocols] = await Promise.all([
  getJson("/api/ink-inflows"),
  getJson("/api/ink-app-fees-rev"),
  getJson("/api/ink-chain-fees"),
  getJson("/api/ink-perps"),
  getJson("/api/ink-bridged-tvl"),
  getJson("/api/ink-dexs"),
  getJson("/api/ink-stablecoins"),
  getJson('/api/ink-tvl'),
  getJson('/api/ink-protocol-rankings'),
]);


const inflow = inflows?.depositUSD;


  const appFees = app?.app_fees_24h ?? app?.chain_fees_24h;
  const appRev = app?.app_revenue_24h ?? app?.chain_revenue_24h;

  const chainFees = chain?.chain_fees_24h;
  const chainRev = chain?.chain_revenue_24h;
  const perpsVol = perps?.perps_volume_24h;
  const bt = bridged?.bridged_tvl;
  const dv = dexs?.dexs_volume_24h;
  const sm = stable?.stablecoins_mcap;


const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

const fmtShort = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}t`
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}b`
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}m`
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}k`
  return fmtMoney(n)
}

const change7d = stable?.change_7d_pct
const usdtDom = stable?.usdt_dominance_pct

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

const rows = [
  {
  id: "tvl",
  label: "Total Value Locked in DeFi",
  valueText: typeof tvl?.tvl === "number" ? fmtShort(tvl.tvl) : "—",
  hasDropdown: true,
  details: [
    {
      label: "Change (24h)",
      valueText: typeof tvl?.tvl_change_24h_pct === "number" ? pct(tvl.tvl_change_24h_pct) : "—",
    },
  ],
},
  {
    id: "stable",
    label: "Stablecoins Mcap",
    valueText: typeof sm === "number" ? fmtShort(sm) : "—",
    hasDropdown: true,
    details: [
      { label: "Change (7d)", valueText: typeof change7d === "number" ? pct(change7d) : "—" },
      { label: "USDT Dominance", valueText: typeof usdtDom === "number" ? `${usdtDom.toFixed(2)}%` : "—" },
    ],
  },
  {
    id: "chainFees",
    label: "Chain Fees (24h)",
    valueText: typeof chainFees === "number" ? fmtMoney(chainFees) : "—",
  },
  {
    id: "chainRev",
    label: "Chain Revenue (24h)",
    valueText: typeof chainRev === "number" ? fmtMoney(chainRev) : "—",
  },
  {
    id: "chainRevDup",
    label: "Chain Rev (24h)",
    valueText: typeof chainRev === "number" ? fmtMoney(chainRev) : "—",
  },
  {
    id: "appRev",
    label: "App Revenue (24h)",
    valueText: typeof appRev === "number" ? fmtMoney(appRev) : "—",
  },
  {
    id: "appFees",
    label: "App Fees (24h)",
    valueText: typeof appFees === "number" ? fmtMoney(appFees) : "—",
  },
{
  id: "dexs",
  label: "DEXs Volume. (24h)",
  valueText: typeof dexs?.dexs_volume_24h === "number" ? fmtShort(dexs.dexs_volume_24h) : "—",
  hasDropdown: true,
  details: [
    {
      label: "Volume (7d)",
      valueText: typeof dexs?.volume_7d === "number" ? fmtShort(dexs.volume_7d) : "—",
    },
    {
      label: "Weekly change",
      valueText: typeof dexs?.weekly_change_pct === "number" ? pct(dexs.weekly_change_pct) : "—",
    },
  ],
},
{
  id: "perps",
  label: "Perps Volume (24h)",
  valueText: typeof perps?.perps_volume_24h === "number" ? fmtShort(perps.perps_volume_24h) : "—",
  hasDropdown: true,
  details: [
    {
      label: "Perps Volume (7d)",
      valueText: typeof perps?.volume_7d === "number" ? fmtShort(perps.volume_7d) : "—",
    },
    {
      label: "Weekly Change",
      valueText: typeof perps?.weekly_change_pct === "number" ? pct(perps.weekly_change_pct) : "—",
    },
  ],
},
  {
    id: "inflows",
    label: "Inflows (24h)",
    valueText: typeof inflow === "number" ? fmtMoney(inflow) : "—",
  },
  {
    id: "bridged",
    label: "Bridged TVL",
    valueText: typeof bt === "number" ? fmtShort(bt) : "—",
    hasDropdown: true,
  },
]


return (
  <>
    <KeyMetrics rows={rows} />
<ProtocolRankings rows={Array.isArray(protocols?.rows) ? protocols.rows : []} />
  </>
)
}
