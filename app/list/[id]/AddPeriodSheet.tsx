"use client";

import { useState } from "react";

export default function AddPeriodSheet({
  open,
  onClose,
  placeholder,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  placeholder: string;
  onSubmit: (name: string) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setName("");
    onClose();
  }

  async function handleSubmit() {
    const trimmed = name.trim() || placeholder;
    if (submitting) return;
    setSubmitting(true);
    await onSubmit(trimmed);
    setSubmitting(false);
    handleClose();
  }

  return (
    <>
      <div className={`sbg${open ? " on" : ""}`} onClick={handleClose} />
      <div
        className={`sheet${open ? " on" : ""}`}
        style={{ height: "auto", maxHeight: "50%" }}
      >
        <div className="handle" />
        <div className="shead" style={{ paddingBottom: "10px" }}>
          <h3 style={{ marginTop: "2px" }}>기간 추가</h3>
          <p>새 기간의 이름을 정해주세요.</p>
        </div>
        <div className="scroll">
          <div className="form">
            <div className="field">
              <label htmlFor="p-name">기간 이름</label>
              <input
                id="p-name"
                autoFocus
                placeholder={placeholder}
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
          <button className="clay btn" onClick={handleSubmit} disabled={submitting}>
            추가
          </button>
        </div>
      </div>
    </>
  );
}
