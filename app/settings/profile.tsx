import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth, useCurrentUser } from '../../src/auth/AuthContext';
import { errorMessage } from '../../src/api/client';
import { useUpdateProfile } from '../../src/api/users';
import { Avatar } from '../../src/ui/Avatar';
import { Button } from '../../src/ui/Button';
import { Field } from '../../src/ui/Field';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { Text } from '../../src/ui/Text';
import { space } from '../../src/theme/theme';

export default function EditProfileScreen() {
  const currentUser = useCurrentUser();
  const { refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage ?? '');
  const [usernameError, setUsernameError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  // Field exposes no ref/focus method, so "focus the picture field" is done
  // by remounting it with autoFocus set - a fresh TextInput mount is the only
  // way this component's contract lets a caller drive focus into it.
  const [focusPictureRequest, setFocusPictureRequest] = useState(0);

  function validate(): boolean {
    if (username.length < 3 || username.length > 30) {
      setUsernameError('Username must be 3-30 characters.');
      return false;
    }
    setUsernameError(undefined);
    return true;
  }

  async function handleSave() {
    setServerError(undefined);
    if (!validate()) return;

    const trimmedImage = profileImage.trim();
    const originalImage = currentUser?.profileImage ?? '';

    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        username,
        // null clears the picture; omitted leaves it untouched.
        ...(trimmedImage !== originalImage
          ? { profileImage: trimmedImage.length > 0 ? trimmedImage : null }
          : {}),
      });
      await refreshUser();
      router.back();
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Edit profile" onBack={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.avatarBlock}>
          <Avatar uri={currentUser?.profileImage} username={currentUser?.username ?? '?'} size={96} />
          <Text
            variant="strong"
            color="accent"
            onPress={() => setFocusPictureRequest((count) => count + 1)}
            accessibilityRole="button"
            accessibilityLabel="Change picture"
          >
            Change picture
          </Text>
        </View>

        {/* Uploading a profile picture directly isn't possible: PATCH /users/me
            takes a URL, and the backend never exposes a public-URL mapping for
            a storage key to clients (see storage.service.ts publicUrlFor,
            which is server-side only). A pasted URL is the honest fallback. */}
        <Text variant="bodySm" color="textMuted">
          Uploads aren&apos;t available for profile pictures yet.
        </Text>
        <Field
          key={`picture-${focusPictureRequest}`}
          label="Picture URL"
          hint="Paste a link to an image."
          value={profileImage}
          onChangeText={setProfileImage}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={focusPictureRequest > 0}
        />

        <Field
          label="Username"
          value={username}
          onChangeText={setUsername}
          error={usernameError}
          autoCapitalize="none"
          autoComplete="username"
        />

        {serverError && (
          <Text variant="bodySm" color="danger">
            {serverError}
          </Text>
        )}

        <Button title="Save changes" onPress={handleSave} size="lg" stretch loading={isSaving} disabled={isSaving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.lg,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: space.sm,
  },
});
