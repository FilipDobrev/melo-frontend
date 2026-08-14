import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Field } from '../../ui/Field';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Readout, Text } from '../../ui/Text';
import { Sheet } from '../../ui/Sheet';
import { colors, radius, space, type } from '../../theme/theme';
import { errorMessage } from '../../api/client';
import { UNIT_LABELS, UNIT_OPTIONS } from '../../lib/format';
import { uploadImage } from '../../lib/upload';
import { requestRecipeImageUpload, type RecipeInput } from '../../api/recipes';
import type { Product, RecipeDetail, Unit } from '../../api/schemas';
import { CategoryPicker } from './CategoryPicker';
import { RecipeImagePicker, type RecipeImageValue } from './RecipeImagePicker';
import { ProductPickerSheet } from './ProductPickerSheet';
import { CreateProductSheet } from './CreateProductSheet';

interface IngredientRowState {
  key: string;
  product: Product;
  quantity: string;
  unit: Unit;
}

interface RecipeFormProps {
  initial?: RecipeDetail;
  onSubmit: (input: RecipeInput) => Promise<void>;
  submitLabel: string;
  submitting: boolean;
  error?: unknown;
}

interface FormErrors {
  title?: string;
  description?: string;
  instructions?: string;
  ingredients?: string;
}

function ingredientKey(productId: string): string {
  return `${productId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function RecipeForm({ initial, onSubmit, submitLabel, submitting, error }: RecipeFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [categorySlugs, setCategorySlugs] = useState<string[]>(
    initial?.categories.map((category) => category.slug) ?? [],
  );
  // The API never returns imageKey, only imageUrl - an edit that does not
  // touch the picture must omit imageKey entirely, so this starts null even
  // when editing an existing recipe.
  const [image, setImage] = useState<RecipeImageValue>(null);
  const [ingredients, setIngredients] = useState<IngredientRowState[]>(
    initial?.ingredients.map((ingredient) => ({
      key: ingredient.id,
      product: ingredient.product,
      quantity: String(ingredient.quantity),
      unit: ingredient.unit,
    })) ?? [],
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [ingredientErrorKeys, setIngredientErrorKeys] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);

  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [createProductVisible, setCreateProductVisible] = useState(false);
  const [unitSheetKey, setUnitSheetKey] = useState<string | null>(null);

  function updateIngredientQuantity(key: string, quantity: string) {
    setIngredients((rows) => rows.map((row) => (row.key === key ? { ...row, quantity } : row)));
  }

  function updateIngredientUnit(key: string, unit: Unit) {
    setIngredients((rows) => rows.map((row) => (row.key === key ? { ...row, unit } : row)));
  }

  function removeIngredient(key: string) {
    setIngredients((rows) => rows.filter((row) => row.key !== key));
  }

  function addProduct(product: Product) {
    setIngredients((rows) => [...rows, { key: ingredientKey(product.id), product, quantity: '', unit: 'GRAM' }]);
  }

  function validate(): RecipeInput['ingredients'] | null {
    const nextErrors: FormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedInstructions = instructions.trim();

    if (trimmedTitle.length < 1 || trimmedTitle.length > 150) {
      nextErrors.title = 'Title must be 1-150 characters.';
    }
    if (trimmedDescription.length < 1 || trimmedDescription.length > 2000) {
      nextErrors.description = 'Description must be 1-2000 characters.';
    }
    if (trimmedInstructions.length < 1 || trimmedInstructions.length > 10000) {
      nextErrors.instructions = 'Instructions must be 1-10000 characters.';
    }
    if (ingredients.length === 0) {
      nextErrors.ingredients = 'Add at least one ingredient.';
    }

    const badKeys = new Set<string>();
    const parsedIngredients: RecipeInput['ingredients'] = [];
    for (const row of ingredients) {
      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        badKeys.add(row.key);
      } else {
        parsedIngredients.push({ productId: row.product.id, quantity, unit: row.unit });
      }
    }
    if (badKeys.size > 0) {
      nextErrors.ingredients = 'Every ingredient needs a quantity greater than 0.';
    }

    setErrors(nextErrors);
    setIngredientErrorKeys(badKeys);

    if (Object.keys(nextErrors).length > 0) return null;
    return parsedIngredients;
  }

  async function resolveImageKey(): Promise<string | undefined> {
    if (!image) return undefined;
    if (image.kind === 'preset') return `preset:${image.slug}`;

    setUploading(true);
    try {
      return await uploadImage(image.uri, requestRecipeImageUpload);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    const parsedIngredients = validate();
    if (!parsedIngredients) return;

    const imageKey = await resolveImageKey();

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      categorySlugs,
      ingredients: parsedIngredients,
      ...(imageKey ? { imageKey } : {}),
    });
  }

  const unitSheetRow = ingredients.find((row) => row.key === unitSheetKey);
  const isBusy = submitting || uploading;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {initial && (
        <View style={styles.currentImage}>
          <Image source={{ uri: initial.imageUrl }} contentFit="cover" style={styles.currentImageThumb} />
          <Text variant="bodySm" color="textMuted">
            Currently used
          </Text>
        </View>
      )}
      <RecipeImagePicker value={image} onChange={setImage} />

      <Field label="Title" value={title} onChangeText={setTitle} error={errors.title} />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
      />

      <CategoryPicker selected={categorySlugs} onChange={setCategorySlugs} />

      <View>
        <Text variant="label" color="textMuted" style={styles.sectionLabel}>
          INGREDIENTS
        </Text>
        {ingredients.map((row) => (
          <View key={row.key} style={styles.ingredientRow}>
            <Text variant="body" numberOfLines={1} style={styles.ingredientName}>
              {row.product.name}
            </Text>
            <View
              style={[
                styles.quantityInputWrap,
                ingredientErrorKeys.has(row.key) && styles.quantityInputError,
              ]}
            >
              <TextInput
                value={row.quantity}
                onChangeText={(text) => updateIngredientQuantity(row.key, text)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textFaint}
                accessibilityLabel={`${row.product.name} quantity`}
                style={styles.quantityInputText}
              />
            </View>
            <Pressable
              onPress={() => setUnitSheetKey(row.key)}
              accessibilityRole="button"
              accessibilityLabel={`Unit: ${UNIT_LABELS[row.unit]}`}
              style={styles.unitPill}
            >
              <Text variant="bodySm">{UNIT_LABELS[row.unit]}</Text>
            </Pressable>
            <IconButton
              name="x"
              onPress={() => removeIngredient(row.key)}
              label={`Remove ${row.product.name}`}
            />
          </View>
        ))}
        {errors.ingredients && (
          <Text variant="bodySm" color="danger" style={styles.ingredientsError}>
            {errors.ingredients}
          </Text>
        )}
        <Button
          variant="secondary"
          icon="plus"
          title="Add ingredient"
          onPress={() => setProductPickerVisible(true)}
        />
      </View>

      <Field
        label="Instructions"
        value={instructions}
        onChangeText={setInstructions}
        error={errors.instructions}
        multiline
        numberOfLines={8}
      />

      {Boolean(error) && (
        <Text variant="bodySm" color="danger">
          {errorMessage(error)}
        </Text>
      )}

      <Button
        title={uploading ? 'Uploading picture…' : submitLabel}
        onPress={() => void handleSubmit()}
        loading={isBusy}
        disabled={isBusy}
        stretch
        size="lg"
      />

      <ProductPickerSheet
        visible={productPickerVisible}
        onClose={() => setProductPickerVisible(false)}
        onPick={addProduct}
        onRequestCreate={() => {
          setProductPickerVisible(false);
          setCreateProductVisible(true);
        }}
      />

      <CreateProductSheet
        visible={createProductVisible}
        onClose={() => setCreateProductVisible(false)}
        onCreated={(product) => {
          addProduct(product);
          setCreateProductVisible(false);
        }}
      />

      <Sheet visible={unitSheetKey !== null} onClose={() => setUnitSheetKey(null)} title="Unit" heightRatio={0.5}>
        <ScrollView>
          {UNIT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                if (unitSheetRow) updateIngredientUnit(unitSheetRow.key, option.value);
                setUnitSheetKey(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              style={styles.unitOptionRow}
            >
              <Text variant="body">{option.label}</Text>
              {unitSheetRow?.unit === option.value && (
                <Feather name="check" size={18} color={colors.accent} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.xl,
  },
  currentImage: {
    gap: space.xs,
  },
  currentImageThumb: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.slab,
  },
  sectionLabel: {
    marginBottom: space.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
  },
  ingredientName: {
    flex: 1,
  },
  quantityInputWrap: {
    width: 72,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  quantityInputError: {
    borderColor: colors.danger,
  },
  quantityInputText: {
    ...type.readout,
    color: colors.text,
    textAlign: 'right',
    padding: 0,
  },
  unitPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.slab,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  ingredientsError: {
    marginTop: space.xs,
    marginBottom: space.sm,
  },
  unitOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
