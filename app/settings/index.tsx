import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { API_URL, ApiError, errorMessage } from '../../src/api/client';
import { fetchMyDataExport } from '../../src/api/users';
import { AccountDeletionBanner } from '../../src/features/users/AccountDeletionBanner';
import { saveDataExport } from '../../src/lib/export';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { Text } from '../../src/ui/Text';
import { colors, space } from '../../src/theme/theme';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const [isExporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const doc = await fetchMyDataExport();
      await saveDataExport(doc);
    } catch (error) {
      // The endpoint is capped at 3 requests/hour (API.md), far tighter than
      // the "wait a moment" 429 message errorMessage() gives every other
      // caller, so this screen needs its own wording for it.
      if (error instanceof ApiError && error.status === 429) {
        setExportError('You can export your data 3 times an hour. Try again later.');
      } else {
        setExportError(errorMessage(error));
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />

      {/* Mounted per-screen (also on the profile tab) rather than above the
          tab navigator, so it stays inside each screen's safe-area wrapper. */}
      <AccountDeletionBanner />

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
        accessibilityLabel={isExporting ? 'Preparing your data' : 'Download my data'}
        accessibilityState={{ disabled: isExporting }}
        style={styles.row}
        onPress={handleExport}
        disabled={isExporting}
      >
        <Feather name="download" size={18} color={colors.text} />
        <Text variant="body" style={styles.rowLabel}>
          {isExporting ? 'Preparing your data…' : 'Download my data'}
        </Text>
      </Pressable>
      {exportError && (
        <Text variant="bodySm" color="danger" style={styles.exportError}>
          {exportError}
        </Text>
      )}

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete account"
        style={styles.row}
        onPress={() => router.push('/settings/delete-account')}
      >
        <Feather name="trash-2" size={18} color={colors.danger} />
        <Text variant="body" color="danger" style={styles.rowLabel}>
          Delete account
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
  exportError: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: space.xl,
  },
});
