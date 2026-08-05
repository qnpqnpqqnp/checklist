"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type OnboardingNavKey = "home" | "templates" | "groups" | "create";

export type OnboardingStep = {
  path: string;
  navKey: OnboardingNavKey;
  // Tried in order; the first one that's actually present & visible on the
  // page wins. Lets one step adapt to e.g. a logged-out or group-less user.
  targets: string[];
  title: string;
  body: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    path: "/",
    navKey: "home",
    targets: ["menu-trigger"],
    title: "설정 메뉴",
    body: "여기서 로그인, 색상 테마, 계정 설정을 관리할 수 있어요",
  },
  {
    path: "/",
    navKey: "home",
    targets: ["home-hero"],
    title: "오늘의 진행률",
    body: "홈에서는 전체 체크리스트 진행 상황을 한눈에 볼 수 있어요",
  },
  {
    path: "/templates",
    navKey: "templates",
    targets: ["template-card"],
    title: "템플릿",
    body: "다른 사람들이 많이 쓰는 템플릿을 골라서 바로 시작해보세요",
  },
  {
    path: "/create",
    navKey: "create",
    targets: ["create-target-seg"],
    title: "새로 만들기",
    body: "혼자 쓸지, 그룹과 함께 쓸지 골라서 새 체크리스트를 만들 수 있어요",
  },
  {
    path: "/groups",
    navKey: "groups",
    targets: ["group-card", "group-create-btn", "group-login-gate"],
    title: "그룹",
    body: "그룹을 만들면 초대 코드로 친구를 부르고, 같이 체크한 게 실시간으로 보여요",
  },
];

const STORAGE_KEY = "onboarding_seen";

const OnboardingContext = createContext<{
  active: boolean;
  stepIndex: number;
  step: OnboardingStep;
  isLast: boolean;
  next: () => void;
  skip: () => void;
} | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // First-visit auto-start.
  useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      seen = true;
    }
    if (seen) return;
    const t = setTimeout(() => {
      setStepIndex(0);
      setActive(true);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // Keep the real route in sync with whichever step is current.
  useEffect(() => {
    if (!active) return;
    const step = ONBOARDING_STEPS[stepIndex];
    if (pathname !== step.path) {
      router.push(step.path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  // Warm every route the tour will visit as soon as it starts, so each
  // step's router.push resolves as fast as possible instead of the target
  // page's code/data only starting to load at the moment we navigate to it.
  useEffect(() => {
    if (!active) return;
    const paths = Array.from(new Set(ONBOARDING_STEPS.map((s) => s.path)));
    paths.forEach((p) => router.prefetch(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function finish() {
    setActive(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage unavailable — nothing to persist, just stop showing it.
    }
  }

  function next() {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  return (
    <OnboardingContext.Provider
      value={{
        active,
        stepIndex,
        step: ONBOARDING_STEPS[stepIndex],
        isLast: stepIndex === ONBOARDING_STEPS.length - 1,
        next,
        skip: finish,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
