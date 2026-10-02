import { ConfirmTasksDialog } from '@/components/confirm-tasks-dialog';
import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';
import { SubmitButton } from '@/components/submit-button';
import { TaskItem } from '@/components/task-item';
import { TaskListSkeleton } from '@/components/task-list-skeleton';
import { TextField } from '@/components/text-field';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { accountApi, queryKeys } from '@/lib/api/account';
import { ApiError } from '@/lib/api/client';
import { pickFromCatalogue } from '@/lib/group-tasks';
import { useSession, useSignedInUser } from '@/lib/session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, CloudOff, Search, SearchX } from 'lucide-react-native';
import * as React from 'react';
import { SectionList, View } from 'react-native';

export default function TasksScreen() {
  const user = useSignedInUser();
  const { setUser } = useSession();
  const queryClient = useQueryClient();
  const editing = user.selectedTaskCount > 0;

  const catalogue = useQuery({ queryKey: queryKeys.catalogue, queryFn: accountApi.catalogue });
  const saved = useQuery({
    queryKey: queryKeys.selectedTasks,
    queryFn: accountApi.selectedTasks,
    enabled: editing,
  });

  const [picked, setPicked] = React.useState<Set<string> | null>(null);
  const [search, setSearch] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // Starts from the saved selection when editing, until the user changes something.
  const selectedIds = React.useMemo(
    () => picked ?? new Set(saved.data?.tasks.map((task) => task.id) ?? []),
    [picked, saved.data]
  );
  const categories = catalogue.data?.categories ?? [];

  const sections = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        data: category.tasks.filter((task) =>
          [task.name, task.description, category.name].some((text) =>
            text.toLowerCase().includes(query)
          )
        ),
      }))
      .filter((section) => section.data.length > 0);
  }, [categories, search]);

  const save = useMutation({
    mutationFn: accountApi.saveTasks,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.selectedTasks, result);
      setUser({ ...user, selectedTaskCount: result.tasks.length });
      setConfirmOpen(false);
      if (editing && router.canGoBack()) router.back();
      else router.replace('/home');
    },
  });

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const loading = catalogue.isPending || (editing && saved.isPending);
  const failed = catalogue.isError || (editing && saved.isError);
  const count = selectedIds.size;

  return (
    <Screen
      scroll={false}
      footer={
        !loading && !failed ? (
          <>
            <View className="flex-row items-center justify-between">
              <Text variant="muted">{count === 0 ? 'No tasks selected' : `${count} selected`}</Text>
              {count > 0 ? (
                <Button variant="link" size="link" onPress={() => setPicked(new Set())}>
                  <Text className="text-sm">Clear</Text>
                </Button>
              ) : null}
            </View>
            <SubmitButton
              label="Continue"
              disabled={count === 0}
              onPress={() => setConfirmOpen(true)}
            />
          </>
        ) : null
      }>
      {editing && router.canGoBack() ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 self-start"
          onPress={() => router.back()}>
          <Icon as={ArrowLeft} size={18} />
          <Text>Back</Text>
        </Button>
      ) : null}
      <Text variant="title" className="mt-2">
        What should we handle?
      </Text>
      <Text variant="lead" className="mb-5 mt-3">
        Pick the tasks you'd like your Lifestyle Manager to take care of.
      </Text>

      {loading ? (
        <TaskListSkeleton />
      ) : failed ? (
        <StateView
          icon={CloudOff}
          title="Couldn't load tasks"
          message={errorMessage(catalogue.error ?? saved.error)}
          actionLabel="Try again"
          onAction={() => {
            void catalogue.refetch();
            if (editing) void saved.refetch();
          }}
        />
      ) : (
        <>
          <TextField
            accessibilityLabel="Search tasks"
            icon={Search}
            placeholder="Try plumbing, flights or Wi-Fi"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <SectionList
            className="mt-4 flex-1"
            sections={sections}
            keyExtractor={(task) => task.id}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            contentContainerClassName="pb-4"
            renderSectionHeader={({ section }) => (
              <Text variant="label" className="pb-2 pt-4">
                {section.name}
              </Text>
            )}
            renderItem={({ item }) => (
              <View className="pb-2">
                <TaskItem
                  task={item}
                  selected={selectedIds.has(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              </View>
            )}
            ListEmptyComponent={
              <StateView
                icon={SearchX}
                title="No matching tasks"
                message={`Nothing matches "${search.trim()}". Try another word.`}
                actionLabel="Clear search"
                onAction={() => setSearch('')}
              />
            }
          />
        </>
      )}

      <ConfirmTasksDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) save.reset();
        }}
        tasks={pickFromCatalogue(categories, selectedIds)}
        saving={save.isPending}
        error={save.error ? errorMessage(save.error) : null}
        onConfirm={() => save.mutate([...selectedIds])}
      />
    </Screen>
  );
}

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
