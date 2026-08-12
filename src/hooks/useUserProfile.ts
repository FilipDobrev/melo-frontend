import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, followUser, unfollowUser, getUserPosts, getUserRecipes } from '../api/users.api';
import type { UserProfile } from '../api/schemas';

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfile(userId),
  });
}

export function useUserPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: ['userPosts', userId],
    queryFn: ({ pageParam }) => getUserPosts(userId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUserRecipes(userId: string) {
  return useInfiniteQuery({
    queryKey: ['userRecipes', userId],
    queryFn: ({ pageParam }) => getUserRecipes(userId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useToggleFollow(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isFollowing: boolean) => (isFollowing ? unfollowUser(userId) : followUser(userId)),
    onMutate: async (isFollowing) => {
      await queryClient.cancelQueries({ queryKey: ['userProfile', userId] });
      const previous = queryClient.getQueryData<UserProfile>(['userProfile', userId]);
      queryClient.setQueryData<UserProfile>(['userProfile', userId], (old) =>
        old
          ? {
              ...old,
              isFollowing: !isFollowing,
              followerCount: old.followerCount + (isFollowing ? -1 : 1),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _isFollowing, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['userProfile', userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });
}
