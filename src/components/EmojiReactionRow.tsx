import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Post } from '../api/schemas';

const AVAILABLE_EMOJIS = ['❤️', '😋', '🔥', '👍', '😍'];

type Props = {
  reactions: Post['reactions'];
  onSelect: (emoji: string | null) => void;
};

export function EmojiReactionRow({ reactions, onSelect }: Props) {
  return (
    <View>
      <View style={styles.picker}>
        {AVAILABLE_EMOJIS.map((emoji) => {
          const isMine = reactions.mine === emoji;
          return (
            <TouchableOpacity
              key={emoji}
              style={[styles.emojiButton, isMine && styles.emojiButtonActive]}
              onPress={() => onSelect(isMine ? null : emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {reactions.total > 0 ? (
        <View style={styles.summary}>
          {Object.entries(reactions.byEmoji)
            .filter(([, count]) => count > 0)
            .map(([emoji, count]) => (
              <Text key={emoji} style={styles.summaryItem}>
                {emoji} {count}
              </Text>
            ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    gap: 8,
  },
  emojiButton: {
    padding: 6,
    borderRadius: 20,
  },
  emojiButtonActive: {
    backgroundColor: '#F5F0E8',
  },
  emoji: {
    fontSize: 20,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  summaryItem: {
    fontSize: 13,
    color: '#6B6155',
  },
});
