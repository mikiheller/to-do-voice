"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { OutlineItem } from "@/components/OutlineItem";
import { useOutlineStore } from "@/store/useOutlineStore";
import { findItem, createItem } from "@/types";

export default function Home() {
  const {
    state,
    updateContent,
    toggleComplete,
    toggleCollapse,
    addItemAfter,
    indentItem,
    outdentItem,
    deleteItem,
    setFocused,
    zoomTo,
    toggleShowCompleted,
    markSeen,
  } = useOutlineStore();

  const [searchQuery, setSearchQuery] = useState("");

  // Get the items to display (respecting zoom)
  const displayItems = state.zoomedId
    ? (() => {
        const zoomedItem = findItem(state.items, state.zoomedId);
        return zoomedItem ? zoomedItem.children : state.items;
      })()
    : state.items;

  // Filter items by search query
  const filteredItems = searchQuery
    ? displayItems.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayItems;

  // Add new root item
  const handleAddRoot = () => {
    const lastItem = filteredItems[filteredItems.length - 1];
    if (lastItem) {
      addItemAfter(lastItem.id);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        items={state.items}
        zoomedId={state.zoomedId}
        showCompleted={state.showCompleted}
        onZoom={zoomTo}
        onToggleShowCompleted={toggleShowCompleted}
        onSearch={setSearchQuery}
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Zoomed item title */}
        {state.zoomedId && (() => {
          const zoomedItem = findItem(state.items, state.zoomedId);
          return zoomedItem ? (
            <h1 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <input
                type="checkbox"
                checked={zoomedItem.completed}
                onChange={() => toggleComplete(zoomedItem.id)}
                className="custom-checkbox"
                style={{ width: 20, height: 20 }}
              />
              <span className={zoomedItem.completed ? "line-through text-gray-400" : ""}>
                {zoomedItem.content || "Untitled"}
              </span>
            </h1>
          ) : null;
        })()}

        {/* Outline items */}
        <div className="space-y-0">
          {filteredItems.map((item) => (
            <OutlineItem
              key={item.id}
              item={item}
              depth={0}
              showCompleted={state.showCompleted}
              focusedId={state.focusedId}
              onUpdateContent={updateContent}
              onToggleComplete={toggleComplete}
              onToggleCollapse={toggleCollapse}
              onAddAfter={addItemAfter}
              onIndent={indentItem}
              onOutdent={outdentItem}
              onDelete={deleteItem}
              onFocus={setFocused}
              onZoom={zoomTo}
              onMarkSeen={markSeen}
            />
          ))}
        </div>

        {/* Add new item button */}
        {filteredItems.length === 0 && (
          <button
            onClick={handleAddRoot}
            className="text-gray-400 hover:text-gray-600 text-sm py-4"
          >
            + Add item
          </button>
        )}

        {/* Keyboard shortcuts help */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              Keyboard shortcuts
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-2 max-w-md">
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                Enter
              </span>
              <span>New item</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                Tab
              </span>
              <span>Indent</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                Shift+Tab
              </span>
              <span>Outdent</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                ⌘+Enter
              </span>
              <span>Toggle complete</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                Backspace
              </span>
              <span>Delete empty item</span>
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}

