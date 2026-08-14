import React from 'react';

import { useCurrentUser } from '../../src/auth/AuthContext';
import { ProfileView } from '../../src/features/users/ProfileView';
import { Screen } from '../../src/ui/Screen';

export default function ProfileTabScreen() {
  const currentUser = useCurrentUser();

  // Null only during the brief window before the root redirect sends a
  // signed-out session to (auth) - nothing meaningful to render here.
  if (!currentUser) return null;

  return (
    <Screen>
      <ProfileView userId={currentUser.id} />
    </Screen>
  );
}
