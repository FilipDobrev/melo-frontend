import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { useFollowers } from '../../../src/api/users';
import { flattenPages } from '../../../src/api/paging';
import { UserRow } from '../../../src/features/users/UserRow';
import { EmptyState } from '../../../src/ui/EmptyState';
import { Screen } from '../../../src/ui/Screen';
import { ScreenHeader } from '../../../src/ui/ScreenHeader';
import { StateView } from '../../../src/ui/StateView';

export default function FollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const followers = useFollowers(id);
  const users = flattenPages(followers.data);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Followers" onBack={() => router.back()} />
      <StateView isLoading={followers.isLoading} error={followers.error} onRetry={() => followers.refetch()}>
        <FlatList
          style={styles.list}
          data={users}
          keyExtractor={(item) => item.id}
          // A list row only carries a UserSummary, which has no follow state -
          // rendering a FollowButton here would have to guess it, so the row
          // just opens the real profile where the follow state is known.
          renderItem={({ item }) => <UserRow user={item} />}
          onEndReached={() => {
            if (followers.hasNextPage && !followers.isFetchingNextPage) followers.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            followers.isLoading ? null : (
              <EmptyState
                title="No followers yet"
                body="When they follow someone, they'll show up here."
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
