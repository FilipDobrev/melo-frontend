import { apiRequest, apiRequestNoContent } from './client';
import { collectionSchema, recipeSummarySchema, paginated, type Collection, type RecipeSummary } from './schemas';
import type { Paginated, PageParams } from './pagination';
import { z } from 'zod';

export async function listCollections(): Promise<Collection[]> {
  return apiRequest('/users/me/collections', z.array(collectionSchema));
}

export async function createCollection(name: string): Promise<Collection> {
  return apiRequest('/users/me/collections', collectionSchema, { method: 'POST', body: { name } });
}

export async function renameCollection(collectionId: string, name: string): Promise<Collection> {
  return apiRequest(`/users/me/collections/${collectionId}`, collectionSchema, {
    method: 'PATCH',
    body: { name },
  });
}

export async function deleteCollection(collectionId: string): Promise<void> {
  return apiRequestNoContent(`/users/me/collections/${collectionId}`, { method: 'DELETE' });
}

export async function listCollectionRecipes(
  collectionId: string,
  params: PageParams,
): Promise<Paginated<RecipeSummary>> {
  return apiRequest(`/users/me/collections/${collectionId}/recipes`, paginated(recipeSummarySchema), {
    query: { cursor: params.cursor, limit: params.limit },
  });
}

export async function addRecipeToCollection(collectionId: string, recipeId: string): Promise<void> {
  return apiRequestNoContent(`/users/me/collections/${collectionId}/recipes`, {
    method: 'POST',
    body: { recipeId },
  });
}

export async function removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<void> {
  return apiRequestNoContent(`/users/me/collections/${collectionId}/recipes/${recipeId}`, {
    method: 'DELETE',
  });
}
