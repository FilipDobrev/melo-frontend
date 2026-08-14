import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useCurrentUser } from '../../auth/AuthContext';
import { useProfile, useUserPosts, useUserRecipes } from '../../api/users';
import { flattenPages } from '../../api/paging';
import type { Post, RecipeSummary } from '../../api/schemas';
import { formatCount } from '../../lib/format';
import { Avatar } from '../../ui/Avatar';
import { EmptyState } from '../../ui/EmptyState';
import { IconButton } from '../../ui/IconButton';
import { Readout, Text } from '../../ui/Text';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { StateView } from '../../ui/StateView';
import { colors, radius, space } from '../../theme/theme';
import { useContentWidth } from '../../theme/layout';
import { FollowButton } from './FollowButton';

interface ProfileViewProps {
  userId: string;
}

type ProfileTab = 'posts' | 'recipes';

const TAB_OPTIONS: { value: ProfileTab; label: string }[] = [
  { value: 'posts', label: 'Posts' },
  { value: 'recipes', label: 'Recipes' },
];

export function ProfileView({ userId }: ProfileViewProps) {
  const currentUser = useCurrentUser();
  const isMe = currentUser?.id === userId;

  const profile = useProfile(userId);
  const posts = useUserPosts(userId);
  const recipes = useUserRecipes(userId);
  const [tab, setTab] = useState<ProfileTab>('posts');

  const contentWidth = useContentWidth();
  const tileSize = Math.floor((contentWidth - 2) / 3);

  const postItems = flattenPages(posts.data);
  const recipeItems = flattenPages(recipes.data);
  const postCountLabel = posts.hasNextPage ? `${formatCount(postItems.length)}+` : formatCount(postItems.length);

  const isPostsTab = tab === 'posts';
  const gridData: (Post | RecipeSummary)[] = isPostsTab ? postItems : recipeItems;
  const activeQuery = isPostsTab ? posts : recipes;
  const isLoadingGrid = activeQuery.isLoading;

  const header = useMemo(
    () =>
      profile.data ? (
        <View>
          <View style={styles.headerRow}>
            <Avatar uri={profile.data.profileImage} username={profile.data.username} size={84} />
            <View style={styles.statCluster}>
              <StatBlock value={postCountLabel} label="POSTS" />
              <View style={styles.statRule} />
              <StatBlock
                value={formatCount(profile.data.followerCount)}
                label="FOLLOWERS"
                accessibilityLabel="Followers"
                onPress={() => router.push({ pathname: '/user/[id]/followers', params: { id: userId } })}
              />
              <View style={styles.statRule} />
              <StatBlock
                value={formatCount(profile.data.followingCount)}
                label="FOLLOWING"
                accessibilityLabel="Following"
                onPress={() => router.push({ pathname: '/user/[id]/following', params: { id: userId } })}
              />
            </View>
          </View>

          <Text variant="displayLg" style={styles.username}>
            {profile.data.username}
          </Text>

          {!isMe && (
            <View style={styles.actionRow}>
              <View style={styles.followWrap}>
                <FollowButton userId={userId} isFollowing={profile.data.isFollowing ?? false} />
              </View>
            </View>
          )}

          {isMe ? (
            <View style={styles.segmentWrapWithCog}>
              <View style={styles.segmentFill}>
                <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={(value) => setTab(value as ProfileTab)} />
              </View>
              <IconButton name="settings" label="Settings" onPress={() => router.push('/settings')} />
            </View>
          ) : (
            <View style={styles.segmentWrap}>
              <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={(value) => setTab(value as ProfileTab)} />
            </View>
          )}
        </View>
      ) : null,
    [profile.data, postCountLabel, isMe, userId, tab],
  );

  return (
    <View style={styles.container}>
      <StateView isLoading={profile.isLoading} error={profile.error} onRetry={() => profile.refetch()}>
        {/*
          One FlatList, no `key` prop. Two keyed lists would unmount/remount
          on every tab switch, which destroys ListHeaderComponent (and the
          avatar inside it) along with the grid tiles - that's what made the
          images look like they were reloading. numColumns is 3 on both
          tabs, so nothing here needs the remount-on-key-change escape hatch.
        */}
        <FlatList
          style={styles.container}
          data={gridData}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (isPost(item) ? <PostCell post={item} size={tileSize} /> : <RecipeCell recipe={item} size={tileSize} />)}
          ListHeaderComponent={header}
          onEndReached={() => {
            if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) activeQuery.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            isLoadingGrid || !profile.data ? null : isPostsTab ? (
              <PostsEmptyState isMe={isMe} />
            ) : (
              <RecipesEmptyState isMe={isMe} />
            )
          }
        />
      </StateView>
    </View>
  );
}

/** A post has an `images` array; a recipe summary does not. */
function isPost(item: Post | RecipeSummary): item is Post {
  return 'images' in item;
}

function StatBlock({
  value,
  label,
  accessibilityLabel,
  onPress,
}: {
  value: string;
  label: string;
  accessibilityLabel?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Readout variant="readoutLg">{value}</Readout>
      <Text variant="label" color="textMuted" numberOfLines={1}>
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.statBlock}>{content}</View>;
  }

  return (
    <Pressable
      style={styles.statBlock}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

const PostCell = React.memo(function PostCell({ post, size }: { post: Post; size: number }) {
  const firstImage = post.images[0];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open post"
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={{ width: size, height: size }}
    >
      <Image
        source={firstImage ? { uri: firstImage.url } : undefined}
        contentFit="cover"
        cachePolicy="memory-disk"
        style={[styles.cellImage, { backgroundColor: colors.slab }]}
      />
      {post.images.length > 1 && (
        <View style={styles.layersBadge}>
          <Feather name="layers" size={14} color={colors.textInverse} />
        </View>
      )}
    </Pressable>
  );
});

const RecipeCell = React.memo(function RecipeCell({ recipe, size }: { recipe: RecipeSummary; size: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
      style={{ width: size, height: size }}
    >
      <Image
        source={{ uri: recipe.imageUrl }}
        contentFit="cover"
        cachePolicy="memory-disk"
        style={[styles.cellImage, { backgroundColor: colors.slab }]}
      />
      <View style={styles.recipeTitleBand}>
        <Text variant="bodySm" color="textInverse" numberOfLines={2}>
          {recipe.title}
        </Text>
      </View>
    </Pressable>
  );
});

function PostsEmptyState({ isMe }: { isMe: boolean }) {
  return (
    <EmptyState
      title="No cooks yet"
      body="Post a photo of something you made."
      actionLabel={isMe ? 'Post a cook' : undefined}
      onAction={isMe ? () => router.push('/compose') : undefined}
    />
  );
}

function RecipesEmptyState({ isMe }: { isMe: boolean }) {
  return (
    <EmptyState
      title="No recipes yet"
      actionLabel={isMe ? 'Write a recipe' : undefined}
      onAction={isMe ? () => router.push('/recipe/new') : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.lg,
  },
  // Tight horizontal padding on purpose: the three columns are equal width,
  // and FOLLOWERS/FOLLOWING are long enough to ellipsize on a narrow phone if
  // the slab gives away any more of its width.
  statCluster: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.slab,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  // Equal-width columns so each number centers over its own label, not the block's content.
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
  },
  statRule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.lineStrong,
  },
  username: {
    marginTop: space.lg,
    marginHorizontal: space.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    marginHorizontal: space.lg,
  },
  followWrap: {
    flex: 1,
  },
  segmentWrap: {
    marginTop: space.lg,
    marginHorizontal: space.lg,
    marginBottom: space.hair,
    paddingBottom: space.lg,
  },
  segmentWrapWithCog: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    marginHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  /** The switcher takes the row; the cog sizes to itself beside it. */
  segmentFill: {
    flex: 1,
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  layersBadge: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
  },
  recipeTitleBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrimSoft,
    paddingHorizontal: space.xs,
    paddingVertical: space.xs,
  },
});
