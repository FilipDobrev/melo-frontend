import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePost, useComments, useAddComment, useDeleteComment, useSetReaction, useDeletePost } from '../../src/hooks/usePost';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/Avatar';
import { EmojiReactionRow } from '../../src/components/EmojiReactionRow';
import { ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const postQuery = usePost(id);
  const commentsQuery = useComments(id);
  const addComment = useAddComment(id);
  const deleteComment = useDeleteComment(id);
  const setReaction = useSetReaction(id);
  const deletePost = useDeletePost();

  const [commentText, setCommentText] = useState('');

  if (postQuery.isLoading) {
    return <LoadingState />;
  }
  if (postQuery.isError || !postQuery.data) {
    return (
      <ErrorState
        message={postQuery.error instanceof ApiError ? postQuery.error.message : 'Could not load this post.'}
        onRetry={postQuery.refetch}
      />
    );
  }

  const post = postQuery.data;
  const comments = commentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isOwner = user?.id === post.author.id;

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    await addComment.mutateAsync(commentText.trim());
    setCommentText('');
  }

  async function handleDeletePost() {
    await deletePost.mutateAsync(post.id);
    router.back();
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Link href={{ pathname: '/user/[id]', params: { id: post.author.id } }} asChild>
          <TouchableOpacity style={styles.authorRow}>
            <Avatar uri={post.author.profileImage} username={post.author.username} size="small" />
            <Text style={styles.username}>{post.author.username}</Text>
          </TouchableOpacity>
        </Link>
        {isOwner ? (
          <TouchableOpacity onPress={handleDeletePost}>
            <Text style={styles.deleteLink}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        horizontal
        pagingEnabled
        data={post.images}
        keyExtractor={(image) => image.id}
        renderItem={({ item }) => <Image source={{ uri: item.url }} style={styles.image} contentFit="cover" />}
      />

      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      {post.recipe ? (
        <Link href={{ pathname: '/recipe/[id]', params: { id: post.recipe.id } }} asChild>
          <TouchableOpacity style={styles.recipeChip}>
            <Text style={styles.recipeChipText}>Recipe: {post.recipe.title}</Text>
          </TouchableOpacity>
        </Link>
      ) : null}

      <View style={styles.reactionsSection}>
        <EmojiReactionRow reactions={post.reactions} onSelect={(emoji) => setReaction.mutate(emoji)} />
      </View>

      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments ({post.commentCount})</Text>

        {comments.length === 0 ? (
          <Text style={styles.noComments}>No comments yet.</Text>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <Avatar uri={comment.author.profileImage} username={comment.author.username} size="small" />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>{comment.author.username}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
              {comment.author.id === user?.id || isOwner ? (
                <TouchableOpacity onPress={() => deleteComment.mutate(comment.id)}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}

        {commentsQuery.hasNextPage ? (
          <TouchableOpacity
            onPress={() => commentsQuery.fetchNextPage()}
            disabled={commentsQuery.isFetchingNextPage}
            style={styles.loadMore}
          >
            {commentsQuery.isFetchingNextPage ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.loadMoreText}>Load more comments</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity onPress={handleSubmitComment} disabled={!commentText.trim() || addComment.isPending}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontWeight: '600',
    color: '#2B2620',
  },
  deleteLink: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '600',
  },
  image: {
    width: 380,
    maxWidth: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0EBE1',
  },
  caption: {
    padding: 12,
    color: '#2B2620',
    fontSize: 15,
  },
  recipeChip: {
    alignSelf: 'flex-start',
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recipeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B5541A',
  },
  reactionsSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentsSection: {
    padding: 12,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B2620',
    marginBottom: 8,
  },
  noComments: {
    color: '#8A7F70',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 13,
    color: '#2B2620',
  },
  commentText: {
    fontSize: 14,
    color: '#2B2620',
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadMoreText: {
    color: '#B5541A',
    fontWeight: '600',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5DDD0',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  sendText: {
    color: '#B5541A',
    fontWeight: '700',
  },
});
