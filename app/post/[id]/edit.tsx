import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { errorMessage } from '../../../src/api/client';
import { requestPostImageUpload, useUpdatePost, usePost } from '../../../src/api/posts';
import { useCurrentUser } from '../../../src/auth/AuthContext';
import { SquareCropDialog } from '../../../src/features/media/SquareCropDialog';
import { RecipePickerSheet } from '../../../src/features/recipes/RecipePickerSheet';
import { uploadImages } from '../../../src/lib/upload';
import { colors, HIT_SLOP, radius, space } from '../../../src/theme/theme';
import { Button } from '../../../src/ui/Button';
import { EmptyState } from '../../../src/ui/EmptyState';
import { Field } from '../../../src/ui/Field';
import { Screen } from '../../../src/ui/Screen';
import { ScreenHeader } from '../../../src/ui/ScreenHeader';
import { StateView } from '../../../src/ui/StateView';
import { Readout, Text } from '../../../src/ui/Text';

const MAX_IMAGES = 10;
const CAPTION_MAX = 2000;
const CAPTION_COUNTER_THRESHOLD = 1800;

/** Stable local identity for an editable image, whether it came from the post or a fresh pick. */
interface EditableImage {
  uid: string;
  /** What to render now: the remote url for existing images, the local uri for new picks. */
  previewUri: string;
  /** Set for images already on the post. Null for newly picked ones. */
  storageKey: string | null;
  /** Set for newly picked images awaiting upload. Null for existing ones. */
  localUri: string | null;
}

let uidCounter = 0;
function nextUid(): string {
  uidCounter += 1;
  return `img-${uidCounter}`;
}

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const updatePost = useUpdatePost(id ?? '');
  const currentUser = useCurrentUser();

  const [images, setImages] = useState<EditableImage[]>([]);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [recipe, setRecipe] = useState<{ id: string; title: string } | null>(null);
  const [isRecipePickerOpen, setIsRecipePickerOpen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Seed local state from the loaded post exactly once. A background refetch
  // (e.g. after another screen invalidates posts) must not clobber edits the
  // user has already made, so this only runs for the first post id seen.
  const seededPostId = useRef<string | null>(null);
  useEffect(() => {
    if (!post.data || seededPostId.current === post.data.id) return;
    seededPostId.current = post.data.id;
    setImages(
      post.data.images.map((image) => ({
        uid: image.id,
        previewUri: image.url,
        storageKey: image.storageKey,
        localUri: null,
      })),
    );
    setCaption(post.data.caption ?? '');
    setRecipe({ id: post.data.recipe.id, title: post.data.recipe.title });
  }, [post.data]);

  const cropDialogUri = cropQueue[0] ?? null;
  const isUploading = progress !== null;
  const isSaving = isUploading || updatePost.isPending;

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

  function removeImage(uid: string) {
    // Local-only: does not call DELETE /posts/:postId/images/:imageId. The
    // save PATCH replaces the whole image set, so also issuing per-image
    // deletes would double-delete against the same change.
    setImages((current) => current.filter((image) => image.uid !== uid));
  }

  function handleCropDone(croppedUri: string) {
    setImages((current) =>
      current.length >= MAX_IMAGES
        ? current
        : [...current, { uid: nextUid(), previewUri: croppedUri, storageKey: null, localUri: croppedUri }],
    );
    setCropQueue((current) => current.slice(1));
  }

  function handleCropSkip() {
    const originalUri = cropQueue[0];
    setImages((current) =>
      current.length >= MAX_IMAGES || originalUri === undefined
        ? current
        : [...current, { uid: nextUid(), previewUri: originalUri, storageKey: null, localUri: originalUri }],
    );
    setCropQueue((current) => current.slice(1));
  }

  function handleCropCancel() {
    // The user rejected this one photo, not the rest of the batch - shift
    // past it so the next queued photo opens immediately.
    setCropQueue((current) => current.slice(1));
  }

  async function handleSave() {
    if (!post.data || !recipe || images.length === 0 || isSaving) return;
    setSubmitError(null);

    try {
      // flatMap rather than filter+map: it narrows away the null without a cast.
      const localUris = images.flatMap((image) => (image.localUri === null ? [] : [image.localUri]));
      let uploadedKeys: string[] = [];
      if (localUris.length > 0) {
        setProgress({ done: 0, total: localUris.length });
        uploadedKeys = await uploadImages(localUris, requestPostImageUpload, (done, total) =>
          setProgress({ done, total }),
        );
        setProgress(null);
      }

      let uploadIndex = 0;
      const imageKeys = images.map((image) => {
        if (image.storageKey !== null) return image.storageKey;
        const key = uploadedKeys[uploadIndex];
        uploadIndex += 1;
        return key;
      });

      const currentKeys = post.data.images.map((image) => image.storageKey);
      const imageKeysChanged =
        imageKeys.length !== currentKeys.length || imageKeys.some((key, index) => key !== currentKeys[index]);

      const trimmedCaption = caption.trim();
      const currentCaption = post.data.caption ?? '';

      const patch: { caption?: string | null; recipeId?: string; imageKeys?: string[] } = {};
      if (trimmedCaption !== currentCaption) {
        patch.caption = trimmedCaption.length === 0 ? null : trimmedCaption;
      }
      if (recipe.id !== post.data.recipe.id) {
        patch.recipeId = recipe.id;
      }
      if (imageKeysChanged) {
        patch.imageKeys = imageKeys;
      }

      if (Object.keys(patch).length === 0) {
        router.back();
        return;
      }

      await updatePost.mutateAsync(patch);
      router.back();
    } catch (error) {
      setProgress(null);
      setSubmitError(errorMessage(error));
    }
  }

  const saveButtonTitle = isUploading ? `Uploading ${progress.done}/${progress.total}` : 'Save';

  if (post.data && currentUser && post.data.author.id !== currentUser.id) {
    return (
      <Screen edges={['top']}>
        <ScreenHeader title="Edit post" onBack={() => router.back()} />
        <View style={styles.forbiddenContainer}>
          <EmptyState
            title="You can't edit this post"
            body="Only the person who posted it can."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader
        title="Edit post"
        onBack={() => router.back()}
        right={
          <Button
            title={saveButtonTitle}
            size="md"
            onPress={handleSave}
            disabled={images.length === 0 || isSaving}
            loading={updatePost.isPending}
          />
        }
      />
      <StateView isLoading={post.isLoading} error={post.error} onRetry={() => post.refetch()}>
        {post.data && recipe && (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.chosenSlab}>
              <View style={styles.chosenHeader}>
                <Text variant="label" color="deep">
                  COOKED
                </Text>
                <Pressable
                  onPress={() => setIsRecipePickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Change recipe"
                >
                  <Text variant="strongSm" color="deep">
                    Change
                  </Text>
                </Pressable>
              </View>
              <Text variant="displaySm" color="text" numberOfLines={2} style={styles.chosenTitle}>
                {recipe.title}
              </Text>
            </View>

            <View style={styles.imageRow}>
              {images.map((image) => (
                <View key={image.uid} style={styles.thumbnailWrap}>
                  <Image source={{ uri: image.previewUri }} contentFit="cover" style={styles.thumbnail} />
                  <View style={styles.removeButton}>
                    <Pressable
                      onPress={() => removeImage(image.uid)}
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
        uri={cropDialogUri}
        onCancel={handleCropCancel}
        onSkip={handleCropSkip}
        onDone={handleCropDone}
        confirmLabel="Use photo"
      />
      <RecipePickerSheet
        visible={isRecipePickerOpen}
        onClose={() => setIsRecipePickerOpen(false)}
        onPick={(picked) => setRecipe(picked)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.lg,
  },
  forbiddenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
