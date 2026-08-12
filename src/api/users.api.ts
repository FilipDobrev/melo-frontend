import { apiRequest, apiRequestNoContent } from './client';
import {
  meSchema,
  publicUserSchema,
  userProfileSchema,
  postSchema,
  recipeSummarySchema,
  paginated,
  type Me,
  type PublicUser,
  type UserProfile,
  type Post,
  type RecipeSummary,
} from './schemas';
import type { Paginated, PageParams } from './pagination';

export async function getMe(): Promise<Me> {
  return apiRequest('/users/me', meSchema);
}

export async function updateMe(input: { username?: string; profileImage?: string }): Promise<Me> {
  return apiRequest('/users/me', meSchema, { method: 'PATCH', body: input });
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  return apiRequest(`/users/${userId}`, userProfileSchema);
}

export async function searchUsers(params: PageParams & { search?: string }): Promise<Paginated<PublicUser>> {
  return apiRequest('/users', paginated(publicUserSchema), {
    query: { search: params.search, cursor: params.cursor, limit: params.limit },
  });
}

export async function followUser(userId: string): Promise<void> {
  return apiRequestNoContent(`/users/${userId}/follow`, { method: 'POST' });
}

export async function unfollowUser(userId: string): Promise<void> {
  return apiRequestNoContent(`/users/${userId}/follow`, { method: 'DELETE' });
}

export async function getFollowers(userId: string, params: PageParams): Promise<Paginated<PublicUser>> {
  return apiRequest(`/users/${userId}/followers`, paginated(publicUserSchema), { query: params });
}

export async function getFollowing(userId: string, params: PageParams): Promise<Paginated<PublicUser>> {
  return apiRequest(`/users/${userId}/following`, paginated(publicUserSchema), { query: params });
}

export async function getUserPosts(userId: string, params: PageParams): Promise<Paginated<Post>> {
  return apiRequest(`/users/${userId}/posts`, paginated(postSchema), { query: params });
}

export async function getUserRecipes(userId: string, params: PageParams): Promise<Paginated<RecipeSummary>> {
  return apiRequest(`/users/${userId}/recipes`, paginated(recipeSummarySchema), { query: params });
}
