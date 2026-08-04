"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLists, stat } from "../../lists-context";
import { useToast } from "../../toast-context";

export default function ListDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    lists,
    toggleItem,
    addItem,
    updateItem,
    deleteItem,
    addPeriod,
    deleteList,
  } = useLists();
  const { showToast } = useToast();

  const [curWeek, setCurWeek] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const skipBlurSaveRef = useRef(false);

  const cur = lists.find((l) => l.id === params.id);

  if (!cur) {
    return (
      <>
        <div className="top">
          <button
            className="back"
            onClick={() => router.push("/")}
            aria-label="뒤로"
          >
            ←
          </button>
          <h1>체크리스트</h1>
        </div>
        <div className="scroll">
          <div className="empty">
            <b>찾을 수 없어요</b>삭제되었거나 존재하지 않는 체크리스트예요.
          </div>
        </div>
      </>
    );
  }

  const safeWeek = curWeek < cur.periods.length ? curWeek : 0;
  const period = cur.periods[safeWeek];
  const [d, t] = stat(cur);
  const pct = t ? Math.round((d / t) * 100) : 0;
  const showTabs = !(cur.pt === "none" && cur.periods.length === 1 && !editMode);

  async function handleItemClick(itemId: string) {
    if (editMode) {
      await deleteItem(cur!.id, itemId);
    } else {
      await toggleItem(cur!.id, itemId);
    }
  }

  async function handleAddItem() {
    const v = newItemText.trim();
    if (!v) return;
    await addItem(cur!.id, safeWeek, v);
    setNewItemText("");
  }

  function startEditingItem(itemId: string, text: string) {
    setEditingItemId(itemId);
    setEditingText(text);
  }

  async function commitItemEdit(itemId: string, text: string) {
    const trimmed = text.trim();
    setEditingItemId(null);
    if (!trimmed) return;
    await updateItem(cur!.id, itemId, trimmed);
  }

  function cancelItemEdit() {
    skipBlurSaveRef.current = true;
    setEditingItemId(null);
  }

  async function handleAddPeriod() {
    const n = window.prompt(
      "기간 이름",
      `${cur!.periods.length + 1}${cur!.pt === "daily" ? "일차" : "주차"}`
    );
    if (!n) return;
    const nextIndex = cur!.periods.length;
    await addPeriod(cur!.id, n);
    setCurWeek(nextIndex);
  }

  async function handleDeleteList() {
    if (!window.confirm("삭제하면 되돌릴 수 없어요. 삭제할까요?")) return;
    await deleteList(cur!.id);
    showToast("삭제했어요");
    router.push("/");
  }

  return (
    <>
      <div className="top">
        <button
          className="back"
          onClick={() => router.push("/")}
          aria-label="뒤로"
        >
          ←
        </button>
        <h1>
          {cur.emoji} {cur.title}
        </h1>
        <div className="act">
          <button
            className="mini"
            aria-pressed={editMode}
            onClick={() => setEditMode((v) => !v)}
          >
            편집
          </button>
        </div>
      </div>

      <div className="dhead">
        <div className="huge">
          <span>{pct}</span>
          <i>%</i>
        </div>
        <div className="track">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="cnt">
          <span>{d}</span>개 완료 · <span>{t - d}</span>개 남음
        </div>
      </div>

      {showTabs && (
        <div className="wtabs">
          {cur.periods.map((p, i) => {
            const undone = p.items.some((x) => !x.done);
            return (
              <button
                key={`${p.name}-${i}`}
                className="wt"
                aria-pressed={i === safeWeek}
                onClick={() => setCurWeek(i)}
              >
                {p.name}
                {undone && <span className="dot" />}
              </button>
            );
          })}
          {editMode && (
            <button className="wt add" onClick={handleAddPeriod}>
              + 기간
            </button>
          )}
        </div>
      )}

      <div className="scroll">
        <div className="items">
          {period.items.length ? (
            period.items.map((it) =>
              editingItemId === it.id ? (
                <div key={it.id} className="item-row">
                  <input
                    className="item-edit"
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitItemEdit(it.id, editingText);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelItemEdit();
                      }
                    }}
                    onBlur={() => {
                      if (skipBlurSaveRef.current) {
                        skipBlurSaveRef.current = false;
                        return;
                      }
                      commitItemEdit(it.id, editingText);
                    }}
                  />
                </div>
              ) : (
                <div key={it.id} className="item-row">
                  <button
                    className={`item${it.done ? " done" : ""}`}
                    onClick={() => handleItemClick(it.id)}
                  >
                    <span className="box">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 12.5l5 5L20 6.5" />
                      </svg>
                    </span>
                    <span className="txt">{it.text}</span>
                    {editMode && <span className="del">×</span>}
                  </button>
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingItem(it.id, it.text);
                    }}
                    aria-label="항목 수정"
                  >
                    ⋮
                  </button>
                </div>
              )
            )
          ) : (
            <div className="empty">
              <b>비어 있어요</b>아래에서 할 일을 추가해 보세요.
            </div>
          )}
        </div>
        {editMode && (
          <div style={{ padding: "18px" }}>
            <button
              className="clay pale btn"
              style={{ color: "var(--red)" }}
              onClick={handleDeleteList}
            >
              이 체크리스트 삭제
            </button>
          </div>
        )}
      </div>

      <div className="addrow">
        <input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="할 일 추가"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddItem();
          }}
        />
        <button className="clay" onClick={handleAddItem}>
          추가
        </button>
      </div>
    </>
  );
}
