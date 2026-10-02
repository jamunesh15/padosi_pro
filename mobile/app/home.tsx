import { BrandMark } from '@/components/brand-mark';
import { LogoutDialog } from '@/components/logout-dialog';
import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';
import { TaskItem } from '@/components/task-item';
import { TaskListSkeleton } from '@/components/task-list-skeleton';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { accountApi, queryKeys } from '@/lib/api/account';
import { ApiError } from '@/lib/api/client';
import { groupByCategory } from '@/lib/group-tasks';
import { useSession, useSignedInUser } from '@/lib/session';
import { COLORS } from '@/lib/theme';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ClipboardList, CloudOff, LogOut } from 'lucide-react-native';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

export default function HomeScreen() {
  const user = useSignedInUser();
  const { signOut } = useSession();
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const tasks = useQuery({ queryKey: queryKeys.selectedTasks, queryFn: accountApi.selectedTasks });

  const firstName = user.profile?.name.split(' ')[0] ?? 'there';
  const selected = tasks.data?.tasks ?? [];

  return (
    <Screen scroll={false}>
      <View className="flex-row items-start justify-between">
        <BrandMark />
        <Button variant="outline" size="sm" onPress={() => setLogoutOpen(true)}>
          <Icon as={LogOut} size={16} />
          <Text>Log out</Text>
        </Button>
      </View>

      <Text variant="title" className="mt-6">
        Hi, {firstName}
      </Text>
      <Text variant="lead" className="mt-3">
        Your Lifestyle Manager will take care of these for you.
      </Text>

      <View className="mb-1 mt-8 flex-row items-center justify-between">
        <Text variant="heading">
          Your tasks{selected.length > 0 ? ` (${selected.length})` : ''}
        </Text>
        {selected.length > 0 ? (
          <Button variant="link" size="link" onPress={() => router.push('/tasks')}>
            <Text className="text-sm">Edit</Text>
          </Button>
        ) : null}
      </View>

      {tasks.isPending ? (
        <View className="mt-3">
          <TaskListSkeleton rows={4} />
        </View>
      ) : tasks.isError ? (
        <StateView
          icon={CloudOff}
          title="Couldn't load your tasks"
          message={tasks.error instanceof ApiError ? tasks.error.message : 'Something went wrong.'}
          actionLabel="Try again"
          onAction={() => void tasks.refetch()}
        />
      ) : selected.length === 0 ? (
        <StateView
          icon={ClipboardList}
          title="No tasks yet"
          message="Pick what you'd like your Lifestyle Manager to handle."
          actionLabel="Choose tasks"
          onAction={() => router.push('/tasks')}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 pb-6 pt-3"
          refreshControl={
            <RefreshControl
              refreshing={tasks.isRefetching}
              onRefresh={() => void tasks.refetch()}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }>
          {groupByCategory(selected).map((group) => (
            <View key={group.id} className="gap-2">
              <Text variant="label">{group.name}</Text>
              {group.tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => {
          setLogoutOpen(false);
          void signOut();
        }}
      />
    </Screen>
  );
}
