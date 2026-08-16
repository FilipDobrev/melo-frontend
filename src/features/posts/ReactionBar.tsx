import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useClearReaction, useSetReaction } from '../../api/posts';
import type { Post } from '../../api/schemas';
import { colors, HIT_SLOP, radius, shadow, space } from '../../theme/theme';
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

  function setPickerOpen(nextOpen: boolean) {
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

  function handleTap() {
    if (reactions.mine) clearReaction.mutate();
    else setReaction.mutate('❤️');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleLongPress() {
    setPickerOpen(!isPickerOpen);
  }

  function pickFromPicker(emoji: string) {
    react(emoji);
    setPickerOpen(false);
  }

  const entries = sortedReactions(reactions.byEmoji);
  const glyphEntries =
    entries.length === 1 && entries[0][0] === reactions.mine ? [] : entries.slice(0, 3);

  const reactionLabel = reactions.mine
    ? `Remove your ${reactions.mine} reaction. Long press for more reaction options.`
    : 'React with a heart. Long press for more reaction options.';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={handleTap}
          onLongPress={handleLongPress}
          delayLongPress={250}
          style={styles.reactionControl}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={reactionLabel}
        >
          {reactions.mine ? (
            <Text variant="displayMd">{reactions.mine}</Text>
          ) : (
            <MaterialIcons name="favorite-border" size={20} color={colors.text} />
          )}
        </Pressable>
        {reactions.total > 0 && <Readout variant="readoutSm">{reactions.total}</Readout>}
        {glyphEntries.map(([emoji]) => (
          <Text key={emoji} variant="bodySm">
            {emoji}
          </Text>
        ))}
        <Pressable
          onPress={onOpenComments}
          style={styles.commentButton}
          accessibilityRole="button"
          accessibilityLabel={`${commentCount} comments`}
          hitSlop={HIT_SLOP}
        >
          <MaterialIcons name="chat-bubble-outline" size={20} color={colors.text} />
          <Readout variant="readoutSm">{commentCount}</Readout>
        </Pressable>
      </View>
      {isPickerOpen && (
        // Absolutely positioned and anchored to the row's bottom edge so the
        // picker floats over the card instead of adding layout height to it.
        <Animated.View
          style={[
            styles.picker,
            {
              opacity: pickerAnim,
              transform: [{ scale: pickerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
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
              <Text variant="displayMd">{emoji}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: space.xs,
  },
  reactionControl: {
    // Fixed height so reacting can't reflow the card: the outline icon is a
    // 20px glyph but the emoji uses displayMd's 24px line box (and emoji
    // often overshoot that), so without a pinned height the row grows when
    // you react. No fixed width, though: that's what previously pushed the
    // count away from the glyph, so it stays content-sized and relies on
    // hitSlop for the touch target instead of padding.
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginLeft: space.sm,
  },
  picker: {
    position: 'absolute',
    bottom: '100%',
    left: space.lg,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.md,
    ...shadow.float,
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
