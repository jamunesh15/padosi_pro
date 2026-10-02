import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authApi } from '@/lib/api/auth';
import { showServerError } from '@/lib/form-errors';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

export default function RegisterScreen() {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  const { email, password, confirmPassword } = form.watch();

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (result) =>
      router.push({
        pathname: '/verify',
        params: { email: result.email, wait: String(result.resendAvailableInSeconds) },
      }),
    onError: (error) =>
      showServerError(error, form.setError, ['email', 'password', 'confirmPassword']),
  });

  const submit = form.handleSubmit((values) => register.mutate(values));

  return (
    <Screen
      footer={
        <>
          <SubmitButton
            label="Create account"
            pending={register.isPending}
            disabled={!email || !password || !confirmPassword}
            onPress={submit}
          />
          <View className="flex-row items-center justify-center gap-1">
            <Text variant="muted">Already have an account?</Text>
            <Button variant="link" size="link" onPress={() => router.replace('/login')}>
              <Text className="text-sm">Log in</Text>
            </Button>
          </View>
        </>
      }>
      <ScreenHeader
        title="Welcome"
        subtitle="Create your account with your email. We'll send a code to verify it."
      />
      <View className="gap-5">
        <FormMessage message={form.formState.errors.root?.server?.message} />
        <FormField
          control={form.control}
          name="email"
          label="Email"
          icon={Mail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => form.setFocus('password')}
        />
        <FormField
          control={form.control}
          name="password"
          label="Password"
          icon={Lock}
          placeholder="Create a password"
          hint="At least 8 characters."
          revealable
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => form.setFocus('confirmPassword')}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          icon={Lock}
          placeholder="Type it again"
          revealable
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>
    </Screen>
  );
}
