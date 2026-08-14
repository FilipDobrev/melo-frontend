import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

interface ScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], style }: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.ground }, style]}
    >
      {children}
    </SafeAreaView>
  );
}
