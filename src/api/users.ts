import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, request } from './client';
import { keys } from './keys';
import { usePagedQuery } from './paging';
import {
  authResultSchema,
  meSchema,
  pageSchema,
  postSchema,
  publicProfileSchema,
  publicUserSchema,
  recipeSummarySchema,
  userSummarySchema,
  type AuthResult,
  type Me,
  type Post,
  type PublicProfile,
  type PublicUser,
  type RecipeSummary,
  type UserSummary,
} from './schemas';

export function register(body: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  return request('/auth/register', {
    method: 'POST',
    body,
    schema: authResultSchema,
    skipAuth: true,
  });
}

export function login(body: { email: string; password: string }): Promise<AuthResult> {
  return request('/auth/login', { method: 'POST', body, schema: authResultSchema, skipAuth: true });
}

export function logout(refreshToken: string): Promise<void> {
  return request('/auth/logout', { method: 'POST', body: { refreshToken } });
}

export function fetchMe(): Promise<Me> {
  return request('/users/me', { schema: meSchema });
}

export function fetchProfile(userId: string): Promise<PublicProfile> {
  return request(`/users/${userId}`, { schema: publicProfileSchema });
}

export function useProfile(userId: string | undefined) {
  const id = userId ?? '';
  return useQuery({
    queryKey: keys.users.profile(id),
    queryFn: () => fetchProfile(id),
    enabled: id.length > 0,
  });
}

export function useUserSearch(search: string) {
  return usePagedQuery<PublicUser>({
    queryKey: keys.users.search(search),
    fetchPage: (cursor) =>
      request('/users', {
        query: { search: search || undefined, cursor, limit: 20 },
        schema: pageSchema(publicUserSchema),
      }),
  });
}

export function useFollowers(userId: string) {
  return usePagedQuery<UserSummary>({
    queryKey: keys.users.followers(userId),
    fetchPage: (cursor) =>
      request(`/users/${userId}/followers`, {
        query: { cursor, limit: 30 },
        schema: pageSchema(userSummarySchema),
      }),
  });
}

export function useFollowing(userId: string) {
  return usePagedQuery<UserSummary>({
    queryKey: keys.users.following(userId),
    fetchPage: (cursor) =>
      request(`/users/${userId}/following`, {
        query: { cursor, limit: 30 },
        schema: pageSchema(userSummarySchema),
      }),
  });
}

export function useUserPosts(userId: string | undefined) {
  const id = userId ?? '';
  return usePagedQuery<Post>({
    queryKey: keys.posts.byUser(id),
    enabled: id.length > 0,
    fetchPage: (cursor) =>
      request(`/users/${id}/posts`, {
        query: { cursor, limit: 24 },
        schema: pageSchema(postSchema),
      }),
  });
}

export function useUserRecipes(userId: string | undefined) {
  const id = userId ?? '';
  return usePagedQuery<RecipeSummary>({
    queryKey: keys.recipes.byUser(id),
    enabled: id.length > 0,
    fetchPage: (cursor) =>
      request(`/users/${id}/recipes`, {
        query: { cursor, limit: 24 },
        schema: pageSchema(recipeSummarySchema),
      }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { username?: string; profileImage?: string | null }) =>
      request('/users/me', { method: 'PATCH', body, schema: meSchema }),
    onSuccess: (me) => {
      queryClient.setQueryData(keys.me, me);
      void queryClient.invalidateQueries({ queryKey: keys.users.profile(me.id) });
    },
  });
}

/**
 * Follow is idempotent from the caller's side: the server answers 409 when
 * the follow already exists, which means the intent is already satisfied.
 */
export function useToggleFollow(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (isFollowing) {
        await request(`/users/${userId}/follow`, { method: 'DELETE' });
        return;
      }
      try {
        await request(`/users/${userId}/follow`, { method: 'POST' });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.users.root });
      void queryClient.invalidateQueries({ queryKey: keys.posts.feed });
    },
  });
}
