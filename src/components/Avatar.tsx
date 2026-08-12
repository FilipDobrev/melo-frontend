import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

const SIZES = { small: 32, medium: 48, large: 96 } as const;

type Props = {
  uri: string | null;
  username: string;
  size?: keyof typeof SIZES;
};

export function Avatar({ uri, username, size = 'medium' }: Props) {
  const dimension = SIZES[size];
  const style = { width: dimension, height: dimension, borderRadius: dimension / 2 };

  if (uri) {
    return <Image source={{ uri }} style={style} contentFit="cover" />;
  }

  return (
    <View style={[styles.placeholder, style]}>
      <Text style={[styles.initial, { fontSize: dimension / 2.4 }]}>
        {username.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#D9CFC1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#4A3F35',
    fontWeight: '600',
  },
});
