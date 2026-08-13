import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getUploadUrl, uploadImageToStorage } from '../../src/api/posts.api';
import { useCreatePost } from '../../src/hooks/useCreatePost';
import { useRecipe } from '../../src/hooks/useRecipes';
import { ApiError } from '../../src/api/client';
import { LoadingState } from '../../src/components/EmptyState';

type PickedImage = { uri: string; contentType: string };

export default function NewPostScreen() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();
  const createPost = useCreatePost();
  const recipeQuery = useRecipe(recipeId ?? '');

  const [images, setImages] = useState<PickedImage[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every post documents cooking a specific recipe, so the composer is
  // unreachable without one: send the user to pick a recipe instead.
  useEffect(() => {
    if (!recipeId) {
      router.replace('/post/pick');
    }
  }, [recipeId, router]);

  if (!recipeId) {
    return <LoadingState />;
  }

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    setImages((current) => [
      ...current,
      ...result.assets.map((asset) => ({ uri: asset.uri, contentType: asset.mimeType ?? 'image/jpeg' })),
    ]);
  }

  async function handleSubmit() {
    if (images.length === 0) {
      setError('Add at least one image.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const imageKeys: string[] = [];
      for (const image of images) {
        const blob = await (await fetch(image.uri)).blob();
        const { uploadUrl, storageKey } = await getUploadUrl({
          contentType: image.contentType,
          contentLength: blob.size,
        });
        await uploadImageToStorage(uploadUrl, blob, image.contentType);
        imageKeys.push(storageKey);
      }

      const post = await createPost.mutateAsync({
        caption: caption.trim() || undefined,
        recipeId,
        imageKeys,
      });
      router.replace({ pathname: '/post/[id]', params: { id: post.id } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the post.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'New Post' }} />
      <Text style={styles.label}>Recipe</Text>
      <View style={styles.recipeChip}>
        <Text style={styles.recipeChipText} numberOfLines={1}>
          {recipeQuery.data?.title ?? 'Loading recipe...'}
        </Text>
      </View>

      <Text style={styles.label}>Images</Text>
      <View style={styles.imageRow}>
        {images.map((image, index) => (
          <Image key={image.uri + index} source={{ uri: image.uri }} style={styles.thumb} contentFit="cover" />
        ))}
        <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
          <Text style={styles.addImageText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Caption</Text>
      <TextInput
        style={styles.input}
        placeholder="What did you make?"
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isUploading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isUploading}
      >
        {isUploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Share post</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
    marginBottom: 8,
    marginTop: 12,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F0EBE1',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 28,
    color: '#B5541A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  recipeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F0E8',
    maxWidth: '100%',
  },
  recipeChipText: {
    color: '#2B2620',
    fontWeight: '600',
  },
  error: {
    color: '#C0392B',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#B5541A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
