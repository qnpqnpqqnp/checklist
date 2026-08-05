// Shared icon mark for favicon/apple-icon/PWA manifest icons — same violet
// badge + checkmark language as the "✓" logo in AppShell.tsx and the item
// checkbox in list/[id]/page.tsx, drawn as an SVG path (not a text glyph)
// so rendering never depends on fetching a font at build time.
export function pwaIconElement(size: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#4A5BA8",
        borderRadius: size * 0.22,
      }}
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12.5l5 5L20 6.5" />
      </svg>
    </div>
  );
}
