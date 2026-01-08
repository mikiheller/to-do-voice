export interface OutlineItem {
  id: string;
  content: string;
  completed: boolean;
  collapsed: boolean;
  children: OutlineItem[];
  parentId: string | null;
  isNew: boolean;
  createdAt: number;
  completedAt: number | null;
}

export interface OutlineState {
  items: OutlineItem[];
  focusedId: string | null;
  zoomedId: string | null;
  showCompleted: boolean;
}

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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

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

export function cloneItems(items: OutlineItem[]): OutlineItem[] {
  return items.map(item => ({
    ...item,
    children: cloneItems(item.children),
  }));
}

