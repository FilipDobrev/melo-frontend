import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
}

export function ScreenHeader({ title, onBack, right, subtitle }: ScreenHeaderProps) {
  return (
    <View style={[styles.row, onBack && styles.rowWithBack, subtitle && styles.rowWithSubtitle]}>
      {onBack && <IconButton name="chevron-left" onPress={onBack} label="Go back" />}
      <View style={styles.titleColumn}>
        {title && (
          <Text variant="displayMd" numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="bodySm" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: space.lg,
    backgroundColor: colors.ground,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  /**
   * IconButton centres its glyph in a 40px touch box, so it already carries
   * roughly 9px of padding of its own. Left at the full space.lg the chevron
   * lands about 25px in and reads as floating off the corner, out of line with
   * every other screen edge. Giving that padding back puts the glyph on the
   * same margin as the content beneath it.
   */
  rowWithBack: {
    paddingLeft: space.sm,
  },
  rowWithSubtitle: {
    paddingVertical: space.sm,
  },
  titleColumn: {
    flex: 1,
  },
});
