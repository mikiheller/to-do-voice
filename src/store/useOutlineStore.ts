"use client";

import { useState, useCallback } from "react";
import {
  OutlineItem,
  OutlineState,
  createItem,
  findItem,
  findParent,
  cloneItems,
} from "@/types";

// Sample data for testing
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

export function useOutlineStore() {
  const [state, setState] = useState<OutlineState>({
    items: sampleData,
    focusedId: null,
    zoomedId: null,
    showCompleted: false,
  });

  // Update an item's content
  const updateContent = useCallback((id: string, content: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        item.content = content;
      }
      return { ...prev, items };
    });
  }, []);

  // Toggle completion status
  const toggleComplete = useCallback((id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        const newCompleted = !item.completed;
        item.completed = newCompleted;
        item.completedAt = newCompleted ? Date.now() : null;
        
        // Check all children if completing parent
        if (newCompleted) {
          const checkAllChildren = (children: OutlineItem[]) => {
            for (const child of children) {
              child.completed = true;
              child.completedAt = Date.now();
              checkAllChildren(child.children);
            }
          };
          checkAllChildren(item.children);
        }
      }
      return { ...prev, items };
    });
  }, []);

  // Toggle collapsed state
  const toggleCollapse = useCallback((id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        item.collapsed = !item.collapsed;
      }
      return { ...prev, items };
    });
  }, []);

  // Add a new item after the specified item
  const addItemAfter = useCallback((afterId: string): string => {
    let newId = "";
    setState((prev) => {
      const items = cloneItems(prev.items);
      const newItem = createItem("");
      newId = newItem.id;

      // Find the item and its parent
      const parent = findParent(items, afterId, null);
      const siblings = parent ? parent.children : items;
      const index = siblings.findIndex((i) => i.id === afterId);

      if (index !== -1) {
        newItem.parentId = parent?.id || null;
        siblings.splice(index + 1, 0, newItem);
      }

      return { ...prev, items, focusedId: newId };
    });
    return newId;
  }, []);

  // Add a new child item
  const addChild = useCallback((parentId: string): string => {
    let newId = "";
    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findItem(items, parentId);
      if (parent) {
        const newItem = createItem("", parentId);
        newId = newItem.id;
        parent.children.push(newItem);
        parent.collapsed = false; // Expand to show new child
      }
      return { ...prev, items, focusedId: newId };
    });
    return newId;
  }, []);

  // Indent an item (make it a child of the previous sibling)
  const indentItem = useCallback((id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findParent(items, id, null);
      const siblings = parent ? parent.children : items;
      const index = siblings.findIndex((i) => i.id === id);

      if (index > 0) {
        const item = siblings[index];
        const prevSibling = siblings[index - 1];
        
        // Remove from current position
        siblings.splice(index, 1);
        
        // Add as last child of previous sibling
        item.parentId = prevSibling.id;
        prevSibling.children.push(item);
        prevSibling.collapsed = false;
      }

      return { ...prev, items };
    });
  }, []);

  // Outdent an item (move it to parent's level)
  const outdentItem = useCallback((id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const parent = findParent(items, id, null);
      
      if (parent) {
        const grandparent = findParent(items, parent.id, null);
        const item = findItem(items, id);
        
        if (item) {
          // Remove from parent
          const indexInParent = parent.children.findIndex((i) => i.id === id);
          parent.children.splice(indexInParent, 1);
          
          // Add after parent in grandparent's children
          const grandparentChildren = grandparent ? grandparent.children : items;
          const parentIndex = grandparentChildren.findIndex((i) => i.id === parent.id);
          item.parentId = grandparent?.id || null;
          grandparentChildren.splice(parentIndex + 1, 0, item);
        }
      }

      return { ...prev, items };
    });
  }, []);

  // Delete an item
  const deleteItem = useCallback((id: string) => {
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
  }, []);

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

  // Mark an item as seen (remove blue dot)
  const markSeen = useCallback((id: string) => {
    setState((prev) => {
      const items = cloneItems(prev.items);
      const item = findItem(items, id);
      if (item) {
        item.isNew = false;
      }
      return { ...prev, items };
    });
  }, []);

  // Get visible items (respecting zoom and completed filter)
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
  };
}

