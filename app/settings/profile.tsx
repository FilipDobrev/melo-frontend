import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAuth, useCurrentUser } from '../../src/auth/AuthContext';
import { errorMessage } from '../../src/api/client';
import { requestAvatarUpload, useUpdateProfile } from '../../src/api/users';
import { uploadImage } from '../../src/lib/upload';
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
  const [usernameError, setUsernameError] = useState<string>();
  const [pendingImage, setPendingImage] = useState<{ uri: string } | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);

  const isSaving = isUploading || updateProfile.isPending;
  const displayedImage = pendingImage
    ? pendingImage.uri
    : removeRequested
      ? null
      : currentUser?.profileImage;
  const canRemove = !removeRequested && (pendingImage !== null || Boolean(currentUser?.profileImage));

  function validate(): boolean {
    if (username.length < 3 || username.length > 30) {
      setUsernameError('Username must be 3-30 characters.');
      return false;
    }
    setUsernameError(undefined);
    return true;
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Melo needs photo access to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    setPendingImage({ uri: result.assets[0].uri });
    setRemoveRequested(false);
  }

  function removePicture() {
    setPendingImage(null);
    setRemoveRequested(true);
  }

  async function handleSave() {
    setServerError(undefined);
    if (!validate()) return;

    try {
      let storageKey: string | undefined;
      if (pendingImage) {
        setIsUploading(true);
        try {
          storageKey = await uploadImage(pendingImage.uri, requestAvatarUpload);
        } catch (uploadError) {
          throw new Error(`Picture: ${errorMessage(uploadError)}`);
        } finally {
          setIsUploading(false);
        }
      }

      await updateProfile.mutateAsync({
        username,
        // profileImage in responses is a resolved URL, not a key, so when the
        // picture wasn't touched it must be omitted rather than echoed back -
        // sending it would write the deprecated URL form to the server.
        ...(storageKey ? { profileImage: storageKey } : removeRequested ? { profileImage: null } : {}),
      });
      await refreshUser();
      router.back();
    } catch (error) {
      setServerError(errorMessage(error));
    }
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Edit profile" onBack={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.avatarBlock}>
          <Avatar uri={displayedImage} username={currentUser?.username ?? '?'} size={96} />
          <Text
            variant="strong"
            color="accent"
            onPress={isSaving ? undefined : pickFromLibrary}
            accessibilityRole="button"
            accessibilityLabel="Change picture"
            accessibilityState={{ disabled: isSaving }}
          >
            {isUploading ? 'Uploading…' : 'Change picture'}
          </Text>
          {canRemove && (
            <Text
              variant="bodySm"
              color="textMuted"
              onPress={isSaving ? undefined : removePicture}
              accessibilityRole="button"
              accessibilityLabel="Remove picture"
              accessibilityState={{ disabled: isSaving }}
            >
              Remove picture
            </Text>
          )}
        </View>

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
