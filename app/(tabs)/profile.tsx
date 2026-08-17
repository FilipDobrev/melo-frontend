import React from 'react';

import { useCurrentUser } from '../../src/auth/AuthContext';
import { AccountDeletionBanner } from '../../src/features/users/AccountDeletionBanner';
import { ProfileView } from '../../src/features/users/ProfileView';
import { Screen } from '../../src/ui/Screen';

export default function ProfileTabScreen() {
  const currentUser = useCurrentUser();

  // Null only during the brief window before the root redirect sends a
  // signed-out session to (auth) - nothing meaningful to render here.
  if (!currentUser) return null;

  return (
    <Screen>
      {/* Mounted here and on the settings screen rather than above the tab
          navigator, so it stays inside this screen's Screen safe-area
          wrapper instead of double-applying the top inset. */}
      <AccountDeletionBanner />
      <ProfileView userId={currentUser.id} />
    </Screen>
  );
}
