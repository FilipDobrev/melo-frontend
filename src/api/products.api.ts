import { apiRequest } from './client';
import { productSchema, paginated, type Product } from './schemas';
import type { Paginated, PageParams } from './pagination';

export async function searchProducts(params: PageParams & { search?: string }): Promise<Paginated<Product>> {
  return apiRequest('/products', paginated(productSchema), {
    query: { search: params.search, cursor: params.cursor, limit: params.limit },
  });
}

export async function getProduct(productId: string): Promise<Product> {
  return apiRequest(`/products/${productId}`, productSchema);
}

export async function createProduct(input: {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  densityGPerMl?: number;
  gramsPerPiece?: number;
}): Promise<Product> {
  return apiRequest('/products', productSchema, { method: 'POST', body: input });
}
