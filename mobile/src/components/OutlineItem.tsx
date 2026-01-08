import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { OutlineItem as OutlineItemType } from "../types";

interface OutlineItemProps {
  item: OutlineItemType;
  depth: number;
  showCompleted: boolean;
  onUpdateContent: (id: string, content: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onZoom: (id: string) => void;
  onMarkSeen: (id: string) => void;
}

export function OutlineItemComponent({
  item,
  depth,
  showCompleted,
  onUpdateContent,
  onToggleComplete,
  onToggleCollapse,
  onZoom,
  onMarkSeen,
}: OutlineItemProps) {
  const hasChildren = item.children.length > 0;

  const visibleChildren = showCompleted
    ? item.children
    : item.children.filter((child) => !child.completed);

  if (item.completed && !showCompleted) {
    return null;
  }

  return (
    <View style={[styles.container, { marginLeft: depth * 20 }]}>
      <View style={styles.row}>
        {/* Bullet / Collapse button */}
        <TouchableOpacity
          onPress={() => hasChildren ? onToggleCollapse(item.id) : onZoom(item.id)}
          onLongPress={() => onZoom(item.id)}
          style={styles.bulletContainer}
        >
          <View
            style={[
              styles.bullet,
              hasChildren && styles.bulletHollow,
              item.collapsed && styles.bulletCollapsed,
            ]}
          />
        </TouchableOpacity>

        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggleComplete(item.id)}
          style={styles.checkbox}
        >
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          value={item.content}
          onChangeText={(text) => onUpdateContent(item.id, text)}
          onFocus={() => item.isNew && onMarkSeen(item.id)}
          placeholder="Type something..."
          placeholderTextColor="#9CA3AF"
          style={[
            styles.textInput,
            item.completed && styles.textCompleted,
          ]}
        />

        {/* New indicator */}
        {item.isNew && <View style={styles.newIndicator} />}
      </View>

      {/* Children */}
      {!item.collapsed && visibleChildren.length > 0 && (
        <View style={styles.childrenContainer}>
          <View style={styles.verticalLine} />
          {visibleChildren.map((child) => (
            <OutlineItemComponent
              key={child.id}
              item={child}
              depth={depth + 1}
              showCompleted={showCompleted}
              onUpdateContent={onUpdateContent}
              onToggleComplete={onToggleComplete}
              onToggleCollapse={onToggleCollapse}
              onZoom={onZoom}
              onMarkSeen={onMarkSeen}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  bulletContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1a1a1a",
  },
  bulletHollow: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#1a1a1a",
  },
  bulletCollapsed: {
    opacity: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#6B7280",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    paddingVertical: 0,
  },
  textCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  childrenContainer: {
    position: "relative",
  },
  verticalLine: {
    position: "absolute",
    left: 9,
    top: 0,
    bottom: 10,
    width: 1,
    backgroundColor: "#E5E7EB",
  },
});

