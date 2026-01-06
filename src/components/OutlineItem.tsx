"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { OutlineItem as OutlineItemType } from "@/types";

interface OutlineItemProps {
  item: OutlineItemType;
  depth: number;
  showCompleted: boolean;
  focusedId: string | null;
  onUpdateContent: (id: string, content: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddAfter: (id: string) => string;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string | null) => void;
  onZoom: (id: string) => void;
  onMarkSeen: (id: string) => void;
}

export function OutlineItem({
  item,
  depth,
  showCompleted,
  focusedId,
  onUpdateContent,
  onToggleComplete,
  onToggleCollapse,
  onAddAfter,
  onIndent,
  onOutdent,
  onDelete,
  onFocus,
  onZoom,
  onMarkSeen,
}: OutlineItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = item.children.length > 0;

  // Focus input when this item becomes focused
  useEffect(() => {
    if (focusedId === item.id && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [focusedId, item.id]);

  // Mark as seen when focused
  useEffect(() => {
    if (focusedId === item.id && item.isNew) {
      onMarkSeen(item.id);
    }
  }, [focusedId, item.id, item.isNew, onMarkSeen]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter - add new item after this one
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAddAfter(item.id);
    }

    // Tab - indent
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      onIndent(item.id);
    }

    // Shift+Tab - outdent
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      onOutdent(item.id);
    }

    // Backspace on empty - delete
    if (e.key === "Backspace" && item.content === "") {
      e.preventDefault();
      onDelete(item.id);
    }

    // Cmd+Enter - toggle complete
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      onToggleComplete(item.id);
    }
  };

  // Filter children based on showCompleted
  const visibleChildren = showCompleted
    ? item.children
    : item.children.filter((child) => !child.completed);

  // Hide completed items (with animation)
  const isHidden = item.completed && !showCompleted;
  if (isHidden) {
    return null;
  }

  return (
    <div
      className={`animate-fade-in ${item.completed && !showCompleted ? "fade-out" : ""}`}
      style={{ paddingLeft: depth > 0 ? 24 : 0 }}
    >
      {/* Main item row */}
      <div className="flex items-center gap-2 py-1 group">
        {/* Collapse/expand bullet or just bullet */}
        <button
          onClick={() => hasChildren ? onToggleCollapse(item.id) : onZoom(item.id)}
          onDoubleClick={() => onZoom(item.id)}
          className={`bullet ${hasChildren ? "has-children" : ""} ${
            item.collapsed ? "opacity-50" : ""
          }`}
          title={hasChildren ? (item.collapsed ? "Expand" : "Collapse") : "Zoom in"}
        />

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggleComplete(item.id)}
          className="custom-checkbox"
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={item.content}
          onChange={(e) => onUpdateContent(item.id, e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus(item.id)}
          onBlur={() => onFocus(null)}
          placeholder="Type something..."
          className={`outline-text flex-1 ${item.completed ? "completed" : ""}`}
        />

        {/* New item indicator (blue dot) */}
        {item.isNew && <div className="new-indicator" title="Added by voice" />}

        {/* Hover actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={() => onZoom(item.id)}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
            title="Zoom in"
          >
            ⤢
          </button>
        </div>
      </div>

      {/* Children */}
      {!item.collapsed && visibleChildren.length > 0 && (
        <div className="relative">
          {/* Vertical line connecting children */}
          <div
            className="absolute left-[7px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
            style={{ height: "calc(100% - 12px)" }}
          />
          {visibleChildren.map((child) => (
            <OutlineItem
              key={child.id}
              item={child}
              depth={depth + 1}
              showCompleted={showCompleted}
              focusedId={focusedId}
              onUpdateContent={onUpdateContent}
              onToggleComplete={onToggleComplete}
              onToggleCollapse={onToggleCollapse}
              onAddAfter={onAddAfter}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onDelete={onDelete}
              onFocus={onFocus}
              onZoom={onZoom}
              onMarkSeen={onMarkSeen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

