import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Platform,
  Dimensions,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";

export type TabKey = "home" | "transactions" | "analytics" | "categories";

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { key: "home", label: "Beranda", icon: "home-outline", iconActive: "home" },
  {
    key: "transactions",
    label: "Transaksi",
    icon: "receipt-outline",
    iconActive: "receipt",
  },
  {
    key: "analytics",
    label: "Statistik",
    icon: "pie-chart-outline",
    iconActive: "pie-chart",
  },
  {
    key: "categories",
    label: "Kategori",
    icon: "grid-outline",
    iconActive: "grid",
  },
];

interface LiquidGlassTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  onAddPress?: () => void;
  bottomInset: number;
}

export const LiquidGlassTabBar: React.FC<LiquidGlassTabBarProps> = ({
  activeTab,
  onTabPress,
  bottomInset,
}) => {
  const { isDark } = useTheme();
  const screenW = Dimensions.get("window").width;
  const initialBarWidth = screenW - 28;
  const [barWidth, setBarWidth] = useState<number>(initialBarWidth);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Tab indices: home=0, transactions=1, analytics=2, categories=3
  const tabIndexMap: Record<TabKey, number> = {
    home: 0,
    transactions: 1,
    analytics: 2,
    categories: 3,
  };

  const activeIndex = tabIndexMap[activeTab] ?? 0;

  // Keep live references to active state so PanResponder closures never get stale
  const activeTabRef = useRef<TabKey>(activeTab);
  activeTabRef.current = activeTab;

  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  // Dimensions: Glass fits neatly inside the 60px bar at rest (height: 50, top: 5)
  const paddingH = 6;
  const numTabs = TABS.length;
  const usableWidth = barWidth - paddingH * 2;
  const tabWidth = usableWidth / numTabs;
  const bubbleWidth = tabWidth;

  const getPositionForIndex = (index: number) => {
    return paddingH + index * tabWidth;
  };

  // Animation values initialized at current active tab position
  const initialBubbleX = getPositionForIndex(activeIndex);
  const bubbleX = useRef(new Animated.Value(initialBubbleX)).current;
  const bubbleScaleX = useRef(new Animated.Value(1)).current;
  const bubbleScaleY = useRef(new Animated.Value(1)).current;

  // Menu bar dock animation values (ikut membesar dikit saat ditekan)
  const dockScaleX = useRef(new Animated.Value(1)).current;
  const dockScaleY = useRef(new Animated.Value(1)).current;

  // Soft gray overlay opacity: visible only when idle at rest (fades out when pressed/dragged)
  const bubbleGrayOpacity = useRef(new Animated.Value(1)).current;

  // White glass opacity: visible ONLY when held or dragged (kembali menjadi putih kaca)
  const bubbleWhiteOpacity = useRef(new Animated.Value(0)).current;

  // Track real-time animated position
  const currentXRef = useRef<number>(initialBubbleX);
  useEffect(() => {
    const listenerId = bubbleX.addListener(({ value }) => {
      currentXRef.current = value;
    });
    return () => {
      bubbleX.removeListener(listenerId);
    };
  }, [bubbleX]);

  // Smooth slide spring animation with gentle settling
  const animateToTab = (index: number) => {
    const targetX = getPositionForIndex(index);

    Animated.parallel([
      Animated.spring(bubbleX, {
        toValue: targetX,
        damping: 18,
        stiffness: 190,
        mass: 0.8,
        useNativeDriver: false,
      }),
      Animated.spring(dockScaleX, {
        toValue: 1,
        damping: 15,
        stiffness: 220,
        useNativeDriver: false,
      }),
      Animated.spring(dockScaleY, {
        toValue: 1,
        damping: 15,
        stiffness: 220,
        useNativeDriver: false,
      }),
      Animated.spring(bubbleScaleX, {
        toValue: 1,
        damping: 15,
        stiffness: 220,
        useNativeDriver: false,
      }),
      Animated.spring(bubbleScaleY, {
        toValue: 1,
        damping: 15,
        stiffness: 220,
        useNativeDriver: false,
      }),
      Animated.timing(bubbleGrayOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(bubbleWhiteOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Wobble animation when tapping already active tab
  const jiggleBubble = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(dockScaleY, {
          toValue: 1.03,
          duration: 60,
          useNativeDriver: false,
        }),
        Animated.spring(dockScaleY, {
          toValue: 1,
          damping: 12,
          stiffness: 280,
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bubbleScaleX, {
          toValue: 1.15,
          duration: 70,
          useNativeDriver: false,
        }),
        Animated.spring(bubbleScaleX, {
          toValue: 1,
          damping: 12,
          stiffness: 280,
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bubbleScaleY, {
          toValue: 1.18,
          duration: 70,
          useNativeDriver: false,
        }),
        Animated.spring(bubbleScaleY, {
          toValue: 1,
          damping: 12,
          stiffness: 280,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  // Sync animation when activeTab prop changes
  useEffect(() => {
    animateToTab(activeIndex);
  }, [activeTab, barWidth]);

  // Accurate tab index detector using screen coordinate
  const getTabIndexFromEvent = (
    evt: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    const pageX =
      evt.nativeEvent.pageX || touchStartPageXRef.current || gestureState.x0;
    if (pageX !== undefined && pageX > 0) {
      const barX = (screenW - barWidth) / 2;
      const relativeX = pageX - barX - paddingH;
      const raw = Math.floor(relativeX / tabWidth);
      return Math.max(0, Math.min(numTabs - 1, raw));
    }
    const locX = evt.nativeEvent.locationX;
    if (locX !== undefined && locX >= 0) {
      const raw = Math.floor((locX - paddingH) / tabWidth);
      return Math.max(0, Math.min(numTabs - 1, raw));
    }
    return activeIndexRef.current;
  };

  // Gesture Tracking Refs
  const touchStartPageXRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const panStartBubbleX = useRef<number>(initialBubbleX);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        const pageX = evt.nativeEvent.pageX || gestureState.x0;
        touchStartPageXRef.current = pageX;
        touchStartTimeRef.current = Date.now();
        panStartBubbleX.current = currentXRef.current;
        isDraggingRef.current = false;

        // Initialize hover highlight to current bubble location
        const currentBubbleTab = Math.max(
          0,
          Math.min(
            numTabs - 1,
            Math.round(
              (currentXRef.current - getPositionForIndex(0)) / tabWidth,
            ),
          ),
        );
        setHoverIndex(currentBubbleTab);

        // ========================================================
        // SWELL ANIMATION:
        // 1. Menu bar dock expands slightly (ikut membesar dikit)
        // 2. Glass bubble expands more (convex lens, larger than dock)
        // ========================================================
        Animated.parallel([
          Animated.spring(dockScaleX, {
            toValue: 1.025,
            damping: 14,
            stiffness: 240,
            useNativeDriver: false,
          }),
          Animated.spring(dockScaleY, {
            toValue: 1.055,
            damping: 14,
            stiffness: 240,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleX, {
            toValue: 1.18,
            damping: 12,
            stiffness: 260,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 1.26,
            damping: 12,
            stiffness: 260,
            useNativeDriver: false,
          }),
          // Fade out gray overlay when pressed/dragged
          Animated.timing(bubbleGrayOpacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
          }),
          // Turn back into glowing white glass (putih kaca) when held or dragged
          Animated.timing(bubbleWhiteOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
        ]).start();
      },

      onPanResponderMove: (evt, gestureState) => {
        const dx = gestureState.dx;

        // Transition from tap to drag once moved > 6px
        if (!isDraggingRef.current && Math.abs(dx) > 6) {
          isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
          const minX = getPositionForIndex(0);
          const maxX = getPositionForIndex(numTabs - 1);
          const rawX = panStartBubbleX.current + dx;
          // Rubber-band resistance at edges
          const clampedX = Math.max(minX - 8, Math.min(maxX + 8, rawX));

          bubbleX.setValue(clampedX);

          // Only the tab under the glass lens gets hover highlight (turns black)
          const baseOffset = getPositionForIndex(0);
          const hoverIdx = Math.max(
            0,
            Math.min(
              numTabs - 1,
              Math.round((clampedX - baseOffset) / tabWidth),
            ),
          );
          setHoverIndex(hoverIdx);
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        const elapsed = Date.now() - touchStartTimeRef.current;
        const totalDx = Math.abs(gestureState.dx);
        const wasDragging = isDraggingRef.current;

        setHoverIndex(null);

        // ========================================================
        // RETURN TO ORIGINAL SIZE (Dock bar & bubble spring back)
        // ========================================================
        Animated.parallel([
          Animated.spring(dockScaleX, {
            toValue: 1,
            damping: 15,
            stiffness: 220,
            useNativeDriver: false,
          }),
          Animated.spring(dockScaleY, {
            toValue: 1,
            damping: 15,
            stiffness: 220,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleX, {
            toValue: 1,
            damping: 14,
            stiffness: 220,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 1,
            damping: 14,
            stiffness: 220,
            useNativeDriver: false,
          }),
          // Restore soft gray color when released/settled
          Animated.timing(bubbleGrayOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }),
          // Hide white glass glare & border when released
          Animated.timing(bubbleWhiteOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start();

        if (!wasDragging && totalDx < 10 && elapsed < 600) {
          // ==========================================
          // 1. TAP / CLICK EVENT:
          // Immediately slide glass to destination menu
          // ==========================================
          const tappedIndex = getTabIndexFromEvent(evt, gestureState);
          const targetTab = TABS[tappedIndex];

          if (targetTab) {
            if (targetTab.key !== activeTabRef.current) {
              onTabPress(targetTab.key);
              animateToTab(tappedIndex);
            } else {
              jiggleBubble();
            }
          }
        } else {
          // ==========================================
          // 2. DRAG / SLIDE EVENT:
          // Snap glass to closest or swiped menu
          // ==========================================
          let targetIndex: number;

          if (Math.abs(gestureState.vx) > 0.35) {
            // Velocity flick
            if (gestureState.vx > 0) {
              targetIndex = Math.min(numTabs - 1, activeIndexRef.current + 1);
            } else {
              targetIndex = Math.max(0, activeIndexRef.current - 1);
            }
          } else {
            // Positional snap
            const baseOffset = getPositionForIndex(0);
            const rawIdx = Math.round(
              (currentXRef.current - baseOffset) / tabWidth,
            );
            targetIndex = Math.max(0, Math.min(numTabs - 1, rawIdx));
          }

          const targetTab = TABS[targetIndex];
          if (targetTab) {
            if (targetTab.key !== activeTabRef.current) {
              onTabPress(targetTab.key);
            }
            animateToTab(targetIndex);
          } else {
            animateToTab(activeIndexRef.current);
          }
        }
      },

      onPanResponderTerminate: () => {
        setHoverIndex(null);
        Animated.parallel([
          Animated.spring(dockScaleX, {
            toValue: 1,
            damping: 15,
            stiffness: 220,
            useNativeDriver: false,
          }),
          Animated.spring(dockScaleY, {
            toValue: 1,
            damping: 15,
            stiffness: 220,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleX, {
            toValue: 1,
            damping: 14,
            stiffness: 220,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 1,
            damping: 14,
            stiffness: 220,
            useNativeDriver: false,
          }),
          // Restore soft gray color when released/settled
          Animated.timing(bubbleGrayOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }),
          // Hide white glass glare & border when released
          Animated.timing(bubbleWhiteOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start();
        animateToTab(activeIndexRef.current);
      },
    }),
  ).current;

  const handleBarLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - barWidth) > 1) {
      setBarWidth(width);
    }
  };

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(bottomInset, 12) }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.dockBar,
          {
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.16)"
              : "rgba(255, 255, 255, 0.65)",
            shadowColor: isDark ? "#000000" : "#0F172A",
            transform: [{ scaleX: dockScaleX }, { scaleY: dockScaleY }],
          },
        ]}
        onLayout={handleBarLayout}
        {...panResponder.panHandlers}
      >
        {/* Frosted Glass Backdrop for the main dock (rounded capsule pill, semi-transparent) */}
        <BlurView
          intensity={Platform.OS === "ios" ? (isDark ? 65 : 55) : 70}
          tint={isDark ? "dark" : "light"}
          style={[StyleSheet.absoluteFill, styles.dockRoundedBackdrop]}
        />

        {/* Ambient translucent glass wash */}
        <View
          style={[
            styles.dockInnerWash,
            isDark && {
              backgroundColor:
                Platform.OS === "ios"
                  ? "rgba(19, 27, 42, 0.72)"
                  : "rgba(15, 23, 42, 0.90)",
            },
          ]}
        />

        {/* ==================================================== */}
        {/* LIQUID GLASS BUBBLE (Convex mirror swell on touch)   */}
        {/* ==================================================== */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.liquidGlassBubble,
            {
              shadowColor: isDark ? "#000000" : "#0F172A",
              width: bubbleWidth,
              transform: [
                { translateX: bubbleX },
                { scaleX: bubbleScaleX },
                { scaleY: bubbleScaleY },
              ],
            },
          ]}
        >
          {/* Liquid Glass Shell */}
          <View style={styles.bubbleGlassShell}>
            <BlurView
              intensity={Platform.OS === "ios" ? 45 : 65}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />

            {/* 1. SOFT GRAY OVERLAY (Resting state - Full coverage, no white anywhere) */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.bubbleGrayOverlay,
                isDark && {
                  backgroundColor:
                    Platform.OS === "ios"
                      ? "rgba(255, 255, 255, 0.18)"
                      : "rgba(255, 255, 255, 0.22)",
                },
                { opacity: bubbleGrayOpacity },
              ]}
            />

            {/* 2. WHITE GLASS LAYER (Held / Dragging state - Kembali menjadi Putih Kaca) */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.bubbleWhiteGlassLayer,
                { opacity: bubbleWhiteOpacity },
              ]}
            >
              {/* White frosted glass wash */}
              <View
                style={[
                  styles.bubbleWhiteWash,
                  isDark && { backgroundColor: "rgba(255, 255, 255, 0.08)" },
                ]}
              />

              {/* White glass border around bubble (only when held or dragged) */}
              <View
                style={[
                  styles.bubbleWhiteBorder,
                  isDark && { borderColor: "rgba(255, 255, 255, 0.15)" },
                ]}
              />
            </Animated.View>
          </View>
        </Animated.View>

        {/* ==================================================== */}
        {/* TAB BUTTONS (Beranda, Transaksi, Statistik, Kategori) */}
        {/* ==================================================== */}
        <View style={styles.tabsRow} pointerEvents="none">
          {TABS.map((item, index) => {
            // Menu yang berwarna AKTIF HANYA yang sedang disorot/dilingkupi oleh kaca.
            const isHighlightedByGlass =
              hoverIndex !== null
                ? hoverIndex === index
                : activeIndex === index;

            const activeColor = isDark ? "#FFFFFF" : "#000000";
            const inactiveColor = isDark ? "#94A3B8" : "rgba(0, 0, 0, 0.50)";

            return (
              <View key={item.key} style={styles.tabButton}>
                <View
                  style={
                    isHighlightedByGlass
                      ? styles.tabIconWrapActive
                      : styles.tabIconWrap
                  }
                >
                  <Ionicons
                    name={isHighlightedByGlass ? item.iconActive : item.icon}
                    size={22}
                    color={isHighlightedByGlass ? activeColor : inactiveColor}
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isHighlightedByGlass && styles.tabLabelActive,
                    {
                      color: isHighlightedByGlass ? activeColor : inactiveColor,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    alignItems: "center",
    zIndex: 999,
  },
  dockBar: {
    width: "100%",
    height: 60,
    borderRadius: 30, // Perfectly rounded menubar
    overflow: "visible", // Allows convex mirror swell to expand outside on touch/drag
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  dockRoundedBackdrop: {
    borderRadius: 30,
    overflow: "hidden",
  },
  dockInnerWash: {
    ...StyleSheet.absoluteFill,
    borderRadius: 30,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 255, 255, 0.24)"
        : "rgba(255, 255, 255, 0.52)",
    overflow: "hidden",
  },

  /* ==================================================== */
  /* LIQUID GLASS BUBBLE STYLES (Convex Mirror Lens)      */
  /* ==================================================== */
  liquidGlassBubble: {
    position: "absolute",
    top: 5, // 5px from top
    height: 50, // Resting height: 50px inside 60px bar -> does not exceed menu bar!
    borderRadius: 25,
    zIndex: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleGlassShell: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 0, // No white border when resting
  },
  bubbleGrayOverlay: {
    borderRadius: 25,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(210, 218, 228, 0.60)" // Sedikit lebih gelap & berbobot, tetap bersih
        : "rgba(210, 218, 228, 0.70)",
  },
  bubbleWhiteGlassLayer: {
    ...StyleSheet.absoluteFill,
    borderRadius: 25,
    overflow: "hidden",
  },
  bubbleWhiteWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 255, 255, 0.38)"
        : "rgba(255, 255, 255, 0.6)",
  },
  bubbleSpecularGlare: {
    position: "absolute",
    top: 2,
    left: "10%",
    right: "10%",
    height: 16,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
  },
  bubbleWhiteBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 25,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },

  /* ==================================================== */
  /* TAB ITEMS ROW                                        */
  /* ==================================================== */
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: 6,
    zIndex: 3, // Above the glass bubble
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabIconWrap: {
    transform: [{ scale: 1 }],
  },
  tabIconWrapActive: {
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: "400", // Tidak tebal pada menu tidak aktif
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: "800", // Tebal pada menu aktif
  },
});
