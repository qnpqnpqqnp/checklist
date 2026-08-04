"use client";

import { useState } from "react";
import { useTheme } from "./theme-context";

type Item = { id: string; text: string; done: boolean };
type Period = { name: string; items: Item[] };
type ChecklistPeriodType = "none" | "weekly" | "daily";
type ChecklistList = {
  id: string;
  title: string;
  emoji: string;
  pt: ChecklistPeriodType;
  periods: Period[];
  groupCode?: string;
};

const initialLists: ChecklistList[] = [
  {
    id: "l1",
    title: "자취방 이사 4주 플랜",
    emoji: "📦",
    pt: "weekly",
    periods: [
      {
        name: "1주차",
        items: [
          { id: "i1", text: "이사 업체 3곳 견적 비교", done: true },
          { id: "i2", text: "이사 날짜 확정하기", done: true },
          { id: "i3", text: "집주인에게 퇴거 통보", done: false },
          { id: "i4", text: "버릴 가구·가전 정리", done: false },
        ],
      },
      {
        name: "2주차",
        items: [
          { id: "i5", text: "인터넷·TV 이전 신청", done: false },
          { id: "i6", text: "우편물 주소 이전 신청", done: false },
        ],
      },
    ],
  },
  {
    id: "l2",
    title: "원룸 대청소",
    emoji: "🧹",
    pt: "none",
    periods: [
      {
        name: "전체",
        items: [
          { id: "i7", text: "옷장 안 옷 전부 꺼내기", done: true },
          { id: "i8", text: "창틀·방충망 닦기", done: true },
          { id: "i9", text: "냉장고 안 정리", done: true },
          { id: "i10", text: "싱크대 배수구 청소", done: false },
          { id: "i11", text: "화장실 곰팡이 제거", done: false },
        ],
      },
    ],
  },
  {
    id: "l3",
    title: "오사카 3박 4일 준비",
    emoji: "🐙",
    pt: "weekly",
    groupCode: "8XJ2KQ",
    periods: [
      {
        name: "3주 전",
        items: [
          { id: "i12", text: "항공권 예매", done: true },
          { id: "i13", text: "숙소 예약", done: true },
          { id: "i14", text: "여권 만료일 확인", done: true },
        ],
      },
      {
        name: "1주 전",
        items: [
          { id: "i15", text: "관광지 티켓 예매", done: false },
          { id: "i16", text: "엔화 환전", done: false },
        ],
      },
    ],
  },
];

function stat(l: ChecklistList): [number, number] {
  let d = 0;
  let t = 0;
  l.periods.forEach((p) =>
    p.items.forEach((i) => {
      t++;
      if (i.done) d++;
    })
  );
  return [d, t];
}

export default function Home() {
  const [lists] = useState<ChecklistList[]>(initialLists);
  const { cycleTheme } = useTheme();

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
          <button className="mini" onClick={cycleTheme} aria-label="색 바꾸기">
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
              <button className="clay btn" disabled>
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
                  disabled
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
