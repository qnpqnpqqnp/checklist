"use client";

import { useState } from "react";

export default function CreateGroupSheet({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setName("");
    onClose();
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(trimmed);
    setSubmitting(false);
    if (ok) handleClose();
  }

  return (
    <>
      <div className={`sbg${open ? " on" : ""}`} onClick={handleClose} />
      <div
        className={`sheet${open ? " on" : ""}`}
        style={{ height: "auto", maxHeight: "60%" }}
      >
        <div className="handle" />
        <div className="shead" style={{ paddingBottom: "10px" }}>
          <h3 style={{ marginTop: "2px" }}>그룹 만들기</h3>
          <p>
            그룹을 만들면 초대 코드가 생겨요. 코드를 아는 사람이 참여하면
            체크리스트를 같이 쓸 수 있어요.
          </p>
        </div>
        <div className="scroll">
          <div className="form">
            <div className="field">
              <label htmlFor="g-name">그룹 이름</label>
              <input
                id="g-name"
                autoFocus
                placeholder="예) 우리 가족"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
          </div>
        </div>
        <div className="sfoot">
          <button
            className="clay btn"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
          >
            만들기
          </button>
        </div>
      </div>
    </>
  );
}
