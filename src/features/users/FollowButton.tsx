import React from 'react';

import { useCurrentUser } from '../../auth/AuthContext';
import { useToggleFollow } from '../../api/users';
import { Button } from '../../ui/Button';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
}

export function FollowButton({ userId, isFollowing }: FollowButtonProps) {
  const currentUser = useCurrentUser();
  const toggleFollow = useToggleFollow(userId);

  // You cannot follow yourself and the server rejects it with a 400.
  if (currentUser?.id === userId) return null;

  return (
    <Button
      title={isFollowing ? 'Following' : 'Follow'}
      variant={isFollowing ? 'secondary' : 'primary'}
      size="md"
      // The only caller in this app (the profile action row) wants this
      // full-width; a fixed-width follow control would look unbalanced there.
      stretch
      loading={toggleFollow.isPending}
      onPress={() => toggleFollow.mutate(isFollowing)}
    />
  );
}
