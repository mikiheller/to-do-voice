export interface OutlineItem {
  id: string;
  content: string;
  completed: boolean;
  collapsed: boolean;
  children: OutlineItem[];
  parentId: string | null;
  isNew: boolean; // Blue dot indicator for voice-added items
  createdAt: number;
  completedAt: number | null;
}

export interface OutlineState {
  items: OutlineItem[];
  focusedId: string | null; // Currently focused/editing item
  zoomedId: string | null; // "Zoomed into" item (showing only its subtree)
  showCompleted: boolean;
}

// Helper to create a new item
export function createItem(
  content: string = "",
  parentId: string | null = null,
  isNew: boolean = false
): OutlineItem {
  return {
    id: generateId(),
    content,
    completed: false,
    collapsed: false,
    children: [],
    parentId,
    isNew,
    createdAt: Date.now(),
    completedAt: null,
  };
}

// Generate a simple unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Find an item by ID in the tree
export function findItem(
  items: OutlineItem[],
  id: string
): OutlineItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItem(item.children, id);
    if (found) return found;
  }
  return null;
}

// Find parent of an item
export function findParent(
  items: OutlineItem[],
  id: string,
  parent: OutlineItem | null = null
): OutlineItem | null {
  for (const item of items) {
    if (item.id === id) return parent;
    const found = findParent(item.children, id, item);
    if (found) return found;
  }
  return null;
}

// Get the path to an item (for breadcrumbs)
export function getPath(
  items: OutlineItem[],
  id: string,
  path: OutlineItem[] = []
): OutlineItem[] {
  for (const item of items) {
    if (item.id === id) return [...path, item];
    const found = getPath(item.children, id, [...path, item]);
    if (found.length > 0) return found;
  }
  return [];
}

// Deep clone the items tree
export function cloneItems(items: OutlineItem[]): OutlineItem[] {
  return items.map(item => ({
    ...item,
    children: cloneItems(item.children),
  }));
}

// Flatten the tree for search
export function flattenItems(items: OutlineItem[]): OutlineItem[] {
  const result: OutlineItem[] = [];
  for (const item of items) {
    result.push(item);
    result.push(...flattenItems(item.children));
  }
  return result;
}

