"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, TEMPLATES, type Template } from "@/lib/template-data";
import {
  bumpStat,
  fmt,
  hotId,
  loadStats,
  ranks,
  seedStats,
  uses,
  type StatsMap,
} from "@/lib/template-stats";
import { useLists, type Period } from "../lists-context";
import { useToast } from "../toast-context";
import TemplateSheet from "./TemplateSheet";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#83838F" strokeWidth="2.2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function badgesFor(stats: StatsMap, id: number) {
  const r = ranks(stats)[id];
  const hot = hotId(stats);
  return (
    <>
      {r <= 3 && <span className="badge hot">🔥 인기 {r}위</span>}
      {id === hot && r > 1 && <span className="badge up">⚡ 급상승</span>}
    </>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const { createList } = useLists();
  const { showToast } = useToast();

  const [stats, setStats] = useState<StatsMap>(() => seedStats());
  const [curCat, setCurCat] = useState("전체");
  const [curQ, setCurQ] = useState("");
  const [sortBy, setSortBy] = useState<"hot" | "name">("hot");
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStats().then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => {
    const q = curQ.trim();
    let l = TEMPLATES.filter(
      (x) =>
        (curCat === "전체" || x.c === curCat) &&
        (!q || x.t.includes(q) || x.c.includes(q))
    );
    if (sortBy === "hot") {
      l = [...l].sort((a, b) => uses(stats, b.id) - uses(stats, a.id));
    }
    return l;
  }, [curCat, curQ, sortBy, stats]);

  async function handleUseTemplate(t: Template) {
    const periods: Period[] = t.w.map(([name, items]) => ({
      name,
      items: items.map((text) => ({ id: crypto.randomUUID(), text, done: false })),
    }));
    const created = await createList(t.t, t.e, t.pt, periods);
    if (!created) return;
    setStats(await bumpStat(stats, t.id));
    setOpenId(null);
    showToast("내 체크리스트에 담았어요");
    router.push("/");
  }

  const openTemplate = openId != null ? TEMPLATES.find((x) => x.id === openId) ?? null : null;

  return (
    <>
      <div className="top">
        <h1>템플릿</h1>
        <div className="act">
          <button
            className="mini"
            aria-pressed={sortBy === "hot"}
            onClick={() => setSortBy((s) => (s === "hot" ? "name" : "hot"))}
          >
            {sortBy === "hot" ? "인기순" : "기본순"}
          </button>
          <span className="mini">{list.length}개</span>
        </div>
      </div>
      <div className="search">
        <SearchIcon />
        <input
          placeholder="이사, 여행, 시험…"
          aria-label="템플릿 검색"
          value={curQ}
          onChange={(e) => setCurQ(e.target.value)}
        />
      </div>
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className="chip"
            aria-pressed={curCat === c}
            onClick={() => setCurCat(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="scroll">
        {list.length ? (
          <div className="bento">
            {list.map((x, i) => {
              const n = x.w.reduce((a, b) => a + b[1].length, 0);
              return (
                <button
                  key={x.id}
                  className={`lcard${i % 5 === 0 ? " s2 feat" : ""}`}
                  onClick={() => setOpenId(x.id)}
                >
                  <div className="cardtop">
                    <span className="emoji">{x.e}</span>
                    {badgesFor(stats, x.id)}
                  </div>
                  <h3>{x.t}</h3>
                  <div className="usesrow">
                    <span className="uses">{fmt(uses(stats, x.id))}명 사용</span>
                    <span className="dotsep">·</span>
                    <span>{n}항목</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bento">
            <div className="tile s2">
              <div className="empty">
                <b>찾는 템플릿이 없어요</b>직접 만들어서 쓸 수 있어요.
              </div>
            </div>
          </div>
        )}
      </div>

      <TemplateSheet
        template={openTemplate}
        stats={stats}
        onClose={() => setOpenId(null)}
        onUse={handleUseTemplate}
      />
    </>
  );
}
