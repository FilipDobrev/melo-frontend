import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useDeletePost } from '../../api/posts';
import { useRecipe } from '../../api/recipes';
import type { Post } from '../../api/schemas';
import { useCurrentUser } from '../../auth/AuthContext';
import { colors, space } from '../../theme/theme';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Sheet } from '../../ui/Sheet';
import { Text } from '../../ui/Text';

interface PostActionsSheetProps {
  post: Post | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function PostActionsSheet({ post, onClose, onDeleted }: PostActionsSheetProps) {
  const currentUser = useCurrentUser();
  const isOwner = post !== null && post.author.id === currentUser?.id;
  // The post payload only carries { id, title, nutrition, isSaved } for its
  // recipe, not the owner - post ownership doesn't imply recipe ownership
  // (you can post about someone else's recipe), so this needs its own fetch.
  const recipe = useRecipe(post?.recipe.id);
  const ownsRecipe = !!recipe.data && !!currentUser && recipe.data.owner.id === currentUser.id;
  const deletePost = useDeletePost();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const visibleRowCount = 1 + (ownsRecipe ? 1 : 0) + (isOwner ? 1 : 0);

  function viewRecipe() {
    if (!post) return;
    onClose();
    router.push({ pathname: '/recipe/[id]', params: { id: post.recipe.id } });
  }

  function editRecipe() {
    if (!post) return;
    onClose();
    router.push({ pathname: '/recipe/[id]/edit', params: { id: post.recipe.id } });
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
      <Sheet visible={post !== null} onClose={onClose} heightRatio={0.14 + visibleRowCount * 0.07}>
        <View>
          <Row icon="book-open" label="View recipe" onPress={viewRecipe} />
          {ownsRecipe && <Row icon="edit-3" label="Edit recipe" onPress={editRecipe} />}
          {isOwner && (
            <Row icon="trash-2" label="Delete post" onPress={() => setIsConfirmingDelete(true)} danger />
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
});
