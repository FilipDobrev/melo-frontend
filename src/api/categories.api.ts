import { apiRequest } from './client';
import { categorySchema, type Category } from './schemas';
import { z } from 'zod';

export async function getCategories(): Promise<Category[]> {
  return apiRequest('/categories', z.array(categorySchema));
}
