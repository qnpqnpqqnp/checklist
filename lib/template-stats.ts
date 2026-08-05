import { supabase } from "./supabase";
import { TEMPLATES } from "./template-data";

// 시연용 기준값. 실제 사용 수가 여기에 더해집니다.
const BASE: Record<number, [number, number]> = {
  1: [2412, 86],
  2: [1187, 214],
  3: [5840, 163],
  4: [3260, 71],
  5: [894, 22],
  6: [762, 35],
  7: [1955, 58],
  8: [4103, 97],
};

type StatsMap = Record<number, { n: number; w: Record<string, number> }>;

const STATS_ROW_ID = "v1";

function currentWeekKey(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const w1 = new Date(t.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((t.getTime() - w1.getTime()) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7
    );
  return `${t.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export const WEEK_KEY = currentWeekKey();

function seedStats(): StatsMap {
  const stats: StatsMap = {};
  for (const [id, [n, w]] of Object.entries(BASE)) {
    stats[Number(id)] = { n, w: { [WEEK_KEY]: w } };
  }
  TEMPLATES.forEach((t) => {
    if (!stats[t.id]) stats[t.id] = { n: 0, w: {} };
  });
  return stats;
}

export async function loadStats(): Promise<StatsMap> {
  const { data, error } = await supabase
    .from("template_stats")
    .select("data")
    .eq("id", STATS_ROW_ID)
    .maybeSingle();
  if (error || !data || typeof data.data !== "object" || data.data === null) {
    return seedStats();
  }
  const stats = data.data as StatsMap;
  TEMPLATES.forEach((t) => {
    if (!stats[t.id]) stats[t.id] = { n: 0, w: {} };
    if (!stats[t.id].w) stats[t.id].w = {};
  });
  return stats;
}

export async function bumpStat(stats: StatsMap, id: number): Promise<StatsMap> {
  const next: StatsMap = { ...stats, [id]: { ...stats[id] } };
  next[id].n = (next[id].n || 0) + 1;
  next[id].w = { ...next[id].w, [WEEK_KEY]: (next[id].w?.[WEEK_KEY] || 0) + 1 };
  await supabase.from("template_stats").upsert({ id: STATS_ROW_ID, data: next });
  return next;
}

export const uses = (stats: StatsMap, id: number) => stats[id]?.n || 0;
export const wkUses = (stats: StatsMap, id: number) => stats[id]?.w?.[WEEK_KEY] || 0;
export const fmt = (n: number) => n.toLocaleString("ko-KR");

export function ranks(stats: StatsMap): Record<number, number> {
  const m: Record<number, number> = {};
  [...TEMPLATES]
    .sort((a, b) => uses(stats, b.id) - uses(stats, a.id))
    .forEach((t, i) => (m[t.id] = i + 1));
  return m;
}

export function hotId(stats: StatsMap): number | null {
  const sorted = [...TEMPLATES].sort(
    (a, b) => wkUses(stats, b.id) - wkUses(stats, a.id)
  );
  return wkUses(stats, sorted[0].id) > 0 ? sorted[0].id : null;
}

export type { StatsMap };
