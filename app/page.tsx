"use client";

import { useRouter } from "next/navigation";
import { useLists, stat } from "./lists-context";
import { useTheme } from "./theme-context";

export default function Home() {
  const { lists } = useLists();
  const { openPicker } = useTheme();
  const router = useRouter();

  let d = 0;
  let t = 0;
  lists.forEach((l) => {
    const [a, b] = stat(l);
    d += a;
    t += b;
  });
  const pct = t ? Math.round((d / t) * 100) : 0;

  return (
    <>
      <div className="top">
        <h1>오늘</h1>
        <div className="act">
          <button className="mini" onClick={openPicker} aria-label="색 바꾸기">
            🎨 색
          </button>
          <button className="mini" disabled aria-label="새로 만들기">
            + 새로
          </button>
        </div>
      </div>
      <div className="scroll">
        <div className="bento">
          <div className="tile hero s2">
            <div className="label">전체 진행률</div>
            <div className="huge">
              {pct}
              <i>%</i>
            </div>
            <div className="sub">
              {t ? `${d}개 끝냈고 ${t - d}개 남았어요` : "체크리스트를 만들면 여기에 쌓여요"}
            </div>
          </div>
          <div className="tile mini-tile">
            <div className="label">남은 항목</div>
            <div className="huge">{t - d}</div>
          </div>
          <div className="tile mini-tile lime">
            <div className="label">목록</div>
            <div className="huge">{lists.length}</div>
          </div>

          {lists.length === 0 ? (
            <div className="tile s2">
              <div className="empty" style={{ padding: "22px 6px" }}>
                <b>아직 비어 있어요</b>템플릿에서 가져오거나 직접 만들어 보세요.
              </div>
              <button className="clay btn" onClick={() => router.push("/templates")}>
                템플릿 둘러보기
              </button>
            </div>
          ) : (
            lists.map((l, i) => {
              const [a, b] = stat(l);
              const p = b ? Math.round((a / b) * 100) : 0;
              return (
                <button
                  key={l.id}
                  className={`lcard${i === 0 ? " feat s2" : ""}`}
                  onClick={() => router.push(`/list/${l.id}`)}
                >
                  <div>
                    <span className="emoji">{l.emoji}</span>
                    {l.groupCode ? (
                      <span className="badge grp">그룹</span>
                    ) : l.pt !== "none" ? (
                      <span className="badge">
                        {l.periods.length}
                        {l.pt === "daily" ? "일" : "주"}
                      </span>
                    ) : null}
                  </div>
                  <h3>{l.title}</h3>
                  <div className="pct">
                    {p}
                    <i>%</i>
                  </div>
                  <div className="track">
                    <i style={{ width: `${p}%` }} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
