import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Sheet } from '../../ui/Sheet';
import { Field } from '../../ui/Field';
import { EmptyState } from '../../ui/EmptyState';
import { Readout, Text } from '../../ui/Text';
import { Divider } from '../../ui/Divider';
import { space } from '../../theme/theme';
import { useProductSearch } from '../../api/catalog';
import { flattenPages } from '../../api/paging';
import type { Product } from '../../api/schemas';

interface ProductPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (product: Product) => void;
  onRequestCreate: () => void;
}

export function ProductPickerSheet({ visible, onClose, onPick, onRequestCreate }: ProductPickerSheetProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductSearch(debounced);
  const products = flattenPages(data);

  // Reset both the raw and debounced query on every dismissal (pick or
  // close) - clearing only `search` leaves the debounced value still
  // driving a stale result list until the next keystroke re-fires it.
  function handleClose() {
    setSearch('');
    setDebounced('');
    onClose();
  }

  function handlePick(product: Product) {
    onPick(product);
    handleClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Add ingredient"
      footer={
        <View style={styles.footer}>
          <Text variant="bodySm" color="textMuted">
            Can&apos;t find it?
          </Text>
          <Pressable onPress={onRequestCreate} accessibilityRole="button" accessibilityLabel="Add a product">
            <Text variant="strongSm" color="accent">
              Add a product
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.searchField}>
        <Field
          label="Search"
          placeholder="Flour, butter, chicken…"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          <EmptyState
            title="No products match"
            body="Try a simpler word, or add the product yourself."
            actionLabel="Add a product"
            onAction={onRequestCreate}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePick(item)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            style={styles.row}
          >
            <Text variant="body">{item.name}</Text>
            <Readout variant="readoutSm" color="textMuted">
              {`${Math.round(item.caloriesPer100g)} kcal / 100 g`}
            </Readout>
          </Pressable>
        )}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  searchField: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.md,
  },
});
