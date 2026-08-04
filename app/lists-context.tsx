"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Item = { id: string; text: string; done: boolean };
export type Period = { name: string; items: Item[] };
export type ChecklistPeriodType = "none" | "weekly" | "daily";
export type ChecklistList = {
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

export function stat(l: ChecklistList): [number, number] {
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

function code6(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const ListsContext = createContext<{
  lists: ChecklistList[];
  shareList: (id: string) => string;
} | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ChecklistList[]>(initialLists);

  const shareList = (id: string) => {
    const code = code6();
    setLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, groupCode: code } : l))
    );
    return code;
  };

  return (
    <ListsContext.Provider value={{ lists, shareList }}>
      {children}
    </ListsContext.Provider>
  );
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error("useLists must be used within ListsProvider");
  return ctx;
}
