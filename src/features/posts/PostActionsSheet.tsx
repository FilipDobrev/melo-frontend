import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { errorMessage } from '../../api/client';
import { useDeletePost, useDeletePostImage } from '../../api/posts';
import type { Post } from '../../api/schemas';
import { useCurrentUser } from '../../auth/AuthContext';
import { colors, space } from '../../theme/theme';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Sheet } from '../../ui/Sheet';
import { Text } from '../../ui/Text';

interface PostActionsSheetProps {
  post: Post | null;
  onClose: () => void;
  visibleImageIndex: number;
  onDeleted?: () => void;
}

export function PostActionsSheet({ post, onClose, visibleImageIndex, onDeleted }: PostActionsSheetProps) {
  const currentUser = useCurrentUser();
  const isOwner = post !== null && post.author.id === currentUser?.id;
  const deletePostImage = useDeletePostImage(post?.id ?? '');
  const deletePost = useDeletePost();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  function viewRecipe() {
    if (!post) return;
    onClose();
    router.push({ pathname: '/recipe/[id]', params: { id: post.recipe.id } });
  }

  function removePhoto() {
    if (!post) return;
    const image = post.images[visibleImageIndex];
    if (!image) return;
    setImageError(null);
    deletePostImage.mutate(image.id, {
      onError: (error) => setImageError(errorMessage(error)),
    });
  }

  function confirmDeletePost() {
    if (!post) return;
    deletePost.mutate(post.id, {
      onSuccess: () => {
        onClose();
        onDeleted?.();
      },
    });
    setIsConfirmingDelete(false);
  }

  return (
    <>
      <Sheet visible={post !== null} onClose={onClose} heightRatio={0.4}>
        <View>
          <Row icon="book-open" label="View recipe" onPress={viewRecipe} />
          {isOwner && post && post.images.length > 1 && (
            <Row icon="image" label="Remove this photo" onPress={removePhoto} danger />
          )}
          {isOwner && (
            <Row icon="trash-2" label="Delete post" onPress={() => setIsConfirmingDelete(true)} danger />
          )}
          {imageError && (
            <Text variant="bodySm" color="danger" style={styles.imageError}>
              {imageError}
            </Text>
          )}
        </View>
      </Sheet>
      <ConfirmDialog
        visible={isConfirmingDelete}
        title="Delete post"
        confirmLabel="Delete"
        destructive
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDeletePost}
      />
    </>
  );
}

interface RowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function Row({ icon, label, onPress, danger = false }: RowProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={18} color={danger ? colors.danger : colors.text} />
      <Text variant="body" color={danger ? 'danger' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 52,
    paddingHorizontal: space.lg,
  },
  imageError: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
});
