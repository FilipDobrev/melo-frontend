import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/Avatar';
import { ApiError } from '../../src/api/client';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username ?? '');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return null;
  }

  const hasChanges = username.trim() !== user.username || profileImage.trim() !== (user.profileImage ?? '');

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await updateProfile({
        username: username.trim() !== user!.username ? username.trim() : undefined,
        profileImage: profileImage.trim() !== (user!.profileImage ?? '') ? profileImage.trim() : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatarRow}>
        <Avatar uri={profileImage || null} username={username || user.username} size="large" />
      </View>

      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

      <Text style={styles.label}>Profile image URL</Text>
      <TextInput
        style={styles.input}
        value={profileImage}
        onChangeText={setProfileImage}
        autoCapitalize="none"
        placeholder="https://..."
      />

      <Text style={styles.email}>{user.email}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (!hasChanges || isSaving) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!hasChanges || isSaving}
      >
        <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save changes'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2620',
    marginBottom: 16,
  },
  avatarRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  email: {
    fontSize: 13,
    color: '#8A7F70',
    marginBottom: 16,
  },
  error: {
    color: '#C0392B',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#B5541A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#C0392B',
    fontWeight: '600',
  },
});
