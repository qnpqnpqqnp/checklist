"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { getAnonId } from "@/lib/anon-id";
import { useToast } from "./toast-context";

export type Item = { id: string; text: string; done: boolean };
export type Period = { name: string; items: Item[] };
export type ChecklistPeriodType = "none" | "weekly" | "daily";
export type ChecklistList = {
  id: string;
  title: string;
  emoji: string;
  pt: ChecklistPeriodType;
  periods: Period[];
  groupCode?: string;
};

type Row = {
  id: string;
  owner_id: string;
  title: string;
  emoji: string;
  pt: ChecklistPeriodType;
  periods: Period[];
  group_code: string | null;
  created_at: string;
};

function rowToList(row: Row): ChecklistList {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    pt: row.pt,
    periods: row.periods,
    groupCode: row.group_code ?? undefined,
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

function code6(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const ListsContext = createContext<{
  lists: ChecklistList[];
  loading: boolean;
  createList: (
    title: string,
    emoji: string,
    pt: ChecklistPeriodType,
    periods: Period[]
  ) => Promise<ChecklistList | null>;
  toggleItem: (listId: string, itemId: string) => Promise<void>;
  addItem: (listId: string, periodIndex: number, text: string) => Promise<void>;
  deleteItem: (listId: string, itemId: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  shareList: (listId: string) => Promise<string | null>;
} | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ChecklistList[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ownerId = getAnonId();
        const { data, error } = await supabase
          .from("checklists")
          .select("*")
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) {
          showToast("체크리스트를 불러오지 못했어요");
        } else if (data) {
          setLists((data as Row[]).map(rowToList));
        }
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
  }, []);

  async function createList(
    title: string,
    emoji: string,
    pt: ChecklistPeriodType,
    periods: Period[]
  ) {
    const ownerId = getAnonId();
    const { data, error } = await supabase
      .from("checklists")
      .insert({ owner_id: ownerId, title, emoji, pt, periods })
      .select()
      .single();
    if (error || !data) {
      showToast("체크리스트를 만들지 못했어요");
      return null;
    }
    const created = rowToList(data as Row);
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
    const periods = list.periods.map((p, i) =>
      i === periodIndex
        ? {
            ...p,
            items: [...p.items, { id: crypto.randomUUID(), text, done: false }],
          }
        : p
    );
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

  async function deleteList(listId: string) {
    const prev = lists;
    setLists((cur) => cur.filter((l) => l.id !== listId));
    const { error } = await supabase.from("checklists").delete().eq("id", listId);
    if (error) {
      setLists(prev);
      showToast("삭제하지 못했어요");
    }
  }

  async function shareList(listId: string) {
    const code = code6();
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, groupCode: code } : l))
    );
    const { error } = await supabase
      .from("checklists")
      .update({ group_code: code })
      .eq("id", listId);
    if (error) {
      showToast("공유 코드 저장에 실패했어요");
      return null;
    }
    return code;
  }

  return (
    <ListsContext.Provider
      value={{
        lists,
        loading,
        createList,
        toggleItem,
        addItem,
        deleteItem,
        deleteList,
        shareList,
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
