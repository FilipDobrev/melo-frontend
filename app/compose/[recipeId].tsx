import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { errorMessage } from '../../src/api/client';
import { requestPostImageUpload, useCreatePost } from '../../src/api/posts';
import { useRecipe } from '../../src/api/recipes';
import type { Nutrition } from '../../src/api/schemas';
import { SquareCropDialog } from '../../src/features/media/SquareCropDialog';
import { uploadImages } from '../../src/lib/upload';
import { formatMacros } from '../../src/lib/format';
import { colors, HIT_SLOP, radius, space } from '../../src/theme/theme';
import { Button } from '../../src/ui/Button';
import { Field } from '../../src/ui/Field';
import { IconButton } from '../../src/ui/IconButton';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { StateView } from '../../src/ui/StateView';
import { Readout, Text } from '../../src/ui/Text';

const MAX_IMAGES = 10;
const CAPTION_MAX = 2000;
const CAPTION_COUNTER_THRESHOLD = 1800;

export default function ComposeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const recipe = useRecipe(recipeId);
  const createPost = useCreatePost();

  const [images, setImages] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [recropIndex, setRecropIndex] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-cropping an existing photo takes priority over the pick queue - the two never
  // need to be visible at once, but if they somehow overlap the explicit re-crop wins.
  const cropDialogUri = recropIndex !== null ? images[recropIndex] : (cropQueue[0] ?? null);

  const isUploading = progress !== null;
  const isSubmitting = isUploading || createPost.isPending;

  async function pickImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Melo needs photo access to post. Enable it in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.85,
    });
    if (result.canceled) return;

    const pickedUris = result.assets.map((asset) => asset.uri);
    setCropQueue((current) => [...current, ...pickedUris]);
  }

  function removeImage(uri: string) {
    setImages((current) => current.filter((existing) => existing !== uri));
  }

  function handleCropDone(croppedUri: string) {
    if (recropIndex !== null) {
      const index = recropIndex;
      setImages((current) => current.map((existing, i) => (i === index ? croppedUri : existing)));
      setRecropIndex(null);
      return;
    }
    setImages((current) => (current.length >= MAX_IMAGES ? current : [...current, croppedUri]));
    setCropQueue((current) => current.slice(1));
  }

  function handleCropSkip() {
    if (recropIndex !== null) {
      setRecropIndex(null);
      return;
    }
    const originalUri = cropQueue[0];
    setImages((current) =>
      current.length >= MAX_IMAGES || originalUri === undefined ? current : [...current, originalUri],
    );
    setCropQueue((current) => current.slice(1));
  }

  function handleCropCancel() {
    if (recropIndex !== null) {
      setRecropIndex(null);
      return;
    }
    // The user rejected this one photo, not the rest of the batch - shift past it
    // so the next queued photo opens immediately instead of losing the whole pick.
    setCropQueue((current) => current.slice(1));
  }

  async function handleSubmit() {
    if (!recipeId || images.length === 0 || isSubmitting) return;
    setSubmitError(null);

    try {
      setProgress({ done: 0, total: images.length });
      const imageKeys = await uploadImages(images, requestPostImageUpload, (done, total) =>
        setProgress({ done, total }),
      );
      setProgress(null);

      await createPost.mutateAsync({
        recipeId,
        imageKeys,
        caption: caption.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (error) {
      setProgress(null);
      setSubmitError(errorMessage(error));
    }
  }

  const postButtonTitle = isUploading ? `Uploading ${progress.done}/${progress.total}` : 'Post';

  return (
    <Screen edges={['top']}>
      <ScreenHeader
        title="New post"
        onBack={() => router.back()}
        right={
          <Button
            title={postButtonTitle}
            size="md"
            onPress={handleSubmit}
            disabled={images.length === 0 || isSubmitting}
            loading={createPost.isPending}
          />
        }
      />
      <StateView isLoading={recipe.isLoading} error={recipe.error} onRetry={() => recipe.refetch()}>
        {recipe.data && (
          <ScrollView contentContainerStyle={styles.content}>
            <ChosenRecipe title={recipe.data.title} nutrition={recipe.data.nutrition} />

            <View style={styles.imageRow}>
              {images.map((uri, imageIndex) => (
                <View key={uri} style={styles.thumbnailWrap}>
                  <Image source={{ uri }} contentFit="cover" style={styles.thumbnail} />
                  <View style={styles.cropButton}>
                    <IconButton
                      name="crop"
                      onPress={() => setRecropIndex(imageIndex)}
                      label="Crop photo"
                      size={14}
                      color="textInverse"
                    />
                  </View>
                  <View style={styles.removeButton}>
                    <Pressable
                      onPress={() => removeImage(uri)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                      hitSlop={HIT_SLOP}
                    >
                      <Feather name="x" size={14} color={colors.textInverse} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <Pressable
                  style={styles.addTile}
                  onPress={pickImages}
                  accessibilityRole="button"
                  accessibilityLabel="Add photos"
                >
                  <Feather name="plus" size={22} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            <View style={styles.captionField}>
              <Field
                label="Caption"
                value={caption}
                onChangeText={(text) => setCaption(text.slice(0, CAPTION_MAX))}
                multiline
                maxLength={CAPTION_MAX}
                placeholder="How did it go?"
              />
              {caption.length > CAPTION_COUNTER_THRESHOLD && (
                <Readout variant="readoutSm" color="textFaint" style={styles.captionCounter}>
                  {`${caption.length}/${CAPTION_MAX}`}
                </Readout>
              )}
            </View>

            {submitError && (
              <Text variant="bodySm" color="danger" style={styles.submitError}>
                {submitError}
              </Text>
            )}
          </ScrollView>
        )}
      </StateView>
      <SquareCropDialog
        uri={cropDialogUri ?? null}
        onCancel={handleCropCancel}
        onSkip={handleCropSkip}
        onDone={handleCropDone}
        confirmLabel="Use photo"
      />
    </Screen>
  );
}

function ChosenRecipe({ title, nutrition }: { title: string; nutrition: Nutrition }) {
  return (
    <View style={styles.chosenSlab}>
      <View style={styles.chosenHeader}>
        <Text variant="label" color="deep">
          COOKED
        </Text>
        <Pressable
          onPress={() => router.replace('/compose')}
          accessibilityRole="button"
          accessibilityLabel="Change recipe"
        >
          <Text variant="strongSm" color="deep">
            Change
          </Text>
        </Pressable>
      </View>
      <Text variant="displaySm" color="text" numberOfLines={2} style={styles.chosenTitle}>
        {title}
      </Text>
      <Readout variant="readoutSm" color="deep">
        {formatMacros(nutrition)}
      </Readout>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.lg,
  },
  chosenSlab: {
    backgroundColor: colors.deepTint,
    borderRadius: radius.md,
    padding: space.md,
  },
  chosenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chosenTitle: {
    marginVertical: space.xs,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  thumbnailWrap: {
    width: 88,
    height: 88,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: radius.sm,
    backgroundColor: colors.slab,
  },
  removeButton: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropButton: {
    position: 'absolute',
    bottom: space.xs,
    left: space.xs,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addTile: {
    width: 88,
    height: 88,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionField: {
    gap: space.xs,
  },
  captionCounter: {
    alignSelf: 'flex-end',
  },
  submitError: {
    alignSelf: 'flex-start',
  },
});
