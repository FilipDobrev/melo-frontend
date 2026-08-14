import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { errorMessage } from '../../src/api/client';
import { Button } from '../../src/ui/Button';
import { Field } from '../../src/ui/Field';
import { IconButton } from '../../src/ui/IconButton';
import { Screen } from '../../src/ui/Screen';
import { Text } from '../../src/ui/Text';
import { space } from '../../src/theme/theme';

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    let valid = true;
    if (!EMAIL_PATTERN.test(email)) {
      setEmailError('Enter a valid email.');
      valid = false;
    } else {
      setEmailError(undefined);
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    } else {
      setPasswordError(undefined);
    }
    return valid;
  }

  async function handleSubmit() {
    setServerError(undefined);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      // The root navigator handles the redirect once the session updates.
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.top}>
            <Text variant="displayXl">Melo</Text>
            <Text variant="bodyLg" color="textMuted">
              Cook it. Log it. Keep it.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              rightSlot={
                <IconButton
                  name={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword((prev) => !prev)}
                  label={showPassword ? 'Hide password' : 'Show password'}
                />
              }
            />

            {serverError && (
              <Text variant="bodySm" color="danger">
                {serverError}
              </Text>
            )}

            <Button
              title="Sign in"
              onPress={handleSubmit}
              size="lg"
              stretch
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>

          <View style={styles.bottomRow}>
            <Text variant="body" color="textMuted">
              New to Melo?
            </Text>
            <Text
              variant="strong"
              color="accent"
              onPress={() => router.replace('/(auth)/sign-up')}
              accessibilityRole="button"
              accessibilityLabel="Create an account"
            >
              {' '}
              Create an account
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  top: {
    marginTop: space.xxxl,
    gap: space.xs,
  },
  form: {
    marginTop: space.xxl,
    gap: space.lg,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.xxl,
  },
});
