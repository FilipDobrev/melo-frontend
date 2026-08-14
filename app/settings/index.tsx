import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { API_URL } from '../../src/api/client';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { Text } from '../../src/ui/Text';
import { colors, space } from '../../src/theme/theme';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [isLogoutOpen, setLogoutOpen] = useState(false);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        style={styles.row}
        onPress={() => router.push('/settings/profile')}
      >
        <Feather name="user" size={18} color={colors.text} />
        <Text variant="body" style={styles.rowLabel}>
          Edit profile
        </Text>
        <Feather name="chevron-right" size={18} color={colors.textFaint} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={styles.row}
        onPress={() => setLogoutOpen(true)}
      >
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text variant="body" color="danger" style={styles.rowLabel}>
          Log out
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <Text variant="readoutSm" color="textFaint" align="center">
          {API_URL}
        </Text>
      </View>

      <ConfirmDialog
        visible={isLogoutOpen}
        title="Log out?"
        confirmLabel="Log out"
        destructive
        onConfirm={() => {
          setLogoutOpen(false);
          void signOut();
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: space.lg,
    gap: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: space.xl,
  },
});
