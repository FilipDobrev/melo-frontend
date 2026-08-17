import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth, useCurrentUser } from '../../auth/AuthContext';
import { errorMessage } from '../../api/client';
import { useRestoreAccount } from '../../api/users';
import { formatDate } from '../../lib/format';
import { Button } from '../../ui/Button';
import { Text } from '../../ui/Text';
import { colors, radius, space } from '../../theme/theme';

/**
 * Mounted unconditionally on the profile and settings screens - it reads its
 * own visibility from the current user so it disappears the instant a
 * restore succeeds, with no local state that could go stale.
 */
export function AccountDeletionBanner(): React.ReactElement | null {
  const currentUser = useCurrentUser();
  const { refreshUser } = useAuth();
  const restoreAccount = useRestoreAccount();

  if (!currentUser || !currentUser.deletionRequestedAt) return null;

  const headline = currentUser.purgeAt
    ? `Your account will be deleted on ${formatDate(currentUser.purgeAt)}.`
    : 'Your account is scheduled for deletion.';

  // mutate rather than mutateAsync: a 409 (already cancelled, or the grace
  // period elapsed) rejects, and there is no caller to catch it here - the
  // rejection would surface as an unhandled promise. mutate routes the same
  // failure into isError, which is what the message below already renders.
  function handleRestore() {
    restoreAccount.mutate(undefined, { onSuccess: () => void refreshUser() });
  }

  return (
    <View style={styles.banner}>
      <Text variant="strong" color="danger">
        {headline}
      </Text>
      <Text variant="bodySm" color="textMuted">
        Until then nobody else can see your profile, posts or recipes. Cancel any time before that date.
      </Text>
      <Button
        title="Keep my account"
        variant="secondary"
        onPress={handleRestore}
        loading={restoreAccount.isPending}
        disabled={restoreAccount.isPending}
      />
      {restoreAccount.isError && (
        <Text variant="bodySm" color="danger">
          {errorMessage(restoreAccount.error)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerTint,
    borderRadius: radius.md,
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: space.md,
    gap: space.sm,
  },
});
