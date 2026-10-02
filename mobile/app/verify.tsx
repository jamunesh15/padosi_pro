import { FormMessage } from '@/components/form-message';
import { OtpInput } from '@/components/otp-input';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatSeconds, useCountdown } from '@/hooks/use-countdown';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/lib/session';
import { useMutation } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

const CODE_LENGTH = 6;
const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

export default function VerifyScreen() {
  const { email, wait } = useLocalSearchParams<{ email?: string; wait?: string }>();
  const { signIn } = useSession();
  const countdown = useCountdown(Number(wait) || 0);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const verify = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: signIn,
    onError: (err) => {
      setError(messageOf(err));
      setCode('');
    },
  });

  const resend = useMutation({
    mutationFn: authApi.resendCode,
    onSuccess: (result) => {
      countdown.restart(result.resendAvailableInSeconds);
      setCode('');
      setError(null);
      setNotice(`We sent a new code to ${email}.`);
    },
    onError: (err) => {
      if (err instanceof ApiError && typeof err.data.retryAfterSeconds === 'number') {
        countdown.restart(err.data.retryAfterSeconds);
      }
      setNotice(null);
      setError(messageOf(err));
    },
  });

  if (!email) return <Redirect href="/register" />;

  const submit = (value = code) => {
    if (value.length !== CODE_LENGTH || verify.isPending) return;
    setNotice(null);
    verify.mutate({ email, code: value });
  };

  const onCodeChange = (value: string) => {
    setCode(value);
    if (error) setError(null);
    if (value.length === CODE_LENGTH) submit(value);
  };

  return (
    <Screen
      footer={
        <>
          <SubmitButton
            label="Verify email"
            pending={verify.isPending}
            disabled={code.length !== CODE_LENGTH}
            onPress={() => submit()}
          />
          <View className="flex-row items-center justify-center gap-1">
            <Text variant="muted">Wrong email?</Text>
            <Button
              variant="link"
              size="link"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/register'))}>
              <Text className="text-sm">Go back</Text>
            </Button>
          </View>
        </>
      }>
      <ScreenHeader
        title="Verify your email"
        subtitle={
          <>
            Enter the 6-digit code we sent to <Text className="font-semibold">{email}</Text>. It's
            valid for 10 minutes.
          </>
        }
      />
      <View className="gap-5">
        <OtpInput
          value={code}
          onChange={onCodeChange}
          invalid={!!error}
          editable={!verify.isPending}
        />
        <FormMessage message={error} />
        <FormMessage message={notice} tone="success" />
        <View className="flex-row items-center gap-1">
          <Text variant="muted">Didn't get it?</Text>
          {countdown.secondsLeft > 0 ? (
            <Text variant="muted">Resend in {formatSeconds(countdown.secondsLeft)}</Text>
          ) : (
            <Button
              variant="link"
              size="link"
              disabled={resend.isPending}
              onPress={() => resend.mutate(email)}>
              <Text className="text-sm">{resend.isPending ? 'Sending…' : 'Resend code'}</Text>
            </Button>
          )}
        </View>
      </View>
    </Screen>
  );
}
