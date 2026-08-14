import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme/theme';
import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Feather.glyphMap;
}

export function EmptyState({ title, body, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <Feather name={icon} size={28} color={colors.textFaint} />}
      <Text variant="displayMd" align="center">
        {title}
      </Text>
      {body && (
        <Text variant="body" color="textMuted" align="center">
          {body}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="secondary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
    gap: space.md,
  },
});
