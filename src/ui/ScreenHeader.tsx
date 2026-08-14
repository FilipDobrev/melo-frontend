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
    <View style={[styles.row, subtitle && styles.rowWithSubtitle]}>
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
  rowWithSubtitle: {
    paddingVertical: space.sm,
  },
  titleColumn: {
    flex: 1,
  },
});
