import { router } from 'expo-router';
import React from 'react';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { useCreateRecipe } from '../../src/api/recipes';
import { RecipeForm } from '../../src/features/recipes/RecipeForm';

export default function NewRecipeScreen() {
  const createRecipe = useCreateRecipe();

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="New recipe" onBack={() => router.back()} />
      <RecipeForm
        submitLabel="Publish recipe"
        submitting={createRecipe.isPending}
        error={createRecipe.error}
        onSubmit={async (input) => {
          const created = await createRecipe.mutateAsync(input);
          router.replace({ pathname: '/recipe/[id]', params: { id: created.id } });
        }}
      />
    </Screen>
  );
}
