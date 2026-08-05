"use client";

import { useState } from "react";

export default function JoinGroupSheet({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<boolean>;
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setCode("");
    onClose();
  }

  async function handleSubmit() {
    const trimmed = code.trim();
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
          <h3 style={{ marginTop: "2px" }}>코드로 참여</h3>
          <p>그룹장에게 받은 6자리 초대 코드를 입력해 주세요.</p>
        </div>
        <div className="scroll">
          <div className="form">
            <div className="field">
              <label htmlFor="g-code">초대 코드</label>
              <input
                id="g-code"
                autoFocus
                maxLength={6}
                placeholder="예) A3F9K2"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                style={{
                  textAlign: "center",
                  letterSpacing: "0.18em",
                  fontFamily: "var(--disp)",
                  fontSize: "18px",
                }}
              />
            </div>
          </div>
        </div>
        <div className="sfoot">
          <button
            className="clay btn"
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
          >
            참여하기
          </button>
        </div>
      </div>
    </>
  );
}
