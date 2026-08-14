import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';
import { MAX_CONTENT_WIDTH } from '../theme/layout';

interface ScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], style }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.page}>
      {/*
        No Platform.OS === 'web' branch here: on a phone the window is already
        narrower than MAX_CONTENT_WIDTH so the cap is inert, and a tablet
        benefits from the same centred column. One code path for every platform.
      */}
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /** Fills the viewport so the ground colour reaches the window edges. */
  page: {
    flex: 1,
    backgroundColor: colors.ground,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
});
