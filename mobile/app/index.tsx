import { useSession } from '@/lib/session';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user } = useSession();

  if (!user) return <Redirect href="/login" />;
  if (!user.profileCompleted) return <Redirect href="/profile" />;
  return <Redirect href={user.selectedTaskCount > 0 ? '/home' : '/tasks'} />;
}
