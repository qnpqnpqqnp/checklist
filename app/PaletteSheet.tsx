"use client";

import { useTheme, type Theme } from "./theme-context";

const PAL: { k: Theme; n: string; d: string; c: string[] }[] = [
  { k: "mist", n: "안개", d: "저채도 인디고", c: ["#EDEEF1", "#4A5BA8", "#C3CDE8", "#1B1D24"] },
  { k: "earth", n: "흙", d: "모래 + 딥그린", c: ["#EDE9E2", "#39604F", "#CBD9BE", "#23211C"] },
  { k: "mono", n: "먹", d: "무채색 + 코발트", c: ["#F1F1F1", "#1B45E0", "#DDE4FB", "#101012"] },
  { k: "dusk", n: "노을", d: "웜 뉴트럴 + 로즈", c: ["#F0EAE7", "#8A5561", "#E7D6D3", "#241E1E"] },
  { k: "night", n: "밤", d: "다크 모드", c: ["#141519", "#6675E8", "#3B4360", "#D6D8E0"] },
];

export default function PaletteSheet() {
  const { theme, setTheme, isPickerOpen, closePicker } = useTheme();

  return (
    <>
      <div className={`sbg${isPickerOpen ? " on" : ""}`} onClick={closePicker} />
      <div
        className={`sheet${isPickerOpen ? " on" : ""}`}
        style={{ height: "auto", maxHeight: "88%" }}
      >
        <div className="handle" />
        <div className="shead" style={{ paddingBottom: "10px" }}>
          <h3 style={{ marginTop: "2px" }}>색 고르기</h3>
          <p>고르면 바로 반영돼요. 언제든 다시 바꿀 수 있어요.</p>
        </div>
        <div className="scroll">
          <div className="pal">
            {PAL.map((p) => (
              <button
                key={p.k}
                className="palc"
                aria-pressed={theme === p.k}
                onClick={() => setTheme(p.k)}
              >
                <div className="sw">
                  {p.c.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </div>
                <h4>{p.n}</h4>
                <p>{p.d}</p>
              </button>
            ))}
          </div>
          <p className="note" style={{ padding: "16px 22px 4px" }}>
            눈이 편한 쪽을 고르세요. 하루에 몇 번씩 여는 앱이라{" "}
            <b>튀는 색보다 오래 봐도 안 피곤한 색</b>이 맞아요.
          </p>
        </div>
        <div className="sfoot">
          <button className="clay btn" onClick={closePicker}>
            이걸로 할게요
          </button>
        </div>
      </div>
    </>
  );
}
