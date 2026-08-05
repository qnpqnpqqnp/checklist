"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getAnonId } from "@/lib/anon-id";
import { useToast } from "./toast-context";
import { useAuth } from "./auth-context";
import { useGroups, type Group } from "./groups-context";

export type Item = { id: string; text: string; done: boolean; addedBy?: string };
export type Period = { name: string; items: Item[] };
export type ChecklistPeriodType = "none" | "weekly" | "daily";
export type ChecklistList = {
  id: string;
  title: string;
  emoji: string;
  pt: ChecklistPeriodType;
  periods: Period[];
  groupId?: string;
  groupCode?: string;
};

type Row = {
  id: string;
  owner_id: string;
  title: string;
  emoji: string;
  pt: ChecklistPeriodType;
  periods: Period[];
  group_id: string | null;
  groups?: { code: string; name: string } | null;
  created_at: string;
};

function rowToList(row: Row, groupsById: Record<string, Group>): ChecklistList {
  const groupCode = row.groups?.code ?? (row.group_id ? groupsById[row.group_id]?.code : undefined);
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    pt: row.pt,
    periods: row.periods,
    groupId: row.group_id ?? undefined,
    groupCode,
  };
}

export function stat(l: ChecklistList): [number, number] {
  let d = 0;
  let t = 0;
  l.periods.forEach((p) =>
    p.items.forEach((i) => {
      t++;
      if (i.done) d++;
    })
  );
  return [d, t];
}

const ListsContext = createContext<{
  lists: ChecklistList[];
  loading: boolean;
  createList: (
    title: string,
    emoji: string,
    pt: ChecklistPeriodType,
    periods: Period[],
    groupId?: string
  ) => Promise<ChecklistList | null>;
  toggleItem: (listId: string, itemId: string) => Promise<void>;
  addItem: (listId: string, periodIndex: number, text: string) => Promise<void>;
  updateItem: (listId: string, itemId: string, text: string) => Promise<void>;
  deleteItem: (listId: string, itemId: string) => Promise<void>;
  addPeriod: (listId: string, name: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
} | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ChecklistList[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();

  const groupsById = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g])),
    [groups]
  );

  useEffect(() => {
    if (authLoading || groupsLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const anonId = getAnonId();
        // Migrate lists created anonymously (before login) onto the real
        // account, so they stay visible after signing in.
        if (user && anonId && anonId !== user.id) {
          await supabase
            .from("checklists")
            .update({ owner_id: user.id })
            .eq("owner_id", anonId);
        }
        const ownerId = user?.id ?? anonId;
        const personalQuery = supabase
          .from("checklists")
          .select("*")
          .is("group_id", null)
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: false });

        const groupIds = groups.map((g) => g.id);
        const groupQuery =
          groupIds.length > 0
            ? supabase
                .from("checklists")
                .select("*, groups(code, name)")
                .in("group_id", groupIds)
                .order("created_at", { ascending: false })
            : null;

        const [personalRes, groupRes] = await Promise.all([
          personalQuery,
          groupQuery ?? Promise.resolve({ data: [], error: null }),
        ]);
        if (cancelled) return;
        if (personalRes.error || groupRes.error) {
          showToast("체크리스트를 불러오지 못했어요");
          return;
        }
        const rows = [
          ...((personalRes.data ?? []) as Row[]),
          ...((groupRes.data ?? []) as Row[]),
        ];
        rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        setLists(rows.map((r) => rowToList(r, groupsById)));
      } catch {
        if (!cancelled) showToast("체크리스트를 불러오지 못했어요");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, groups, groupsLoading]);

  // Realtime: group checklists are shared with other members, so live edits
  // from them need to be reflected without a manual refresh. RLS still
  // applies to Realtime, so non-members never receive these events.
  useEffect(() => {
    if (!user || groups.length === 0) return;
    const groupIds = groups.map((g) => g.id);
    const channel = supabase
      .channel(`checklists-groups-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checklists",
          filter: `group_id=in.(${groupIds.join(",")})`,
        },
        (payload: RealtimePostgresChangesPayload<Row>) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            if (!oldId) return;
            setLists((prev) => prev.filter((l) => l.id !== oldId));
            return;
          }
          const incoming = rowToList(payload.new as Row, groupsById);
          setLists((prev) => {
            const idx = prev.findIndex((l) => l.id === incoming.id);
            if (idx === -1) return [incoming, ...prev];
            const next = [...prev];
            next[idx] = incoming;
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, groups]);

  async function createList(
    title: string,
    emoji: string,
    pt: ChecklistPeriodType,
    periods: Period[],
    groupId?: string
  ) {
    if (groupId && !user) {
      showToast("그룹은 로그인 후 이용 가능해요");
      return null;
    }
    const ownerId = user?.id ?? getAnonId();
    const { data, error } = await supabase
      .from("checklists")
      .insert({ owner_id: ownerId, title, emoji, pt, periods, group_id: groupId ?? null })
      .select("*, groups(code, name)")
      .single();
    if (error || !data) {
      showToast("체크리스트를 만들지 못했어요");
      return null;
    }
    const created = rowToList(data as Row, groupsById);
    setLists((prev) => [created, ...prev]);
    return created;
  }

  async function persistPeriods(listId: string, periods: Period[]) {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, periods } : l))
    );
    const { error } = await supabase
      .from("checklists")
      .update({ periods })
      .eq("id", listId);
    if (error) showToast("저장에 실패했어요. 잠시 뒤 다시 시도해 주세요");
  }

  async function toggleItem(listId: string, itemId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const periods = list.periods.map((p) => ({
      ...p,
      items: p.items.map((i) =>
        i.id === itemId ? { ...i, done: !i.done } : i
      ),
    }));
    await persistPeriods(listId, periods);
  }

  async function addItem(listId: string, periodIndex: number, text: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const addedBy = list.groupId ? user?.email?.split("@")[0] : undefined;
    const periods = list.periods.map((p, i) =>
      i === periodIndex
        ? {
            ...p,
            items: [...p.items, { id: crypto.randomUUID(), text, done: false, addedBy }],
          }
        : p
    );
    await persistPeriods(listId, periods);
  }

  async function updateItem(listId: string, itemId: string, text: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const periods = list.periods.map((p) => ({
      ...p,
      items: p.items.map((i) => (i.id === itemId ? { ...i, text } : i)),
    }));
    await persistPeriods(listId, periods);
  }

  async function deleteItem(listId: string, itemId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const periods = list.periods.map((p) => ({
      ...p,
      items: p.items.filter((i) => i.id !== itemId),
    }));
    await persistPeriods(listId, periods);
  }

  async function addPeriod(listId: string, name: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const periods = [...list.periods, { name, items: [] }];
    await persistPeriods(listId, periods);
  }

  async function deleteList(listId: string) {
    const prev = lists;
    setLists((cur) => cur.filter((l) => l.id !== listId));
    const { error } = await supabase.from("checklists").delete().eq("id", listId);
    if (error) {
      setLists(prev);
      showToast("삭제하지 못했어요");
    }
  }

  return (
    <ListsContext.Provider
      value={{
        lists,
        loading,
        createList,
        toggleItem,
        addItem,
        updateItem,
        deleteItem,
        addPeriod,
        deleteList,
      }}
    >
      {children}
    </ListsContext.Provider>
  );
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error("useLists must be used within ListsProvider");
  return ctx;
}
