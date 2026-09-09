"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";
import { useToast } from "../toast-context";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.04 12.27c0-.82-.07-1.42-.22-2.05H12.24v3.72h6.19c-.13 1.02-.8 2.56-2.31 3.6l-.02.14 3.36 2.6.23.02c2.14-1.97 3.35-4.87 3.35-8.03z"
      />
      <path
        fill="#34A853"
        d="M12.24 23c3.03 0 5.57-1 7.43-2.7l-3.54-2.75c-.95.66-2.22 1.12-3.89 1.12-2.97 0-5.48-1.97-6.38-4.69l-.13.01-3.49 2.7-.05.12C4.02 20.7 7.83 23 12.24 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.86 13.98a6.85 6.85 0 010-4.36l-.01-.14-3.53-2.75-.12.06a10.98 10.98 0 000 9.88l3.66-2.69z"
      />
      <path
        fill="#EA4335"
        d="M12.24 4.79c2.11 0 3.53.9 4.34 1.66l3.17-3.06C17.8 1.68 15.27.6 12.24.6 7.83.6 4.02 2.9 2.2 6.6l3.65 2.83c.91-2.72 3.42-4.64 6.39-4.64z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { user, signUp, signIn, signInWithGoogle, signOut, resetPassword } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password) {
      showToast("이메일과 비밀번호를 입력해 주세요");
      return;
    }
    setSubmitting(true);
    const { error, needsEmailConfirm } = await signUp(email.trim(), password);
    setSubmitting(false);
    if (error) {
      showToast(error);
      return;
    }
    if (needsEmailConfirm) {
      showToast("가입 완료! 이메일을 확인하고 로그인해 주세요");
      return;
    }
    showToast("가입됐어요");
    router.push("/");
  }

  async function handleSignIn() {
    if (!email.trim() || !password) {
      showToast("이메일과 비밀번호를 입력해 주세요");
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      showToast(error);
      return;
    }
    showToast("로그인됐어요");
    router.push("/");
  }

  async function handleGoogleSignIn() {
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    setSubmitting(false);
    if (error) {
      showToast(error);
    }
  }

  async function handleResetPassword() {
    if (!resetEmail.trim()) {
      showToast("이메일을 입력해 주세요");
      return;
    }
    setSubmitting(true);
    const { error } = await resetPassword(resetEmail.trim());
    setSubmitting(false);
    if (error) {
      showToast(error);
      return;
    }
    showToast("재설정 링크를 이메일로 보냈어요");
    setMode("signin");
  }

  if (user) {
    return (
      <>
        <div className="top">
          <h1>로그인</h1>
        </div>
        <div className="scroll">
          <div className="form">
            <p className="note">
              <b>{user.email}</b>(으)로 로그인돼 있어요.
            </p>
            <button
              className="clay pale btn"
              onClick={async () => {
                await signOut();
                showToast("로그아웃됐어요");
              }}
            >
              로그아웃
            </button>
            <button className="clay btn" onClick={() => router.push("/")}>
              홈으로
            </button>
          </div>
        </div>
      </>
    );
  }

  if (mode === "reset") {
    return (
      <>
        <div className="top">
          <h1>비밀번호 재설정</h1>
        </div>
        <div className="scroll">
          <div className="form">
            <div className="field">
              <label htmlFor="l3">이메일</label>
              <input
                id="l3"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <button
              className="clay btn"
              onClick={handleResetPassword}
              disabled={submitting}
            >
              재설정 링크 보내기
            </button>
            <button
              type="button"
              className="linklike"
              onClick={() => setMode("signin")}
            >
              로그인으로 돌아가기
            </button>
            <p className="note">
              가입할 때 쓴 이메일 주소로 비밀번호를 재설정할 수 있는 링크를
              보내드려요.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top">
        <h1>로그인</h1>
      </div>
      <div className="scroll">
        <div className="form">
          <div className="field">
            <label htmlFor="l1">이메일</label>
            <input
              id="l1"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="l2">비밀번호</label>
            <input
              id="l2"
              type="password"
              autoComplete="current-password"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="clay btn" onClick={handleSignIn} disabled={submitting}>
            로그인
          </button>
          <button
            className="clay pale btn"
            onClick={handleSignUp}
            disabled={submitting}
          >
            가입
          </button>
          <button
            type="button"
            className="clay pale btn iconbtn"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            <GoogleIcon />
            구글로 로그인
          </button>
          <button
            type="button"
            className="linklike"
            onClick={() => setMode("reset")}
          >
            비밀번호를 잊으셨나요?
          </button>
          <p className="note">
            로그인은 선택 사항이에요. 로그인 없이 만든 체크리스트는 로그인하는
            순간 그대로 계정으로 옮겨져요.
          </p>
        </div>
      </div>
    </>
  );
}
