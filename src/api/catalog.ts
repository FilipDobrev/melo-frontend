import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { request } from './client';
import { keys } from './keys';
import { usePagedQuery } from './paging';
import { categorySchema, pageSchema, productSchema, type Product } from './schemas';

/** The category list is seeded and fixed, so it never needs revalidation. */
export function useCategories() {
  return useQuery({
    queryKey: keys.categories,
    queryFn: () => request('/categories', { schema: z.array(categorySchema) }),
    staleTime: Infinity,
  });
}

export function useProductSearch(search: string) {
  return usePagedQuery<Product>({
    queryKey: keys.products(search),
    fetchPage: (cursor) =>
      request('/products', { query: { search: search || undefined, cursor, limit: 20 }, schema: pageSchema(productSchema) }),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      caloriesPer100g: number;
      proteinPer100g: number;
      carbsPer100g: number;
      fatPer100g: number;
      /** Part of the carb figure, not a separate macro. Server defaults it to 0. */
      sugarPer100g?: number;
      densityGPerMl?: number;
      gramsPerPiece?: number;
    }) => request('/products', { method: 'POST', body: input, schema: productSchema }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
