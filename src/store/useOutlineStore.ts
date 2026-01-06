"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ItemRow } from "@/types/database";
import {
  OutlineItem,
  OutlineState,
  createItem,
  findItem,
  findParent,
  cloneItems,
} from "@/types";

// Sample data for local-only mode
const sampleData: OutlineItem[] = [
  {
    ...createItem("Brendy to do's"),
    id: "brendy",
    children: [
      { ...createItem("Clean the ice machine"), id: "ice", parentId: "brendy", children: [] },
      { ...createItem("Organize the pantry"), id: "pantry", parentId: "brendy", children: [] },
    ],
  },
  {
    ...createItem("Karlo to do's"),
    id: "karlo",
    children: [
      {
        ...createItem("Dimmer switches"),
        id: "dimmer",
        parentId: "karlo",
        children: [
          { ...createItem("Install dimmer switch in closet"), id: "closet", parentId: "dimmer", children: [] },
          { ...createItem("Install dimmer switch in garage"), id: "garage", parentId: "dimmer", children: [] },
        ],
      },
    ],
  },
  {
    ...createItem("Things to learn"),
    id: "learn",
    children: [
      { ...createItem("Differential equations / linear algebra"), id: "math", parentId: "learn", children: [] },
      { ...createItem("Electrical engineering basics"), id: "ee", parentId: "learn", children: [] },
      { ...createItem("Biology"), id: "bio", parentId: "learn", children: [] },
    ],
  },
  {
    ...createItem("Miscellaneous"),
    id: "misc",
    children: [],
  },
];

// Convert flat database rows to nested tree structure
function buildTree(rows: ItemRow[]): OutlineItem[] {
  const itemMap = new Map<string, OutlineItem>();
  const rootItems: OutlineItem[] = [];

  // First pass: create all items
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

  // Second pass: build hierarchy
  for (const row of rows) {
    const item = itemMap.get(row.id)!;
    if (row.parent_id && itemMap.has(row.parent_id)) {
      itemMap.get(row.parent_id)!.children.push(item);
    } else if (!row.parent_id) {
      rootItems.push(item);
    }
  }

  // Sort children by position
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

// Local storage helpers
const STORAGE_KEY = "voice-todo-items";

function saveToLocalStorage(items: OutlineItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

function loadFromLocalStorage(): OutlineItem[] | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
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
  const [useLocalMode, setUseLocalMode] = useState(!isSupabaseConfigured);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionRef = useRef<any>(null);

  // Fetch items from Supabase
  const fetchItems = useCallback(async () => {
    if (!supabase || useLocalMode) {
      // Local mode - load from localStorage or use sample data
      const stored = loadFromLocalStorage();
      setState((prev) => ({ ...prev, items: stored || sampleData }));
      setIsLoading(false);
      setIsConnected(true); // "Connected" in local mode
      return;
    }

    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching items:", error);
        // Fall back to local mode
        setUseLocalMode(true);
        const stored = loadFromLocalStorage();
        setState((prev) => ({ ...prev, items: stored || sampleData }));
        return;
      }

      if (data) {
        const tree = buildTree(data);
        setState((prev) => ({ ...prev, items: tree }));
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setUseLocalMode(true);
      const stored = loadFromLocalStorage();
      setState((prev) => ({ ...prev, items: stored || sampleData }));
    } finally {
      setIsLoading(false);
    }
  }, [useLocalMode]);

  // Subscribe to real-time changes
  useEffect(() => {
    fetchItems();

    if (supabase && !useLocalMode) {
      // Set up real-time subscription
      const channel = supabase
        .channel("items-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "items" },
          (payload) => {
            console.log("Realtime update:", payload);
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
    }
  }, [fetchItems, useLocalMode]);

  // Save to localStorage in local mode
  useEffect(() => {
    if (useLocalMode && state.items.length > 0) {
      saveToLocalStorage(state.items);
    }
  }, [state.items, useLocalMode]);

  // Update an item's content
  const updateContent = useCallback(async (id: string, content: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        item.content = content;
      }
      return { ...prev, items };
    });

    if (supabase && !useLocalMode) {
      const { error } = await supabase
        .from("items")
        .update({ content })
        .eq("id", id);

      if (error) {
        console.error("Error updating content:", error);
      }
    }
  }, [useLocalMode]);

  // Toggle completion status
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

    if (supabase && !useLocalMode) {
      const completedAt = newCompleted ? new Date().toISOString() : null;
      
      for (const itemId of idsToUpdate) {
        await supabase
          .from("items")
          .update({ completed: newCompleted, completed_at: completedAt })
          .eq("id", itemId);
      }
    }
  }, [useLocalMode]);

  // Toggle collapsed state
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

    if (supabase && !useLocalMode) {
      await supabase
        .from("items")
        .update({ collapsed: newCollapsed })
        .eq("id", id);
    }
  }, [useLocalMode]);

  // Add a new item after the specified item
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

    if (supabase && !useLocalMode) {
      await supabase.from("items").insert({
        id: newItem.id,
        content: "",
        parent_id: parentId,
        position,
      });
    }

    return newItem.id;
  }, [useLocalMode]);

  // Add a new child item
  const addChild = useCallback(async (parentId: string): Promise<string> => {
    const newItem = createItem("", parentId);

    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findItem(items, parentId);
      if (parent) {
        parent.children.push(newItem);
        parent.collapsed = false;
      }
      return { ...prev, items, focusedId: newItem.id };
    });

    if (supabase && !useLocalMode) {
      await supabase.from("items").insert({
        id: newItem.id,
        content: "",
        parent_id: parentId,
        position: 0,
      });
    }

    return newItem.id;
  }, [useLocalMode]);

  // Indent an item
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

    if (supabase && !useLocalMode && newParentId) {
      await supabase
        .from("items")
        .update({ parent_id: newParentId, position: 9999 })
        .eq("id", id);
    }
  }, [useLocalMode]);

  // Outdent an item
  const outdentItem = useCallback(async (id: string) => {
    let newParentId: string | null = null;
    let shouldUpdate = false;

    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findParent(items, id, null);

      if (parent) {
        const grandparent = findParent(items, parent.id, null);
        const item = findItem(items, id);

        if (item) {
          shouldUpdate = true;
          const indexInParent = parent.children.findIndex((i) => i.id === id);
          parent.children.splice(indexInParent, 1);

          const grandparentChildren = grandparent ? grandparent.children : items;
          const parentIndex = grandparentChildren.findIndex((i) => i.id === parent.id);
          newParentId = grandparent?.id || null;
          item.parentId = newParentId;
          grandparentChildren.splice(parentIndex + 1, 0, item);
        }
      }

      return { ...prev, items };
    });

    if (supabase && !useLocalMode && shouldUpdate) {
      await supabase
        .from("items")
        .update({ parent_id: newParentId, position: 9999 })
        .eq("id", id);
    }
  }, [useLocalMode]);

  // Delete an item
  const deleteItem = useCallback(async (id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findParent(items, id, null);
      const siblings = parent ? parent.children : items;
      const index = siblings.findIndex((i) => i.id === id);

      if (index !== -1) {
        siblings.splice(index, 1);
      }

      return { ...prev, items, focusedId: null };
    });

    if (supabase && !useLocalMode) {
      await supabase.from("items").delete().eq("id", id);
    }
  }, [useLocalMode]);

  // Set focused item
  const setFocused = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, focusedId: id }));
  }, []);

  // Zoom into an item
  const zoomTo = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, zoomedId: id }));
  }, []);

  // Toggle show completed
  const toggleShowCompleted = useCallback(() => {
    setState((prev) => ({ ...prev, showCompleted: !prev.showCompleted }));
  }, []);

  // Mark an item as seen
  const markSeen = useCallback(async (id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        item.isNew = false;
      }
      return { ...prev, items };
    });

    if (supabase && !useLocalMode) {
      await supabase
        .from("items")
        .update({ is_new: false })
        .eq("id", id);
    }
  }, [useLocalMode]);

  // Get visible items
  const getVisibleItems = useCallback((): OutlineItem[] => {
    let items = state.items;

    if (state.zoomedId) {
      const zoomedItem = findItem(items, state.zoomedId);
      if (zoomedItem) {
        items = [zoomedItem];
      }
    }

    return items;
  }, [state.items, state.zoomedId]);

  return {
    state,
    isLoading,
    isConnected: useLocalMode ? true : isConnected,
    isLocalMode: useLocalMode,
    updateContent,
    toggleComplete,
    toggleCollapse,
    addItemAfter,
    addChild,
    indentItem,
    outdentItem,
    deleteItem,
    setFocused,
    zoomTo,
    toggleShowCompleted,
    markSeen,
    getVisibleItems,
    refetch: fetchItems,
  };
}
