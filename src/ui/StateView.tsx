import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';
import { EmptyState } from './EmptyState';

interface StateViewProps {
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: React.ReactNode;
  emptyWhen?: boolean;
  empty?: React.ReactNode;
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Check your connection and try again.';
}

export function StateView({
  isLoading,
  error,
  onRetry,
  children,
  emptyWhen = false,
  empty,
}: StateViewProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Couldn't load this"
          body={describeError(error)}
          actionLabel={onRetry ? 'Try again' : undefined}
          onAction={onRetry}
        />
      </View>
    );
  }

  if (emptyWhen) {
    return <>{empty}</>;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
