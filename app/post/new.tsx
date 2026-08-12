import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getUploadUrl, uploadImageToStorage } from '../../src/api/posts.api';
import { useCreatePost } from '../../src/hooks/useCreatePost';
import { useUserRecipes } from '../../src/hooks/useUserProfile';
import { useAuth } from '../../src/context/AuthContext';
import { ApiError } from '../../src/api/client';

type PickedImage = { uri: string; contentType: string };

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createPost = useCreatePost();
  const ownRecipes = useUserRecipes(user?.id ?? '');

  const [images, setImages] = useState<PickedImage[]>([]);
  const [caption, setCaption] = useState('');
  const [recipeId, setRecipeId] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const recipes = ownRecipes.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      {recipes.length > 0 ? (
        <>
          <Text style={styles.label}>Attach a recipe (optional)</Text>
          <View style={styles.recipeList}>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={[styles.recipeOption, recipeId === recipe.id && styles.recipeOptionActive]}
                onPress={() => setRecipeId(recipeId === recipe.id ? undefined : recipe.id)}
              >
                <Text style={[styles.recipeOptionText, recipeId === recipe.id && styles.recipeOptionTextActive]}>
                  {recipe.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

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
  recipeList: {
    gap: 8,
  },
  recipeOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F0E8',
  },
  recipeOptionActive: {
    backgroundColor: '#B5541A',
  },
  recipeOptionText: {
    color: '#2B2620',
    fontWeight: '600',
  },
  recipeOptionTextActive: {
    color: '#FFFFFF',
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
