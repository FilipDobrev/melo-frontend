import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  message?: string;
};

export function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A3F35" />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Text style={styles.retry} onPress={onRetry}>
          Tap to retry
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2620',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B6155',
    textAlign: 'center',
  },
  retry: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#B5541A',
  },
});
