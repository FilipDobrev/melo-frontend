import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useProfile } from '../../src/api/users';
import { ProfileView } from '../../src/features/users/ProfileView';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile(id);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={profile.data?.username} onBack={() => router.back()} />
      <ProfileView userId={id} />
    </Screen>
  );
}
