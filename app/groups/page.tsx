"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";
import { useGroups, type Group } from "../groups-context";
import { useToast } from "../toast-context";
import CreateGroupSheet from "./CreateGroupSheet";
import JoinGroupSheet from "./JoinGroupSheet";

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups, loading, createGroup, joinGroup, getChecklistCount, deleteGroup, leaveGroup } =
    useGroups();
  const { showToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [checklistCount, setChecklistCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreateGroup(name: string) {
    const group = await createGroup(name);
    if (!group) {
      showToast("그룹을 만들지 못했어요");
      return false;
    }
    showToast(`초대 코드 ${group.code}를 만들었어요`);
    return true;
  }

  async function handleJoinGroup(code: string) {
    const { group, error } = await joinGroup(code);
    if (error || !group) {
      showToast(error ?? "참여하지 못했어요");
      return false;
    }
    showToast(`${group.name} 그룹에 참여했어요`);
    return true;
  }

  function handleCopy(code: string) {
    navigator.clipboard?.writeText(code);
    showToast("초대 코드를 복사했어요");
  }

  function cancelConfirm() {
    setConfirmId(null);
    setChecklistCount(null);
  }

  async function startDeleteConfirm(g: Group) {
    setConfirmId(g.id);
    setChecklistCount(null);
    const count = await getChecklistCount(g.id);
    setChecklistCount(count);
  }

  function startLeaveConfirm(g: Group) {
    setConfirmId(g.id);
    setChecklistCount(null);
  }

  async function handleConfirmDelete(g: Group) {
    setBusy(true);
    const ok = await deleteGroup(g.id);
    setBusy(false);
    cancelConfirm();
    showToast(ok ? "그룹을 삭제했어요" : "삭제하지 못했어요");
  }

  async function handleConfirmLeave(g: Group) {
    setBusy(true);
    const ok = await leaveGroup(g.id);
    setBusy(false);
    cancelConfirm();
    showToast(ok ? "그룹에서 나갔어요" : "나가지 못했어요");
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
          <button className="mini" onClick={() => setJoinOpen(true)}>
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
            groups.map((g) => {
              const isOwner = g.ownerId === user.id;
              const confirming = confirmId === g.id;
              return (
                <div key={g.id}>
                  <div className="gcard">
                    <h3>{g.name}</h3>
                    <div className="gcode">
                      <span className="lb">초대 코드</span>
                      <b>{g.code}</b>
                      <button className="copy" onClick={() => handleCopy(g.code)}>
                        복사
                      </button>
                    </div>
                  </div>

                  {!confirming ? (
                    <div className="grow">
                      {isOwner ? (
                        <button className="mini danger" onClick={() => startDeleteConfirm(g)}>
                          삭제
                        </button>
                      ) : (
                        <button className="mini danger" onClick={() => startLeaveConfirm(g)}>
                          나가기
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "0 18px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "9px",
                      }}
                    >
                      {isOwner ? (
                        <p className="note">
                          <b>
                            {checklistCount === null
                              ? "확인 중…"
                              : `이 그룹의 체크리스트 ${checklistCount}개도 함께 삭제돼요.`}
                          </b>{" "}
                          되돌릴 수 없어요. 정말 삭제할까요?
                        </p>
                      ) : (
                        <p className="note">
                          <b>다시 참여하려면 초대 코드가 필요해요.</b> 이 그룹에서
                          나갈까요?
                        </p>
                      )}
                      <button
                        className="clay btn"
                        style={{ background: "var(--red)", color: "#fff" }}
                        onClick={() =>
                          isOwner ? handleConfirmDelete(g) : handleConfirmLeave(g)
                        }
                        disabled={busy || (isOwner && checklistCount === null)}
                      >
                        {busy ? "처리 중…" : isOwner ? "정말 삭제할게요" : "나가기"}
                      </button>
                      <button className="clay pale btn" onClick={cancelConfirm} disabled={busy}>
                        취소
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty">
              <b>속한 그룹이 없어요</b>그룹을 만들거나 초대 코드로 참여해
              보세요.
            </div>
          )}

          <div style={{ padding: "0 18px" }}>
            <button className="clay btn" onClick={() => setCreateOpen(true)}>
              그룹 만들기
            </button>
          </div>
        </div>
      </div>

      <CreateGroupSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateGroup}
      />
      <JoinGroupSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onSubmit={handleJoinGroup}
      />
    </>
  );
}
