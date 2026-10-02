import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { showServerError } from '@/lib/form-errors';
import { useSession } from '@/lib/session';
import { loginSchema, type LoginValues } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

export default function LoginScreen() {
  const { signIn } = useSession();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });
  const { email, password } = form.watch();

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: signIn,
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        router.push({
          pathname: '/verify',
          params: {
            email: String(error.data.email),
            wait: String(error.data.resendAvailableInSeconds ?? 0),
          },
        });
        return;
      }
      showServerError(error, form.setError, ['email', 'password']);
    },
  });

  const submit = form.handleSubmit((values) => login.mutate(values));

  return (
    <Screen
      footer={
        <>
          <SubmitButton
            label="Log in"
            pending={login.isPending}
            disabled={!email || !password}
            onPress={submit}
          />
          <View className="flex-row items-center justify-center gap-1">
            <Text variant="muted">New to PadosiPro?</Text>
            <Button variant="link" size="link" onPress={() => router.replace('/register')}>
              <Text className="text-sm">Create an account</Text>
            </Button>
          </View>
        </>
      }>
      <ScreenHeader
        title="Welcome back"
        subtitle="Log in with the email and password you signed up with."
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
          placeholder="Your password"
          revealable
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>
    </Screen>
  );
}
