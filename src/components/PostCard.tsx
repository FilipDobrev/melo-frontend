import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Post } from '../api/schemas';
import { Avatar } from './Avatar';

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={{ pathname: '/post/[id]', params: { id: post.id } }} asChild>
      <TouchableOpacity style={styles.card}>
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

        {post.recipe ? (
          <View style={styles.recipeChip}>
            <Text style={styles.recipeChipText}>{post.recipe.title}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.meta}>
            {post.reactions.total} reaction{post.reactions.total === 1 ? '' : 's'}
          </Text>
          <Text style={styles.meta}>
            {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
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
  footer: {
    flexDirection: 'row',
    gap: 16,
    padding: 12,
  },
  meta: {
    fontSize: 13,
    color: '#6B6155',
  },
});
