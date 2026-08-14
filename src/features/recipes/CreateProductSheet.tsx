import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Sheet } from '../../ui/Sheet';
import { Field } from '../../ui/Field';
import { Button } from '../../ui/Button';
import { Text } from '../../ui/Text';
import { space } from '../../theme/theme';
import { errorMessage } from '../../api/client';
import { useCreateProduct } from '../../api/catalog';
import type { Product } from '../../api/schemas';

interface CreateProductSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}

interface FormErrors {
  name?: string;
  caloriesPer100g?: string;
  proteinPer100g?: string;
  carbsPer100g?: string;
  fatPer100g?: string;
}

/** Parses a numeric field: empty/NaN/negative all fail, everything else passes through. */
function parseNonNegative(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text);
  if (Number.isNaN(value) || value < 0) return null;
  return value;
}

function parseOptionalPositive(text: string): number | undefined {
  if (text.trim() === '') return undefined;
  const value = Number(text);
  if (Number.isNaN(value) || value < 0) return undefined;
  return value;
}

export function CreateProductSheet({ visible, onClose, onCreated }: CreateProductSheetProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [density, setDensity] = useState('');
  const [gramsPerPiece, setGramsPerPiece] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const createProduct = useCreateProduct();

  function reset() {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setDensity('');
    setGramsPerPiece('');
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      nextErrors.name = 'Name must be 1-100 characters.';
    }

    const caloriesValue = parseNonNegative(calories);
    if (caloriesValue === null) nextErrors.caloriesPer100g = 'Enter calories per 100 g.';
    const proteinValue = parseNonNegative(protein);
    if (proteinValue === null) nextErrors.proteinPer100g = 'Enter protein per 100 g.';
    const carbsValue = parseNonNegative(carbs);
    if (carbsValue === null) nextErrors.carbsPer100g = 'Enter carbs per 100 g.';
    const fatValue = parseNonNegative(fat);
    if (fatValue === null) nextErrors.fatPer100g = 'Enter fat per 100 g.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const product = await createProduct.mutateAsync({
        name: trimmedName,
        caloriesPer100g: caloriesValue as number,
        proteinPer100g: proteinValue as number,
        carbsPer100g: carbsValue as number,
        fatPer100g: fatValue as number,
        densityGPerMl: parseOptionalPositive(density),
        gramsPerPiece: parseOptionalPositive(gramsPerPiece),
      });
      reset();
      onCreated(product);
      onClose();
    } catch (error) {
      // A 409 means the name is taken; surface it on the name field either way
      // since that is the only field the create form validates server-side.
      setErrors({ name: errorMessage(error) });
    }
  }

  return (
    <Sheet visible={visible} onClose={handleClose} title="Add a product" heightRatio={0.9}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Name" value={name} onChangeText={setName} error={errors.name} />
        <Field
          label="Calories per 100 g"
          value={calories}
          onChangeText={setCalories}
          error={errors.caloriesPer100g}
          keyboardType="decimal-pad"
        />
        <Field
          label="Protein per 100 g"
          value={protein}
          onChangeText={setProtein}
          error={errors.proteinPer100g}
          keyboardType="decimal-pad"
        />
        <Field
          label="Carbs per 100 g"
          value={carbs}
          onChangeText={setCarbs}
          error={errors.carbsPer100g}
          keyboardType="decimal-pad"
        />
        <Field
          label="Fat per 100 g"
          value={fat}
          onChangeText={setFat}
          error={errors.fatPer100g}
          keyboardType="decimal-pad"
        />
        <Field
          label="Grams per millilitre (optional)"
          value={density}
          onChangeText={setDensity}
          hint="Needed for cup and spoon measures."
          keyboardType="decimal-pad"
        />
        <Field
          label="Grams per piece (optional)"
          value={gramsPerPiece}
          onChangeText={setGramsPerPiece}
          hint="Needed to measure this in pieces."
          keyboardType="decimal-pad"
        />
        {createProduct.isError && (
          <Text variant="bodySm" color="danger">
            {errorMessage(createProduct.error)}
          </Text>
        )}
        <Button
          title="Add product"
          onPress={() => void handleSubmit()}
          loading={createProduct.isPending}
          stretch
        />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.lg,
  },
});
