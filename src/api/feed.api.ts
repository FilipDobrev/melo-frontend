import { apiRequest } from './client';
import { postSchema, paginated, type Post } from './schemas';
import type { Paginated, PageParams } from './pagination';

export async function getFeed(params: PageParams): Promise<Paginated<Post>> {
  return apiRequest('/feed', paginated(postSchema), { query: params });
}
