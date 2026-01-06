"use client";

import { useState, useCallback } from "react";
import { OutlineItem, getPath, flattenItems } from "@/types";

interface HeaderProps {
  items: OutlineItem[];
  zoomedId: string | null;
  showCompleted: boolean;
  onZoom: (id: string | null) => void;
  onToggleShowCompleted: () => void;
  onSearch: (query: string) => void;
}

export function Header({
  items,
  zoomedId,
  showCompleted,
  onZoom,
  onToggleShowCompleted,
  onSearch,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OutlineItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Get breadcrumb path when zoomed
  const breadcrumbs = zoomedId ? getPath(items, zoomedId) : [];

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearch(query);

      if (query.trim()) {
        const allItems = flattenItems(items);
        const results = allItems.filter((item) =>
          item.content.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results.slice(0, 10)); // Limit to 10 results
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    },
    [items, onSearch]
  );

  // Navigate to search result
  const handleResultClick = (item: OutlineItem) => {
    // Find the top-level parent to zoom to
    const path = getPath(items, item.id);
    if (path.length > 0) {
      onZoom(path[0].id);
    }
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-10">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Home button + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Home button */}
            <button
              onClick={() => onZoom(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Home"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </button>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="breadcrumb overflow-hidden">
                <span className="text-gray-300">/</span>
                {breadcrumbs.map((item, index) => (
                  <span key={item.id} className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => onZoom(item.id)}
                      className={`breadcrumb-item truncate ${
                        index === breadcrumbs.length - 1
                          ? "text-gray-900 dark:text-white font-medium"
                          : ""
                      }`}
                    >
                      {item.content || "Untitled"}
                    </button>
                    {index < breadcrumbs.length - 1 && (
                      <span className="text-gray-300">/</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right side: Search + Toggle */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Search..."
                className="search-input w-48 pl-9"
              />

              {/* Search results dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                    >
                      {result.content}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Show completed toggle */}
            <button
              onClick={onToggleShowCompleted}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showCompleted
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="hidden sm:inline">Show completed</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

