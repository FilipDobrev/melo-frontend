import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { errorMessage } from '../../src/api/client';
import { flattenPages } from '../../src/api/paging';
import { useAddComment, useComments, useDeleteComment, usePost } from '../../src/api/posts';
import type { Comment } from '../../src/api/schemas';
import { useCurrentUser } from '../../src/auth/AuthContext';
import { CommentRow } from '../../src/features/posts/CommentsSheet';
import { PostActionsSheet } from '../../src/features/posts/PostActionsSheet';
import { PostCard } from '../../src/features/posts/PostCard';
import { colors, space, type } from '../../src/theme/theme';
import { Avatar } from '../../src/ui/Avatar';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { StateView } from '../../src/ui/StateView';
import { Text } from '../../src/ui/Text';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const currentUser = useCurrentUser();
  const commentsQuery = useComments(id);
  const addComment = useAddComment(id ?? '');
  const deleteComment = useDeleteComment(id ?? '');

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [visibleImageIndex, setVisibleImageIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const comments = flattenPages(commentsQuery.data);
  const trimmedDraft = draft.trim();

  function canDeleteComment(comment: Comment): boolean {
    if (!currentUser || !post.data) return false;
    return comment.author.id === currentUser.id || post.data.author.id === currentUser.id;
  }

  function handleSubmit() {
    if (trimmedDraft.length === 0 || addComment.isPending) return;
    setSubmitError(null);
    setDraft('');
    addComment.mutate(trimmedDraft, {
      onError: (error) => setSubmitError(errorMessage(error)),
    });
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader
        title="Post"
        onBack={() => router.back()}
      />
      <StateView isLoading={post.isLoading} error={post.error} onRetry={() => post.refetch()}>
        {post.data && (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <FlatList
              style={styles.flex}
              data={comments}
              keyExtractor={(comment) => comment.id}
              renderItem={({ item }) => (
                <CommentRow comment={item} canDelete={canDeleteComment(item)} onRequestDelete={setPendingDelete} />
              )}
              onEndReached={() => {
                if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) commentsQuery.fetchNextPage();
              }}
              ListHeaderComponent={
                <>
                  <PostCard
                    post={post.data}
                    variant="detail"
                    onOpenComments={() => {}}
                    onOpenActions={(_post, imageIndex) => {
                      setVisibleImageIndex(imageIndex);
                      setIsActionsOpen(true);
                    }}
                  />
                  <View style={styles.commentsHeading}>
                    <Text variant="label" color="textMuted">
                      COMMENTS
                    </Text>
                  </View>
                </>
              }
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Text variant="body" color="textMuted">
                    No comments yet. Say something.
                  </Text>
                </View>
              }
            />
            <View style={styles.composer}>
              {submitError && (
                <Text variant="bodySm" color="danger" style={styles.composerError}>
                  {submitError}
                </Text>
              )}
              <View style={styles.composerRow}>
                <Avatar uri={currentUser?.profileImage ?? null} username={currentUser?.username ?? '?'} size={30} />
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  maxLength={2000}
                  placeholder="Add a comment…"
                  placeholderTextColor={colors.textFaint}
                  style={styles.composerInput}
                  accessibilityLabel="Add a comment"
                />
                <Pressable
                  onPress={handleSubmit}
                  disabled={trimmedDraft.length === 0 || addComment.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Post comment"
                >
                  <Text
                    variant="strong"
                    color={trimmedDraft.length === 0 || addComment.isPending ? 'textFaint' : 'accent'}
                  >
                    Post
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </StateView>
      <PostActionsSheet
        post={isActionsOpen ? post.data ?? null : null}
        visibleImageIndex={visibleImageIndex}
        onClose={() => setIsActionsOpen(false)}
        onDeleted={() => router.back()}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete comment"
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteComment.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  commentsHeading: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  emptyComments: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: colors.surface,
  },
  composerError: {
    paddingBottom: space.xs,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  composerInput: {
    flex: 1,
    ...type.body,
    color: colors.text,
    maxHeight: 90,
  },
});
