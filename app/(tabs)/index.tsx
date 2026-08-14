import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { flattenPages } from '../../src/api/paging';
import { useFeed } from '../../src/api/posts';
import type { Post } from '../../src/api/schemas';
import { CommentsSheet } from '../../src/features/posts/CommentsSheet';
import { PostActionsSheet } from '../../src/features/posts/PostActionsSheet';
import { PostCard } from '../../src/features/posts/PostCard';
import { colors, space } from '../../src/theme/theme';
import { EmptyState } from '../../src/ui/EmptyState';
import { Screen } from '../../src/ui/Screen';
import { StateView } from '../../src/ui/StateView';
import { Text } from '../../src/ui/Text';

export default function FeedScreen() {
  const feed = useFeed();
  const posts = flattenPages(feed.data);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [actionsPost, setActionsPost] = useState<Post | null>(null);

  const commentsPost = posts.find((post) => post.id === commentsPostId);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text variant="displayLg">Melo</Text>
      </View>
      <StateView
        isLoading={feed.isLoading}
        error={feed.error}
        onRetry={() => feed.refetch()}
        emptyWhen={posts.length === 0}
        empty={
          <View style={styles.emptyContainer}>
            <EmptyState
              title="Your feed is quiet"
              body="Follow some cooks, or cook something yourself."
              actionLabel="Find people to follow"
              onAction={() => router.push('/discover')}
            />
          </View>
        }
      >
        <FlatList
          style={styles.list}
          data={posts}
          keyExtractor={(post) => post.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onOpenComments={setCommentsPostId}
              onOpenActions={setActionsPost}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.accent} />
          }
          onEndReached={() => {
            if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
          }}
          ListFooterComponent={
            feed.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null
          }
        />
      </StateView>
      <CommentsSheet
        postId={commentsPostId}
        postOwnerId={commentsPost?.author.id}
        onClose={() => setCommentsPostId(null)}
      />
      <PostActionsSheet post={actionsPost} onClose={() => setActionsPost(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: space.lg,
    backgroundColor: colors.ground,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  list: {
    flex: 1,
  },
  separator: {
    height: space.sm,
    backgroundColor: colors.ground,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: space.lg,
  },
});
