import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/Text';
import { colors, radius, space } from '../../theme/theme';
import { useImagePresets } from '../../api/recipes';

export type RecipeImageValue = { kind: 'preset'; slug: string } | { kind: 'upload'; uri: string } | null;

interface RecipeImagePickerProps {
  value: RecipeImageValue;
  onChange: (next: RecipeImageValue) => void;
}

const TILE_SIZE = 96;

export function RecipeImagePicker({ value, onChange }: RecipeImagePickerProps) {
  const { data: presets } = useImagePresets();

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Melo needs photo access to use your own picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return;

    onChange({ kind: 'upload', uri: result.assets[0].uri });
  }

  const uploadUri = value?.kind === 'upload' ? value.uri : null;

  return (
    <View>
      <Text variant="label" color="textMuted" style={styles.label}>
        PICTURE
      </Text>
      <Text variant="bodySm" color="textMuted" style={styles.hint}>
        Pick one of ours, or use your own.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScroll}
        contentContainerStyle={styles.row}
      >
        <Pressable
          onPress={pickFromLibrary}
          accessibilityRole="button"
          accessibilityLabel="Upload your own picture"
          style={[styles.tile, value?.kind === 'upload' && styles.tileSelected]}
        >
          {uploadUri ? (
            <Image source={{ uri: uploadUri }} contentFit="cover" style={styles.tileImage} />
          ) : (
            <View style={[styles.tileImage, styles.uploadPlaceholder]}>
              <Feather name="upload" size={20} color={colors.textMuted} />
              <Text variant="bodySm" color="textMuted">
                Upload
              </Text>
            </View>
          )}
          {value?.kind === 'upload' && <SelectedBadge />}
        </Pressable>

        {(presets ?? []).map((preset) => {
          const selected = value?.kind === 'preset' && value.slug === preset.slug;
          return (
            <View key={preset.slug} style={styles.presetColumn}>
              <Pressable
                onPress={() => onChange({ kind: 'preset', slug: preset.slug })}
                accessibilityRole="button"
                accessibilityLabel={preset.label}
                style={[styles.tile, selected && styles.tileSelected]}
              >
                <Image source={{ uri: preset.url }} contentFit="cover" style={styles.tileImage} />
                {selected && <SelectedBadge />}
              </Pressable>
              <Text variant="bodySm" color="textMuted" numberOfLines={1} style={styles.presetLabel}>
                {preset.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SelectedBadge() {
  return (
    <View style={styles.badge}>
      <Feather name="check" size={12} color={colors.textInverse} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: space.xs,
  },
  hint: {
    marginBottom: space.sm,
  },
  // A ScrollView defaults to flexGrow 1; pinned to 0 so a horizontal one can
  // never claim vertical space beyond its single row of tiles.
  rowScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    gap: space.sm,
  },
  presetColumn: {
    width: TILE_SIZE,
  },
  presetLabel: {
    marginTop: space.xs,
    textAlign: 'center',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.slab,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
