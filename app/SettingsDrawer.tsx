"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { useTheme } from "./theme-context";
import { useToast } from "./toast-context";

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M15 4h4v16h-4M10 8l5 4-5 4M14 12H3" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M15 4h-4a2 2 0 00-2 2v12a2 2 0 002 2h4M9 12h11M17 8l3 4-3 4" />
    </svg>
  );
}
function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 21a9 9 0 110-18c4.5 0 8 3 8 6.5 0 2-1.5 3-3 3h-2.2c-1 0-1.6 1.2-1 2l.3.4c.6.8 0 2.1-1 2.1H12" />
      <circle cx="7.2" cy="12" r="1" />
      <circle cx="9" cy="8" r="1" />
      <circle cx="15" cy="8" r="1" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.5 20c0-3.9 3.4-6.2 7.5-6.2s7.5 2.3 7.5 6.2" />
    </svg>
  );
}

export default function SettingsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, signOut, deleteAccount } = useAuth();
  const { openPicker } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function close() {
    setConfirming(false);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      showToast(error);
      return;
    }
    close();
    showToast("탈퇴됐어요");
    router.push("/");
  }

  return (
    <>
      <div className={`drawer-bg${open ? " on" : ""}`} onClick={close} />
      <div className={`drawer${open ? " on" : ""}`}>
        <div className="dhead">
          <h3 style={{ fontFamily: "var(--disp)", fontSize: "22px", fontWeight: 800 }}>
            설정
          </h3>
        </div>

        <div className="dlabel">계정</div>
        {user ? (
          <button
            className="drow"
            onClick={async () => {
              await signOut();
              close();
              showToast("로그아웃됐어요");
            }}
          >
            <LogoutIcon />
            로그아웃
          </button>
        ) : (
          <button
            className="drow"
            onClick={() => {
              close();
              router.push("/login");
            }}
          >
            <LoginIcon />
            로그인
          </button>
        )}

        <div className="dlabel">화면</div>
        <button
          className="drow"
          onClick={() => {
            close();
            openPicker();
          }}
        >
          <PaletteIcon />
          색 팔레트
        </button>

        {user && (
          <>
            <div className="dlabel">계정 관리</div>
            <div style={{ padding: "0 20px 4px" }}>
              <p className="note" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <UserIcon />
                {user.email}
              </p>
            </div>
            {!confirming ? (
              <button
                className="drow"
                style={{ color: "var(--red)" }}
                onClick={() => setConfirming(true)}
              >
                계정 탈퇴
              </button>
            ) : (
              <div style={{ padding: "8px 20px 4px", display: "flex", flexDirection: "column", gap: "9px" }}>
                <p className="note">
                  <b>탈퇴하면 내 체크리스트가 모두 삭제되고 되돌릴 수 없어요.</b>{" "}
                  정말 탈퇴할까요?
                </p>
                <button
                  className="clay btn"
                  style={{ background: "var(--red)", color: "#fff" }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "탈퇴 처리 중…" : "정말 탈퇴할게요"}
                </button>
                <button
                  className="clay pale btn"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                >
                  취소
                </button>
              </div>
            )}
          </>
        )}

        <div className="dfoot" />
      </div>
    </>
  );
}
