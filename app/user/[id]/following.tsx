import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { useFollowing } from '../../../src/api/users';
import { flattenPages } from '../../../src/api/paging';
import { UserRow } from '../../../src/features/users/UserRow';
import { EmptyState } from '../../../src/ui/EmptyState';
import { Screen } from '../../../src/ui/Screen';
import { ScreenHeader } from '../../../src/ui/ScreenHeader';
import { StateView } from '../../../src/ui/StateView';

export default function FollowingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const following = useFollowing(id);
  const users = flattenPages(following.data);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Following" onBack={() => router.back()} />
      <StateView isLoading={following.isLoading} error={following.error} onRetry={() => following.refetch()}>
        <FlatList
          style={styles.list}
          data={users}
          keyExtractor={(item) => item.id}
          // Same reasoning as followers.tsx: UserSummary carries no follow
          // state, so this row navigates to the profile instead of lying
          // about it with a FollowButton.
          renderItem={({ item }) => <UserRow user={item} />}
          onEndReached={() => {
            if (following.hasNextPage && !following.isFetchingNextPage) following.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            following.isLoading ? null : (
              <EmptyState
                title="Not following anyone yet"
                body="When you follow someone, they'll show up here."
              />
            )
          }
        />
      </StateView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
