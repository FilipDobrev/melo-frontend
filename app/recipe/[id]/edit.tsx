import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Screen } from '../../../src/ui/Screen';
import { ScreenHeader } from '../../../src/ui/ScreenHeader';
import { StateView } from '../../../src/ui/StateView';
import { EmptyState } from '../../../src/ui/EmptyState';
import { useCurrentUser } from '../../../src/auth/AuthContext';
import { useRecipe, useUpdateRecipe } from '../../../src/api/recipes';
import { RecipeForm } from '../../../src/features/recipes/RecipeForm';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error, refetch } = useRecipe(id);
  const currentUser = useCurrentUser();
  const updateRecipe = useUpdateRecipe(id);

  const isOwner = !!recipe && !!currentUser && recipe.owner.id === currentUser.id;

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Edit recipe" onBack={() => router.back()} />
      <StateView isLoading={isLoading} error={error} onRetry={() => void refetch()}>
        {recipe && !isOwner && (
          <EmptyState
            title="You can't edit this recipe"
            body="Only its author can."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        )}
        {recipe && isOwner && (
          <RecipeForm
            initial={recipe}
            submitLabel="Save changes"
            submitting={updateRecipe.isPending}
            error={updateRecipe.error}
            onSubmit={async (input) => {
              await updateRecipe.mutateAsync(input);
              router.back();
            }}
          />
        )}
      </StateView>
    </Screen>
  );
}
