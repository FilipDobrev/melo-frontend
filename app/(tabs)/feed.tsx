import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFeed } from '../../src/hooks/useFeed';
import { PostCard } from '../../src/components/PostCard';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';

export default function FeedScreen() {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Could not load your feed.'}
          onRetry={refetch}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Your feed is empty"
          message="Follow people to see their posts here."
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(post) => post.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        />
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2620',
  },
  list: {
    padding: 16,
  },
  footerSpinner: {
    marginVertical: 16,
  },
});
