"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLists, type ChecklistPeriodType, type Period } from "../lists-context";
import { useToast } from "../toast-context";

const EMOJI = ["📝", "📦", "✈️", "🖥", "🏋️", "🧹", "💻", "🎂", "🌱", "🎯"];

export default function CreatePage() {
  const { createList } = useLists();
  const { showToast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(EMOJI[0]);
  const [pt, setPt] = useState<ChecklistPeriodType>("none");
  const [periodCount, setPeriodCount] = useState("4");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    const t = title.trim();
    if (!t) {
      showToast("제목을 입력해 주세요");
      return;
    }
    let periods: Period[] = [{ name: "전체", items: [] }];
    if (pt !== "none") {
      const n = Math.min(24, Math.max(2, Number(periodCount) || 4));
      periods = Array.from({ length: n }, (_, i) => ({
        name: `${i + 1}${pt === "daily" ? "일차" : "주차"}`,
        items: [],
      }));
    }
    setSubmitting(true);
    const created = await createList(t, emoji, pt, periods);
    setSubmitting(false);
    if (created) {
      setTitle("");
      showToast("만들었어요");
      router.push("/");
    }
  }

  return (
    <>
      <div className="top">
        <h1>새로 만들기</h1>
      </div>
      <div className="scroll">
        <div className="form">
          <div className="field">
            <label htmlFor="c1">제목</label>
            <input
              id="c1"
              placeholder="예) 첫 자취 준비"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label>아이콘</label>
            <div className="emojirow">
              {EMOJI.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={emoji === e}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>기간 나누기</label>
            <div className="seg">
              <button
                type="button"
                aria-pressed={pt === "none"}
                onClick={() => setPt("none")}
              >
                안 나눔
              </button>
              <button
                type="button"
                aria-pressed={pt === "weekly"}
                onClick={() => setPt("weekly")}
              >
                주차별
              </button>
              <button
                type="button"
                aria-pressed={pt === "daily"}
                onClick={() => setPt("daily")}
              >
                일자별
              </button>
            </div>
          </div>
          {pt !== "none" && (
            <div className="field">
              <label htmlFor="c3">몇 개로 나눌까요</label>
              <input
                id="c3"
                type="number"
                min={2}
                max={24}
                value={periodCount}
                onChange={(e) => setPeriodCount(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          )}
          <button className="clay btn" onClick={handleCreate} disabled={submitting}>
            만들기
          </button>
          <button className="clay pale btn" onClick={() => router.push("/templates")}>
            템플릿에서 가져오기
          </button>
          <p className="note">
            데이터는 이 브라우저 계정에 저장돼요.{" "}
            <b>
              그룹으로 공유한 목록은 초대 코드를 아는 사람이면 누구나 보고
              고칠 수 있어요.
            </b>
          </p>
          <button
            className="clay pale btn"
            style={{ color: "var(--red)" }}
            onClick={() => showToast("아직 준비 중이에요")}
          >
            전체 데이터 초기화
          </button>
        </div>
      </div>
    </>
  );
}
