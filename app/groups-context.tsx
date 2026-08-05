"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth-context";

export type Group = { id: string; code: string; name: string; ownerId: string };

type GroupRow = { id: string; code: string; name: string; owner_id: string };
type MembershipRow = { groups: GroupRow | null };

function rowToGroup(row: GroupRow): Group {
  return { id: row.id, code: row.code, name: row.name, ownerId: row.owner_id };
}

const GroupsContext = createContext<{
  groups: Group[];
  loading: boolean;
  createGroup: (name: string) => Promise<Group | null>;
  joinGroup: (code: string) => Promise<{ group: Group | null; error: string | null }>;
  getChecklistCount: (groupId: string) => Promise<number>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
} | null>(null);

function code6(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) {
          setGroups([]);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("group_members")
        .select("groups(id, code, name, owner_id)")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (!error && data) {
        const rows = data as unknown as MembershipRow[];
        setGroups(
          rows
            .map((r) => r.groups)
            .filter((g): g is GroupRow => !!g)
            .map(rowToGroup)
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  async function createGroup(name: string): Promise<Group | null> {
    if (!user) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = code6();
      const { data, error } = await supabase
        .from("groups")
        .insert({ code, name: trimmed, owner_id: user.id })
        .select("id, code, name, owner_id")
        .single();
      if (error) {
        if (error.code === "23505") continue; // code collision, retry
        return null;
      }
      const group = rowToGroup(data as GroupRow);
      const { error: joinError } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id });
      if (joinError) return null;
      setGroups((prev) => [...prev, group]);
      return group;
    }
    return null;
  }

  async function joinGroup(
    codeInput: string
  ): Promise<{ group: Group | null; error: string | null }> {
    if (!user) return { group: null, error: "로그인이 필요해요" };
    const code = codeInput.trim().toUpperCase();
    if (!code) return { group: null, error: "코드를 입력해 주세요" };

    const { data, error } = await supabase
      .from("groups")
      .select("id, code, name, owner_id")
      .eq("code", code)
      .maybeSingle();
    if (error || !data) return { group: null, error: "존재하지 않는 코드예요" };
    const group = rowToGroup(data as GroupRow);

    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });
    if (joinError && joinError.code !== "23505") {
      return { group: null, error: "참여하지 못했어요" };
    }
    setGroups((prev) => (prev.some((g) => g.id === group.id) ? prev : [...prev, group]));
    return { group, error: null };
  }

  async function getChecklistCount(groupId: string): Promise<number> {
    const { count } = await supabase
      .from("checklists")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId);
    return count ?? 0;
  }

  async function deleteGroup(groupId: string): Promise<boolean> {
    if (!user) return false;
    // Explicit order — checklists, then memberships, then the group itself
    // — rather than relying only on ON DELETE CASCADE. RLS re-evaluates on
    // every cascaded delete too, and once earlier rows in the cascade chain
    // are gone the later ones can fail their own policy check depending on
    // trigger firing order. Deleting in dependency order from here keeps
    // each step's policy check looking at still-consistent state.
    const { error: clError } = await supabase
      .from("checklists")
      .delete()
      .eq("group_id", groupId);
    if (clError) return false;

    const { error: gmError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId);
    if (gmError) return false;

    const { error: gError } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("owner_id", user.id);
    if (gError) return false;

    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return true;
  }

  async function leaveGroup(groupId: string): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    if (error) return false;
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return true;
  }

  return (
    <GroupsContext.Provider
      value={{
        groups,
        loading,
        createGroup,
        joinGroup,
        getChecklistCount,
        deleteGroup,
        leaveGroup,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error("useGroups must be used within GroupsProvider");
  return ctx;
}
