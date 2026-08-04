"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "./theme-context";
import { ListsProvider } from "./lists-context";
import { ToastProvider } from "./toast-context";
import PaletteSheet from "./PaletteSheet";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5M16 6.5a3 3 0 010 5.6M18 19c0-2.4-1-3.9-2.5-4.6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { openPicker } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <span>✓</span>체크리스트
        </div>
        <div className="rnav">
          <button
            className={pathname === "/" ? "on" : ""}
            onClick={() => router.push("/")}
          >
            <HomeIcon />홈<span className="kbd">1</span>
          </button>
          <button disabled>
            <SearchIcon />템플릿<span className="kbd">2</span>
          </button>
          <button
            className={pathname === "/groups" ? "on" : ""}
            onClick={() => router.push("/groups")}
          >
            <GroupIcon />그룹<span className="kbd">3</span>
          </button>
          <button disabled>
            <PlusIcon />만들기<span className="kbd">N</span>
          </button>
        </div>
        <div className="rlabel">내 체크리스트</div>
        <div className="rlist">
          <p className="note" style={{ padding: "4px 12px", fontSize: "12px" }}>
            다음 업데이트에서 연결돼요
          </p>
        </div>
        <div className="railfoot">
          <button className="mini" onClick={openPicker}>
            🎨 색 바꾸기
          </button>
        </div>
      </aside>

      <div className="viewport">
        <section className="screen on">{children}</section>
      </div>

      <nav className="nav">
        <button
          className={pathname === "/" ? "on" : ""}
          onClick={() => router.push("/")}
        >
          <HomeIcon />홈
        </button>
        <button disabled>
          <SearchIcon />템플릿
        </button>
        <button
          className={pathname === "/groups" ? "on" : ""}
          onClick={() => router.push("/groups")}
        >
          <GroupIcon />그룹
        </button>
        <button disabled>
          <PlusIcon />만들기
        </button>
      </nav>

      <PaletteSheet />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <ListsProvider>
          <Shell>{children}</Shell>
        </ListsProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}
