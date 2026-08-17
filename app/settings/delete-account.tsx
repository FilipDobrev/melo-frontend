import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { errorMessage } from '../../src/api/client';
import { useRequestAccountDeletion } from '../../src/api/users';
import { Button } from '../../src/ui/Button';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';
import { Field } from '../../src/ui/Field';
import { IconButton } from '../../src/ui/IconButton';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { Text } from '../../src/ui/Text';
import { space } from '../../src/theme/theme';

export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const requestAccountDeletion = useRequestAccountDeletion();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const isSubmitting = requestAccountDeletion.isPending;

  async function handleConfirm() {
    setConfirmOpen(false);
    setServerError(undefined);
    try {
      await requestAccountDeletion.mutateAsync(password);
      // The server has already revoked every refresh token as part of the
      // deletion request, so the one stored on this device is dead. Signing
      // out locally clears it before the app can try (and silently fail) to
      // renew the session on the next refresh. The root layout's redirect
      // handles navigation once the session clears, so no router call here.
      await signOut();
    } catch (error) {
      setServerError(errorMessage(error));
    }
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Delete account" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="displayMd">Delete your account?</Text>
        <Text variant="body" color="textMuted">
          Your profile, posts and recipes disappear for everyone else straight away. You have 30 days
          to change your mind — log back in and cancel. After that everything is deleted for good.
        </Text>

        <View style={styles.section}>
          <Text variant="label" color="textMuted">
            WHAT STAYS
          </Text>
          <Text variant="bodySm" color="textMuted">
            Recipes other people have already posted about are kept, without your name on them, so
            their posts don't break.
          </Text>
        </View>

        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          textContentType="password"
          hint="We ask again because a signed-in session alone shouldn't be able to delete your account."
          rightSlot={
            <IconButton
              name={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword((prev) => !prev)}
              label={showPassword ? 'Hide password' : 'Show password'}
            />
          }
        />

        {serverError && (
          <Text variant="bodySm" color="danger">
            {serverError}
          </Text>
        )}

        <Button
          title="Delete my account"
          variant="danger"
          size="lg"
          stretch
          loading={isSubmitting}
          disabled={password.length === 0 || isSubmitting}
          onPress={() => setConfirmOpen(true)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={isConfirmOpen}
        title="Delete account?"
        body="This starts a 30-day countdown. You'll be signed out everywhere."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  section: {
    gap: space.xs,
  },
});
