"use client";

import type { Group } from "../groups-context";

export default function GroupPickerSheet({
  open,
  onClose,
  groups,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className={`sbg${open ? " on" : ""}`} onClick={onClose} />
      <div
        className={`sheet${open ? " on" : ""}`}
        style={{ height: "auto", maxHeight: "70%" }}
      >
        <div className="handle" />
        <div className="shead" style={{ paddingBottom: "10px" }}>
          <h3 style={{ marginTop: "2px" }}>그룹 선택</h3>
          <p>목록을 만들 그룹을 골라주세요.</p>
        </div>
        <div className="scroll">
          <div className="gpick" style={{ padding: "0 22px 8px" }}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={selectedId === g.id}
                onClick={() => {
                  onSelect(g.id);
                  onClose();
                }}
              >
                <span>{g.name}</span>
                <span className="code">{g.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
