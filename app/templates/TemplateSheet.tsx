"use client";

import type { Template } from "@/lib/template-data";
import { TEMPLATES } from "@/lib/template-data";
import { fmt, hotId, ranks, uses, wkUses, type StatsMap } from "@/lib/template-stats";

export default function TemplateSheet({
  template,
  stats,
  onClose,
  onUse,
}: {
  template: Template | null;
  stats: StatsMap;
  onClose: () => void;
  onUse: (t: Template) => void;
}) {
  const isOpen = !!template;
  const r = template ? ranks(stats)[template.id] : 0;
  const hot = hotId(stats);
  const max = Math.max(1, ...TEMPLATES.map((t) => uses(stats, t.id)));
  const n = template ? template.w.reduce((a, b) => a + b[1].length, 0) : 0;

  return (
    <>
      <div className={`sbg${isOpen ? " on" : ""}`} onClick={onClose} />
      <div className={`sheet${isOpen ? " on" : ""}`}>
        <div className="handle" />
        {template && (
          <>
            <div className="shead">
              <div style={{ fontSize: "34px" }}>
                {template.e}{" "}
                {r <= 3 && <span className="badge hot">🔥 인기 {r}위</span>}
                {template.id === hot && r > 1 && (
                  <span className="badge up">⚡ 급상승</span>
                )}
              </div>
              <h3>{template.t}</h3>
              <p>{template.d}</p>
              <div className="sstat">
                <span>항목 {n}개</span>
                <span>{template.pt === "none" ? "상시" : `${template.w.length}주 구성`}</span>
              </div>
            </div>
            <div className="scroll">
              <div className="statbox">
                <div className="statgrid">
                  <div>
                    <div className="label">누적 사용</div>
                    <div className="bignum">{fmt(uses(stats, template.id))}</div>
                  </div>
                  <div>
                    <div className="label">이번 주</div>
                    <div className="bignum">{fmt(wkUses(stats, template.id))}</div>
                  </div>
                  <div>
                    <div className="label">인기 순위</div>
                    <div className="bignum">
                      {r}
                      <i>위</i>
                    </div>
                  </div>
                </div>
                <div className="rankbars">
                  {[...TEMPLATES]
                    .sort((a, b) => uses(stats, b.id) - uses(stats, a.id))
                    .slice(0, 5)
                    .map((t) => (
                      <div key={t.id} className={`rb${t.id === template.id ? " me" : ""}`}>
                        <span className="rbn">
                          {t.e} {t.t}
                        </span>
                        <span className="rbt">
                          <i style={{ width: `${Math.round((uses(stats, t.id) / max) * 100)}%` }} />
                        </span>
                        <span className="rbv">{fmt(uses(stats, t.id))}</span>
                      </div>
                    ))}
                </div>
                <p className="note" style={{ padding: "12px 2px 0" }}>
                  전체 템플릿 중 사용 수 기준 상위 5개예요. 상위 3개에 <b>인기</b>, 이번 주 사용이
                  가장 많은 하나에 <b>급상승</b>이 붙어요.
                </p>
              </div>
              <div className="wkl" style={{ padding: "22px 22px 0" }}>
                담긴 항목 {n}개
              </div>
              {template.w.map(([name, items]) => (
                <div key={name} className="wkb">
                  <div className="wkl">{name}</div>
                  {items.map((it) => (
                    <div key={it} className="pv">
                      {it}
                    </div>
                  ))}
                </div>
              ))}
              <p className="note" style={{ padding: "18px 22px 8px" }}>
                가져온 뒤에 자유롭게 고칠 수 있어요.
              </p>
            </div>
            <div className="sfoot">
              <button className="clay btn" onClick={() => onUse(template)}>
                이 템플릿 사용하기
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
