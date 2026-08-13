import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Post } from '../api/schemas';
import { useSetReaction } from '../hooks/usePost';
import { useToggleRecipeSaved } from '../hooks/useSaveRecipe';
import { Avatar } from './Avatar';
import { EmojiReactionRow } from './EmojiReactionRow';

export function PostCard({ post }: { post: Post }) {
  const [showPicker, setShowPicker] = useState(false);

  const setReaction = useSetReaction(post.id);
  const toggleSaved = useToggleRecipeSaved(post.id, post.recipe.id);
  const isSaved = post.recipe.isSaved;

  const reactionEntries = Object.entries(post.reactions.byEmoji).filter(([, count]) => count > 0);

  return (
    <View style={styles.card}>
      <Link href={{ pathname: '/post/[id]', params: { id: post.id } }} asChild>
        <TouchableOpacity>
          <View style={styles.header}>
            <Avatar uri={post.author.profileImage} username={post.author.username} size="small" />
            <Text style={styles.username}>{post.author.username}</Text>
          </View>

          <Image source={{ uri: post.images[0]?.url }} style={styles.image} contentFit="cover" />

          {post.caption ? (
            <Text style={styles.caption} numberOfLines={2}>
              {post.caption}
            </Text>
          ) : null}

          <View style={styles.recipeChip}>
            <Text style={styles.recipeChipText}>{post.recipe.title}</Text>
          </View>
        </TouchableOpacity>
      </Link>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowPicker((value) => !value)}>
          <Text style={styles.actionText}>{post.reactions.mine ?? '🤍'} React</Text>
        </TouchableOpacity>

        <Link href={{ pathname: '/post/[id]', params: { id: post.id, focus: 'comment' } }} asChild>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>💬 {post.commentCount}</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleSaved.mutate(isSaved)}
          disabled={toggleSaved.isPending}
        >
          <Text style={[styles.actionText, isSaved && styles.actionTextActive]}>
            {isSaved ? 'Saved' : 'Save recipe'}
          </Text>
        </TouchableOpacity>
      </View>

      {showPicker ? (
        <View style={styles.pickerWrap}>
          <EmojiReactionRow reactions={post.reactions} onSelect={(emoji) => setReaction.mutate(emoji)} />
        </View>
      ) : reactionEntries.length > 0 ? (
        <View style={styles.reactionTotals}>
          {reactionEntries.map(([emoji, count]) => (
            <Text key={emoji} style={styles.reactionTotal}>
              {emoji} {count}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5DDD0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  username: {
    fontWeight: '600',
    color: '#2B2620',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0EBE1',
  },
  caption: {
    paddingHorizontal: 12,
    paddingTop: 8,
    color: '#2B2620',
  },
  recipeChip: {
    alignSelf: 'flex-start',
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recipeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B5541A',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5DDD0',
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
  },
  actionTextActive: {
    color: '#B5541A',
  },
  pickerWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  reactionTotals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  reactionTotal: {
    fontSize: 13,
    color: '#6B6155',
  },
});
