import { apiRequest, apiRequestNoContent } from './client';
import { recipeSummarySchema, recipeDetailSchema, paginated, type RecipeSummary, type RecipeDetail, type Unit } from './schemas';
import type { Paginated, PageParams } from './pagination';

export type RecipeIngredientInput = {
  productId: string;
  quantity: number;
  unit: Unit;
};

export type CreateRecipeInput = {
  title: string;
  description: string;
  instructions: string;
  ingredients: RecipeIngredientInput[];
  categorySlugs: string[];
};

export type RecipeSort = 'newest' | 'oldest' | 'popular';

export async function searchRecipes(
  params: PageParams & { search?: string; categorySlugs?: string[]; sort?: RecipeSort },
): Promise<Paginated<RecipeSummary>> {
  return apiRequest('/recipes', paginated(recipeSummarySchema), {
    query: {
      search: params.search,
      categorySlugs: params.categorySlugs?.length ? params.categorySlugs.join(',') : undefined,
      sort: params.sort,
      cursor: params.cursor,
      limit: params.limit,
    },
  });
}

export async function getRecipe(recipeId: string): Promise<RecipeDetail> {
  return apiRequest(`/recipes/${recipeId}`, recipeDetailSchema);
}

export async function createRecipe(input: CreateRecipeInput): Promise<RecipeDetail> {
  return apiRequest('/recipes', recipeDetailSchema, { method: 'POST', body: input });
}

export async function updateRecipe(
  recipeId: string,
  input: Partial<CreateRecipeInput>,
): Promise<RecipeDetail> {
  return apiRequest(`/recipes/${recipeId}`, recipeDetailSchema, { method: 'PATCH', body: input });
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  return apiRequestNoContent(`/recipes/${recipeId}`, { method: 'DELETE' });
}

export async function saveRecipe(recipeId: string): Promise<void> {
  return apiRequestNoContent(`/recipes/${recipeId}/save`, { method: 'POST' });
}

export async function unsaveRecipe(recipeId: string): Promise<void> {
  return apiRequestNoContent(`/recipes/${recipeId}/save`, { method: 'DELETE' });
}

export async function getCookbook(
  params: PageParams & { categorySlugs?: string[] },
): Promise<Paginated<RecipeSummary>> {
  return apiRequest('/users/me/cookbook', paginated(recipeSummarySchema), {
    query: {
      categorySlugs: params.categorySlugs?.length ? params.categorySlugs.join(',') : undefined,
      cursor: params.cursor,
      limit: params.limit,
    },
  });
}
