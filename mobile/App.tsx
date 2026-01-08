import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useOutlineStore } from "./src/store/useOutlineStore";
import { OutlineItemComponent } from "./src/components/OutlineItem";
import { Header } from "./src/components/Header";
import { findItem } from "./src/types";

export default function App() {
  const {
    state,
    isLoading,
    isConnected,
    updateContent,
    toggleComplete,
    toggleCollapse,
    zoomTo,
    toggleShowCompleted,
    markSeen,
  } = useOutlineStore();

  // Get items to display (respecting zoom)
  const displayItems = state.zoomedId
    ? (() => {
        const zoomedItem = findItem(state.items, state.zoomedId);
        return zoomedItem ? zoomedItem.children : state.items;
      })()
    : state.items;

  // Filter by completed
  const filteredItems = state.showCompleted
    ? displayItems
    : displayItems.filter((item) => !item.completed);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your todos...</Text>
      </SafeAreaView>
    );
  }

  const zoomedItem = state.zoomedId
    ? findItem(state.items, state.zoomedId)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        items={state.items}
        zoomedId={state.zoomedId}
        showCompleted={state.showCompleted}
        isConnected={isConnected}
        onZoom={zoomTo}
        onToggleShowCompleted={toggleShowCompleted}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Zoomed item title */}
        {zoomedItem && (
          <View style={styles.zoomedHeader}>
            <TouchableOpacity
              onPress={() => toggleComplete(zoomedItem.id)}
              style={[
                styles.zoomedCheckbox,
                zoomedItem.completed && styles.zoomedCheckboxChecked,
              ]}
            >
              {zoomedItem.completed && (
                <Text style={styles.zoomedCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
            <Text
              style={[
                styles.zoomedTitle,
                zoomedItem.completed && styles.zoomedTitleCompleted,
              ]}
            >
              {zoomedItem.content || "Untitled"}
            </Text>
          </View>
        )}

        {/* Items list */}
        {filteredItems.map((item) => (
          <OutlineItemComponent
            key={item.id}
            item={item}
            depth={0}
            showCompleted={state.showCompleted}
            onUpdateContent={updateContent}
            onToggleComplete={toggleComplete}
            onToggleCollapse={toggleCollapse}
            onZoom={zoomTo}
            onMarkSeen={markSeen}
          />
        ))}

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  zoomedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  zoomedCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#6B7280",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedCheckboxChecked: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  zoomedCheckmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  zoomedTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  zoomedTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
});
