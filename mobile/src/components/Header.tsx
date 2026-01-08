import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { OutlineItem, getPath } from "../types";

interface HeaderProps {
  items: OutlineItem[];
  zoomedId: string | null;
  showCompleted: boolean;
  isConnected: boolean;
  onZoom: (id: string | null) => void;
  onToggleShowCompleted: () => void;
}

export function Header({
  items,
  zoomedId,
  showCompleted,
  isConnected,
  onZoom,
  onToggleShowCompleted,
}: HeaderProps) {
  const breadcrumbs = zoomedId ? getPath(items, zoomedId) : [];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Home button */}
        <TouchableOpacity onPress={() => onZoom(null)} style={styles.homeButton}>
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <View style={styles.breadcrumbs}>
            <Text style={styles.separator}>/</Text>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity onPress={() => onZoom(item.id)}>
                  <Text
                    style={[
                      styles.breadcrumbText,
                      index === breadcrumbs.length - 1 && styles.breadcrumbActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.content || "Untitled"}
                  </Text>
                </TouchableOpacity>
                {index < breadcrumbs.length - 1 && (
                  <Text style={styles.separator}>/</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Show completed toggle */}
        <TouchableOpacity
          onPress={onToggleShowCompleted}
          style={[
            styles.toggleButton,
            showCompleted && styles.toggleButtonActive,
          ]}
        >
          <Text style={styles.toggleIcon}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* Connection status */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            isConnected ? styles.statusConnected : styles.statusDisconnected,
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? "Synced" : "Connecting..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  homeButton: {
    padding: 4,
  },
  homeIcon: {
    fontSize: 20,
  },
  breadcrumbs: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  separator: {
    color: "#D1D5DB",
    fontSize: 14,
  },
  breadcrumbText: {
    color: "#6B7280",
    fontSize: 14,
    maxWidth: 120,
  },
  breadcrumbActive: {
    color: "#1a1a1a",
    fontWeight: "600",
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  toggleButtonActive: {
    backgroundColor: "#E5E7EB",
  },
  toggleIcon: {
    fontSize: 16,
    color: "#6B7280",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusConnected: {
    backgroundColor: "#22C55E",
  },
  statusDisconnected: {
    backgroundColor: "#EAB308",
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
  },
});

