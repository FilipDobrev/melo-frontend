import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';

export function Divider() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: colors.line,
  },
});
