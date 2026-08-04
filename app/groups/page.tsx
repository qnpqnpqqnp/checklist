"use client";

import { useLists } from "../lists-context";
import { useToast } from "../toast-context";

export default function GroupsPage() {
  const { lists, shareList } = useLists();
  const { showToast } = useToast();

  const shared = lists.filter((l) => l.groupCode);
  const unshared = lists.filter((l) => !l.groupCode);

  function handleShareClick() {
    if (!unshared.length) {
      showToast("공유할 목록이 없어요");
      return;
    }
    const listing = unshared.map((l, i) => `${i + 1}. ${l.title}`).join("\n");
    const answer = window.prompt(`공유할 목록 번호\n${listing}`);
    if (!answer) return;
    const target = unshared[Number(answer) - 1];
    if (!target) return;
    const code = shareList(target.id);
    showToast(`초대 코드 ${code}를 만들었어요`);
  }

  function handleNotReady() {
    showToast("아직 준비 중이에요");
  }

  function handleCopy(code: string) {
    navigator.clipboard?.writeText(code);
    showToast("초대 코드를 복사했어요");
  }

  return (
    <>
      <div className="top">
        <h1>그룹</h1>
        <div className="act">
          <button className="mini" onClick={handleNotReady}>
            코드로 참여
          </button>
        </div>
      </div>
      <div className="scroll">
        <div className="grpwrap">
          <p className="note" style={{ padding: "0 22px 16px" }}>
            그룹 목록은 <b>초대 코드를 아는 사람이면 누구나</b> 보고 고칠 수
            있어요. 민감한 내용은 넣지 마세요.
          </p>
          <p className="note" style={{ padding: "0 22px 16px" }}>
            <b>실제 공유 기능은 준비 중이에요.</b> 조만간 계정 연동과 함께
            열려요 — 지금은 초대 코드가 만들어지는 흐름만 확인할 수 있고,
            다른 사람이 이 코드로 실제 참여할 수는 없어요.
          </p>

          {shared.length ? (
            shared.map((l) => (
              <div key={l.id}>
                <div className="gcard">
                  <h3>
                    {l.emoji} {l.title}
                  </h3>
                  <div className="gcode">
                    <span className="lb">초대 코드</span>
                    <b>{l.groupCode}</b>
                    <button
                      className="copy"
                      onClick={() => handleCopy(l.groupCode!)}
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div className="grow">
                  <button className="mini" disabled>
                    열기
                  </button>
                  <button className="mini" onClick={handleNotReady}>
                    새로고침
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">
              <b>공유 중인 목록이 없어요</b>내 체크리스트를 그룹으로 바꾸면
              초대 코드가 생겨요.
            </div>
          )}

          <div style={{ padding: "0 18px" }}>
            <button className="clay btn" onClick={handleShareClick}>
              내 목록 공유하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
