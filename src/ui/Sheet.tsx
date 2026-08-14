import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  heightRatio?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const IN_DURATION = 240;
const OUT_DURATION = 180;

export function Sheet({
  visible,
  onClose,
  title,
  heightRatio = 0.85,
  children,
  footer,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const clampedRatio = Math.min(0.95, Math.max(0.3, heightRatio));
  const sheetHeight = useMemo(
    () => Dimensions.get('window').height * clampedRatio,
    [clampedRatio],
  );

  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
    });
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const duration = reduceMotionRef.current ? 0 : IN_DURATION;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else if (mounted) {
      const duration = reduceMotionRef.current ? 0 : OUT_DURATION;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeight,
          duration,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        // A finished check protects against a stuck sheet if this run was
        // interrupted by a new "visible" toggle before it completed.
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dy > 6 && gesture.dy > Math.abs(gesture.dx),
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const shouldDismiss = gesture.dy > sheetHeight * 0.25 || gesture.vy > 0.8;
        if (shouldDismiss) {
          onClose();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close"
          onPress={onClose}
        >
          <Animated.View
            style={[styles.scrim, { opacity: scrimOpacity }]}
          />
        </Pressable>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoider}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}
          >
            {title && (
              <View {...panResponder.panHandlers}>
                <View style={styles.grabberRow}>
                  <View style={styles.grabber} />
                </View>
                <View style={styles.titleRow}>
                  <Text variant="displayMd" style={styles.titleText} numberOfLines={1}>
                    {title}
                  </Text>
                  <IconButton name="x" onPress={onClose} label="Close" />
                </View>
              </View>
            )}
            {!title && (
              <View {...panResponder.panHandlers} style={styles.grabberRow}>
                <View style={styles.grabber} />
              </View>
            )}
            <View style={styles.content}>{children}</View>
            {footer && (
              <View style={[styles.footer, { paddingBottom: insets.bottom || space.md }]}>
                {footer}
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  keyboardAvoider: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  grabberRow: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.lineStrong,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  titleText: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
