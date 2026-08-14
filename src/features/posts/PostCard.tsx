import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSetReaction } from '../../api/posts';
import type { Post } from '../../api/schemas';
import { formatCount, relativeTime } from '../../lib/format';
import { colors, space } from '../../theme/theme';
import { Avatar } from '../../ui/Avatar';
import { IconButton } from '../../ui/IconButton';
import { Readout, Text } from '../../ui/Text';
import { CookedStamp } from './CookedStamp';
import { PostImageCarousel } from './PostImageCarousel';
import { ReactionBar } from './ReactionBar';

interface PostCardProps {
  post: Post;
  variant?: 'feed' | 'detail';
  onOpenComments: (postId: string) => void;
  onOpenActions?: (post: Post) => void;
}

function PostCardBase({ post, variant = 'feed', onOpenComments, onOpenActions }: PostCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(variant === 'detail');
  const setReaction = useSetReaction(post.id);
  const heartAnim = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);

  function openAuthor() {
    router.push({ pathname: '/user/[id]', params: { id: post.author.id } });
  }

  function handleDoubleTap() {
    // Double tap only ever applies the heart - never un-reacts, which would
    // be a confusing outcome for a gesture that reads as purely additive.
    if (post.reactions.mine !== '❤️') {
      setReaction.mutate('❤️');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setShowHeart(true);
    heartAnim.setValue(0);
    Animated.timing(heartAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowHeart(false);
    });
  }

  const heartOpacity = heartAnim.interpolate({
    inputRange: [0, 0.15, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });
  const heartScale = heartAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.6, 1.1, 1],
  });

  return (
    <View style={[styles.card, variant === 'feed' && styles.feedHairline]}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerIdentity}
          onPress={openAuthor}
          accessibilityRole="link"
          accessibilityLabel={`View ${post.author.username}'s profile`}
        >
          <Avatar uri={post.author.profileImage} username={post.author.username} size={34} />
          <Text variant="strong">{post.author.username}</Text>
          <Readout variant="readoutSm" color="textFaint">
            {relativeTime(post.createdAt)}
          </Readout>
        </Pressable>
        {onOpenActions && (
          <IconButton
            name="more-horizontal"
            onPress={() => onOpenActions(post)}
            label="Post options"
          />
        )}
      </View>

      <View>
        <PostImageCarousel
          images={post.images}
          index={imageIndex}
          onIndexChange={setImageIndex}
          onDoubleTap={handleDoubleTap}
        />
        {showHeart && (
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.heart,
              { opacity: heartOpacity, transform: [{ scale: heartScale }] },
            ]}
          >
            ❤️
          </Animated.Text>
        )}
      </View>

      <CookedStamp recipe={post.recipe} />

      <ReactionBar
        postId={post.id}
        reactions={post.reactions}
        commentCount={post.commentCount}
        onOpenComments={() => onOpenComments(post.id)}
      />

      {post.caption !== null && (
        <View style={styles.captionBlock}>
          <Text
            variant="body"
            numberOfLines={variant === 'feed' && !isCaptionExpanded ? 2 : undefined}
          >
            <Text variant="strong">{post.author.username} </Text>
            {post.caption}
          </Text>
          {variant === 'feed' && !isCaptionExpanded && (
            <Pressable
              onPress={() => setIsCaptionExpanded(true)}
              accessibilityRole="button"
              accessibilityLabel="Show full caption"
            >
              <Text variant="body" color="textMuted">
                more
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {variant === 'feed' && post.commentCount > 0 && (
        <Pressable
          onPress={() => onOpenComments(post.id)}
          style={styles.viewAllComments}
          accessibilityRole="button"
          accessibilityLabel={`View all ${post.commentCount} comments`}
        >
          <Text variant="bodySm" color="textMuted">
            {`View all ${formatCount(post.commentCount)} comments`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export const PostCard = React.memo(PostCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  },
  feedHairline: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: space.lg,
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  heart: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 88,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  captionBlock: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  viewAllComments: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
});
