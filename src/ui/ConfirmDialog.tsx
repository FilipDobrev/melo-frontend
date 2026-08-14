import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, space } from '../theme/theme';
import { Button } from './Button';
import { Text } from './Text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={styles.backdrop}
        accessibilityLabel="Close"
        onPress={onCancel}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text variant="displayMd">{title}</Text>
          {body && (
            <Text variant="body" color="textMuted" style={styles.body}>
              {body}
            </Text>
          )}
          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onCancel} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    ...shadow.float,
  },
  body: {
    marginTop: space.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
    marginTop: space.xl,
  },
});
