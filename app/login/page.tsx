"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";
import { useToast } from "../toast-context";

export default function LoginPage() {
  const { user, signUp, signIn, signOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <p className="note">
            로그인은 선택 사항이에요. 로그인 없이 만든 체크리스트는 로그인하는
            순간 그대로 계정으로 옮겨져요.
          </p>
        </div>
      </div>
    </>
  );
}
