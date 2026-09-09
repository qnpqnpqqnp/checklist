"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";
import { useToast } from "../toast-context";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Clicking the reset-password email link makes supabase-js parse the
    // recovery token out of the URL and fire PASSWORD_RECOVERY once that's
    // done — that's the earliest point a session reliably exists here.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setHasSession(true);
      }
      setChecking(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword() {
    if (!password || password.length < 6) {
      showToast("비밀번호는 6자 이상이어야 해요");
      return;
    }
    if (password !== confirm) {
      showToast("비밀번호가 서로 달라요");
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      showToast(error);
      return;
    }
    showToast("비밀번호가 바뀌었어요");
    router.push("/");
  }

  if (checking) {
    return (
      <>
        <div className="top">
          <h1>비밀번호 재설정</h1>
        </div>
        <div className="scroll">
          <div className="form">
            <p className="note">확인 중이에요…</p>
          </div>
        </div>
      </>
    );
  }

  if (!hasSession) {
    return (
      <>
        <div className="top">
          <h1>비밀번호 재설정</h1>
        </div>
        <div className="scroll">
          <div className="form">
            <p className="note">
              링크가 만료됐거나 잘못됐어요. 로그인 화면에서 재설정 링크를 다시
              요청해 주세요.
            </p>
            <button className="clay btn" onClick={() => router.push("/login")}>
              로그인으로 가기
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top">
        <h1>새 비밀번호 설정</h1>
      </div>
      <div className="scroll">
        <div className="form">
          <div className="field">
            <label htmlFor="rp1">새 비밀번호</label>
            <input
              id="rp1"
              type="password"
              autoComplete="new-password"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rp2">새 비밀번호 확인</label>
            <input
              id="rp2"
              type="password"
              autoComplete="new-password"
              placeholder="한 번 더 입력"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button
            className="clay btn"
            onClick={handleUpdatePassword}
            disabled={submitting}
          >
            비밀번호 바꾸기
          </button>
        </div>
      </div>
    </>
  );
}
