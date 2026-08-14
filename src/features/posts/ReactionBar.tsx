import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useClearReaction, useSetReaction } from '../../api/posts';
import type { Post } from '../../api/schemas';
import { colors, HIT_SLOP, radius, shadow, space } from '../../theme/theme';
import { IconButton } from '../../ui/IconButton';
import { Readout, Text } from '../../ui/Text';

const EMOJI_SET = ['❤️', '😋', '🔥', '👍', '😍'];

interface ReactionBarProps {
  postId: string;
  reactions: Post['reactions'];
  commentCount: number;
  onOpenComments: () => void;
}

function sortedReactions(byEmoji: Record<string, number>): [string, number][] {
  return Object.entries(byEmoji).sort(([emojiA, countA], [emojiB, countB]) => {
    if (countA !== countB) return countB - countA;
    return EMOJI_SET.indexOf(emojiA) - EMOJI_SET.indexOf(emojiB);
  });
}

export function ReactionBar({ postId, reactions, commentCount, onOpenComments }: ReactionBarProps) {
  const setReaction = useSetReaction(postId);
  const clearReaction = useClearReaction(postId);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerAnim = useRef(new Animated.Value(0)).current;

  function react(emoji: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reactions.mine === emoji) clearReaction.mutate();
    else setReaction.mutate(emoji);
  }

  function togglePicker() {
    const nextOpen = !isPickerOpen;
    setIsPickerOpen(nextOpen);

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      Animated.timing(pickerAnim, {
        toValue: nextOpen ? 1 : 0,
        duration: reduceMotion ? 0 : 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }

  function pickFromPicker(emoji: string) {
    react(emoji);
    setIsPickerOpen(false);
    pickerAnim.setValue(0);
  }

  const entries = sortedReactions(reactions.byEmoji);

  return (
    <View>
      <View style={styles.row}>
        {entries.map(([emoji, count]) => {
          const isMine = emoji === reactions.mine;
          return (
            <Pressable
              key={emoji}
              onPress={() => react(emoji)}
              style={[styles.pill, isMine ? styles.pillMine : styles.pillOther]}
              accessibilityRole="button"
              accessibilityLabel={`${emoji} reaction, ${count}${isMine ? ', your reaction' : ''}`}
            >
              <Text variant="bodySm">{emoji}</Text>
              <Readout variant="readoutSm">{count}</Readout>
            </Pressable>
          );
        })}
        <IconButton name="plus" onPress={togglePicker} label="React" size={18} />
        <Pressable
          onPress={onOpenComments}
          style={styles.commentButton}
          accessibilityRole="button"
          accessibilityLabel={`${commentCount} comments`}
          hitSlop={HIT_SLOP}
        >
          <Feather name="message-circle" size={18} color={colors.text} />
          <Readout variant="readoutSm">{commentCount}</Readout>
        </Pressable>
      </View>
      {isPickerOpen && (
        <Animated.View
          style={[
            styles.picker,
            {
              opacity: pickerAnim,
              transform: [{ translateY: pickerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
            },
          ]}
        >
          {EMOJI_SET.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => pickFromPicker(emoji)}
              style={[styles.pickerEmoji, emoji === reactions.mine && styles.pickerEmojiActive]}
              accessibilityRole="button"
              accessibilityLabel={`React with ${emoji}`}
            >
              <Text variant="displaySm">{emoji}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    height: 30,
  },
  pillMine: {
    backgroundColor: colors.accentTint,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  pillOther: {
    backgroundColor: colors.slab,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginLeft: 'auto',
  },
  picker: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginHorizontal: space.lg,
    marginBottom: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.md,
    ...shadow.lift,
  },
  pickerEmoji: {
    borderRadius: radius.pill,
    padding: space.xs,
  },
  pickerEmojiActive: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
});
