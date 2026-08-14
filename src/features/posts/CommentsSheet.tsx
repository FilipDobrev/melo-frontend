import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { errorMessage } from '../../api/client';
import { useAddComment, useComments, useDeleteComment } from '../../api/posts';
import { flattenPages } from '../../api/paging';
import type { Comment } from '../../api/schemas';
import { useCurrentUser } from '../../auth/AuthContext';
import { relativeTime } from '../../lib/format';
import { colors, space, type } from '../../theme/theme';
import { Avatar } from '../../ui/Avatar';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Sheet } from '../../ui/Sheet';
import { StateView } from '../../ui/StateView';
import { Readout, Text } from '../../ui/Text';

interface CommentsSheetProps {
  postId: string | null;
  postOwnerId: string | undefined;
  onClose: () => void;
}

interface CommentRowProps {
  comment: Comment;
  canDelete: boolean;
  onRequestDelete: (comment: Comment) => void;
}

/** Shared row rendering: also used inline by the post detail screen. */
export function CommentRow({ comment, canDelete, onRequestDelete }: CommentRowProps) {
  return (
    <Pressable
      style={styles.row}
      onLongPress={canDelete ? () => onRequestDelete(comment) : undefined}
      accessibilityRole="text"
      accessibilityLabel={`${comment.author.username}: ${comment.content}`}
    >
      <Avatar uri={comment.author.profileImage} username={comment.author.username} size={30} />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text variant="strongSm">{comment.author.username}</Text>
          <Readout variant="readoutSm" color="textFaint">
            {relativeTime(comment.createdAt)}
          </Readout>
        </View>
        <Text variant="body">{comment.content}</Text>
      </View>
    </Pressable>
  );
}

export function CommentsSheet({ postId, postOwnerId, onClose }: CommentsSheetProps) {
  const currentUser = useCurrentUser();
  const id = postId ?? '';
  const query = useComments(postId ?? undefined);
  const addComment = useAddComment(id);
  const deleteComment = useDeleteComment(id);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const comments = flattenPages(query.data);
  const trimmedDraft = draft.trim();

  function handleSubmit() {
    if (trimmedDraft.length === 0 || addComment.isPending) return;
    setSubmitError(null);
    setDraft('');
    addComment.mutate(trimmedDraft, {
      onError: (error) => setSubmitError(errorMessage(error)),
    });
  }

  function canDeleteComment(comment: Comment): boolean {
    if (!currentUser) return false;
    return comment.author.id === currentUser.id || postOwnerId === currentUser.id;
  }

  return (
    <>
      <Sheet
        visible={postId !== null}
        onClose={onClose}
        title="Comments"
        heightRatio={0.85}
        footer={
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
        }
      >
        <StateView isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()}>
          <FlatList
            data={comments}
            keyExtractor={(comment) => comment.id}
            renderItem={({ item }) => (
              <CommentRow comment={item} canDelete={canDeleteComment(item)} onRequestDelete={setPendingDelete} />
            )}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text variant="displayMd" align="center">
                  No comments yet
                </Text>
                <Text variant="body" color="textMuted" align="center">
                  Say something.
                </Text>
              </View>
            }
          />
        </StateView>
      </Sheet>
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
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  rowBody: {
    flex: 1,
    gap: space.hair,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  empty: {
    paddingTop: space.xxxl,
    gap: space.sm,
  },
  composer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
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
    backgroundColor: colors.surface,
    color: colors.text,
    maxHeight: 90,
  },
});
