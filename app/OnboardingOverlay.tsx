"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ONBOARDING_STEPS, useOnboarding } from "./onboarding-context";

type Rect = { x: number; y: number; width: number; height: number };

function findTarget(appEl: HTMLElement, targets: string[]): Rect | null {
  const appRect = appEl.getBoundingClientRect();
  for (const key of targets) {
    const els = appEl.querySelectorAll<HTMLElement>(`[data-onboarding="${key}"]`);
    for (const el of Array.from(els)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return {
          x: r.left - appRect.left,
          y: r.top - appRect.top,
          width: r.width,
          height: r.height,
        };
      }
    }
  }
  return null;
}

export default function OnboardingOverlay() {
  const { active, step, stepIndex, isLast, next, skip } = useOnboarding();
  // `spot` is intentionally NOT reset to null between steps — it holds the
  // last-known position so the dimmed curtain (driven by `spot`) never has
  // a moment with nothing rendered. Only the ring + tooltip fade out while
  // the next step's target is being located, then fade back in once found.
  const [spot, setSpot] = useState<Rect | null>(null);
  const [appSize, setAppSize] = useState({ width: 0, height: 0 });
  const [tipVisible, setTipVisible] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);

  // Locate this step's target. Retries quickly since a route change means
  // the new page's DOM may not have rendered it on the very first tick.
  useEffect(() => {
    let cancelled = false;

    function measure() {
      const appEl = document.querySelector<HTMLElement>(".app");
      if (!appEl) return false;
      const appRect = appEl.getBoundingClientRect();
      setAppSize({ width: appRect.width, height: appRect.height });
      const rect = active ? findTarget(appEl, step.targets) : null;
      if (rect) {
        setSpot(rect);
        return true;
      }
      return false;
    }

    (async () => {
      if (!active) {
        if (!cancelled) {
          setSpot(null);
          setTipVisible(false);
        }
        return;
      }
      if (!cancelled) setTipVisible(false); // fade the old ring/tooltip out while we search
      let attempts = 0;
      function tick() {
        if (cancelled) return;
        const found = measure();
        attempts += 1;
        if (found) {
          if (!cancelled) setTipVisible(true); // fade the new one back in
          return;
        }
        if (attempts < 60) setTimeout(tick, 50);
      }
      tick();
    })();

    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
    };
  }, [active, step]);

  // Position the tooltip near the spotlighted rect, flipping above/below
  // depending on available space, once we know its own rendered size.
  useLayoutEffect(() => {
    if (!spot || !tipRef.current) {
      setTipPos(null);
      return;
    }
    const margin = 14;
    const tipEl = tipRef.current;
    const tipHeight = tipEl.offsetHeight;
    const tipWidth = tipEl.offsetWidth;

    const spaceBelow = appSize.height - (spot.y + spot.height);
    const spaceAbove = spot.y;
    let top: number;
    if (spaceBelow >= tipHeight + margin) {
      top = spot.y + spot.height + margin;
    } else if (spaceAbove >= tipHeight + margin) {
      top = spot.y - tipHeight - margin;
    } else {
      top = Math.max(margin, appSize.height - tipHeight - margin);
    }
    let left = spot.x + spot.width / 2 - tipWidth / 2;
    left = Math.min(Math.max(left, margin), Math.max(margin, appSize.width - tipWidth - margin));
    setTipPos({ top, left });
  }, [spot, appSize]);

  if (!active) return null;

  const pad = 8;
  const holeStyle = spot
    ? {
        top: spot.y - pad,
        left: spot.x - pad,
        width: spot.width + pad * 2,
        height: spot.height + pad * 2,
      }
    : undefined;

  return (
    <>
      {spot && <div className="onb-block" />}
      {spot && <div className="onb-hole" style={holeStyle} />}
      {spot && (
        <div className={`onb-ring${tipVisible ? " on" : ""}`} style={holeStyle} />
      )}
      {spot && (
        <div
          ref={tipRef}
          className={`onb-tip${tipVisible ? " on" : ""}`}
          style={{ top: tipPos?.top ?? 0, left: tipPos?.left ?? 0 }}
        >
          <div className="onb-tip-progress">
            {stepIndex + 1} / {ONBOARDING_STEPS.length}
          </div>
          <h4>{step.title}</h4>
          <p>{step.body}</p>
          <div className="onb-tip-actions">
            <button className="onb-skip" onClick={skip}>
              건너뛰기
            </button>
            <button className="clay btn" onClick={next}>
              {isLast ? "시작하기" : "다음"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
