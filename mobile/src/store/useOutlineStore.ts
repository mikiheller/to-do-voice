import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ItemRow } from "../types/database";
import {
  OutlineItem,
  OutlineState,
  createItem,
  findItem,
  findParent,
  cloneItems,
} from "../types";

// Convert flat database rows to nested tree structure
function buildTree(rows: ItemRow[]): OutlineItem[] {
  const itemMap = new Map<string, OutlineItem>();
  const rootItems: OutlineItem[] = [];

  for (const row of rows) {
    itemMap.set(row.id, {
      id: row.id,
      content: row.content,
      completed: row.completed,
      collapsed: row.collapsed,
      children: [],
      parentId: row.parent_id,
      isNew: row.is_new,
      createdAt: new Date(row.created_at).getTime(),
      completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
    });
  }

  for (const row of rows) {
    const item = itemMap.get(row.id)!;
    if (row.parent_id && itemMap.has(row.parent_id)) {
      itemMap.get(row.parent_id)!.children.push(item);
    } else if (!row.parent_id) {
      rootItems.push(item);
    }
  }

  const sortChildren = (items: OutlineItem[]) => {
    items.sort((a, b) => {
      const aRow = rows.find(r => r.id === a.id);
      const bRow = rows.find(r => r.id === b.id);
      return (aRow?.position ?? 0) - (bRow?.position ?? 0);
    });
    items.forEach(item => sortChildren(item.children));
  };
  
  sortChildren(rootItems);
  return rootItems;
}

export function useOutlineStore() {
  const [state, setState] = useState<OutlineState>({
    items: [],
    focusedId: null,
    zoomedId: null,
    showCompleted: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<any>(null);

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching items:", error);
        return;
      }

      if (data) {
        const tree = buildTree(data);
        setState((prev) => ({ ...prev, items: tree }));
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => {
          fetchItems();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [fetchItems]);

  const updateContent = useCallback(async (id: string, content: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) item.content = content;
      return { ...prev, items };
    });

    await supabase.from("items").update({ content }).eq("id", id);
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    let newCompleted = false;
    let idsToUpdate: string[] = [];

    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        newCompleted = !item.completed;
        item.completed = newCompleted;
        item.completedAt = newCompleted ? Date.now() : null;
        idsToUpdate.push(item.id);

        if (newCompleted) {
          const checkAllChildren = (children: OutlineItem[]) => {
            for (const child of children) {
              child.completed = true;
              child.completedAt = Date.now();
              idsToUpdate.push(child.id);
              checkAllChildren(child.children);
            }
          };
          checkAllChildren(item.children);
        }
      }
      return { ...prev, items };
    });

    const completedAt = newCompleted ? new Date().toISOString() : null;
    for (const itemId of idsToUpdate) {
      await supabase
        .from("items")
        .update({ completed: newCompleted, completed_at: completedAt })
        .eq("id", itemId);
    }
  }, []);

  const toggleCollapse = useCallback(async (id: string) => {
    let newCollapsed = false;

    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        newCollapsed = !item.collapsed;
        item.collapsed = newCollapsed;
      }
      return { ...prev, items };
    });

    await supabase.from("items").update({ collapsed: newCollapsed }).eq("id", id);
  }, []);

  const addItemAfter = useCallback(async (afterId: string): Promise<string> => {
    const newItem = createItem("");
    let parentId: string | null = null;
    let position = 0;

    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findParent(items, afterId, null);
      const siblings = parent ? parent.children : items;
      const index = siblings.findIndex((i) => i.id === afterId);

      if (index !== -1) {
        parentId = parent?.id || null;
        position = index + 1;
        newItem.parentId = parentId;
        siblings.splice(index + 1, 0, newItem);
      }

      return { ...prev, items, focusedId: newItem.id };
    });

    await supabase.from("items").insert({
      id: newItem.id,
      content: "",
      parent_id: parentId,
      position,
    });

    return newItem.id;
  }, []);

  const indentItem = useCallback(async (id: string) => {
    let newParentId: string | null = null;

    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findParent(items, id, null);
      const siblings = parent ? parent.children : items;
      const index = siblings.findIndex((i) => i.id === id);

      if (index > 0) {
        const item = siblings[index];
        const prevSibling = siblings[index - 1];
        newParentId = prevSibling.id;

        siblings.splice(index, 1);
        item.parentId = prevSibling.id;
        prevSibling.children.push(item);
        prevSibling.collapsed = false;
      }

      return { ...prev, items };
    });

    if (newParentId) {
      await supabase
        .from("items")
        .update({ parent_id: newParentId, position: 9999 })
        .eq("id", id);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findParent(items, id, null);
      const siblings = parent ? parent.children : items;
      const index = siblings.findIndex((i) => i.id === id);

      if (index !== -1) siblings.splice(index, 1);

      return { ...prev, items, focusedId: null };
    });

    await supabase.from("items").delete().eq("id", id);
  }, []);

  const setFocused = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, focusedId: id }));
  }, []);

  const zoomTo = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, zoomedId: id }));
  }, []);

  const toggleShowCompleted = useCallback(() => {
    setState((prev) => ({ ...prev, showCompleted: !prev.showCompleted }));
  }, []);

  const markSeen = useCallback(async (id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) item.isNew = false;
      return { ...prev, items };
    });

    await supabase.from("items").update({ is_new: false }).eq("id", id);
  }, []);

  return {
    state,
    isLoading,
    isConnected,
    updateContent,
    toggleComplete,
    toggleCollapse,
    addItemAfter,
    indentItem,
    deleteItem,
    setFocused,
    zoomTo,
    toggleShowCompleted,
    markSeen,
    refetch: fetchItems,
  };
}

