"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";
import { useGroups } from "../groups-context";
import { useToast } from "../toast-context";

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups, loading, createGroup, joinGroup } = useGroups();
  const { showToast } = useToast();

  async function handleCreateGroup() {
    const name = window.prompt("그룹 이름");
    if (!name?.trim()) return;
    const group = await createGroup(name);
    if (!group) {
      showToast("그룹을 만들지 못했어요");
      return;
    }
    showToast(`초대 코드 ${group.code}를 만들었어요`);
  }

  async function handleJoinGroup() {
    const code = window.prompt("초대 코드");
    if (!code?.trim()) return;
    const { group, error } = await joinGroup(code);
    if (error || !group) {
      showToast(error ?? "참여하지 못했어요");
      return;
    }
    showToast(`${group.name} 그룹에 참여했어요`);
  }

  function handleCopy(code: string) {
    navigator.clipboard?.writeText(code);
    showToast("초대 코드를 복사했어요");
  }

  if (!user) {
    return (
      <>
        <div className="top">
          <h1>그룹</h1>
        </div>
        <div className="scroll">
          <div className="empty">
            <b>그룹은 로그인 후 이용 가능해요</b>
            로그인하면 그룹을 만들고 초대 코드로 참여할 수 있어요.
          </div>
          <div style={{ padding: "0 18px" }}>
            <button className="clay btn" onClick={() => router.push("/login")}>
              로그인하러 가기
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top">
        <h1>그룹</h1>
        <div className="act">
          <button className="mini" onClick={handleJoinGroup}>
            코드로 참여
          </button>
        </div>
      </div>
      <div className="scroll">
        <div className="grpwrap">
          <p className="note" style={{ padding: "0 22px 16px" }}>
            그룹에 만든 체크리스트는 <b>그룹 멤버 전원이 실시간으로 보고
            체크·추가·삭제</b>할 수 있어요.
          </p>

          {loading ? null : groups.length ? (
            groups.map((g) => (
              <div key={g.id} className="gcard">
                <h3>{g.name}</h3>
                <div className="gcode">
                  <span className="lb">초대 코드</span>
                  <b>{g.code}</b>
                  <button className="copy" onClick={() => handleCopy(g.code)}>
                    복사
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">
              <b>속한 그룹이 없어요</b>그룹을 만들거나 초대 코드로 참여해
              보세요.
            </div>
          )}

          <div style={{ padding: "0 18px" }}>
            <button className="clay btn" onClick={handleCreateGroup}>
              그룹 만들기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
