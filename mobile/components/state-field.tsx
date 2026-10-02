import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { INDIAN_STATES } from '@/lib/indian-states';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Map as MapIcon, Search } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type StateFieldProps = {
  label: string;
  value: string;
  onChange: (state: string) => void;
  onBlur?: () => void;
  error?: string;
};

// Opens a searchable list under the field, so the state is always spelled the way the server expects.
export function StateField({ label, value, onChange, onBlur, error }: StateFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const matches = INDIAN_STATES.filter((state) =>
    state.toLowerCase().includes(query.trim().toLowerCase())
  );

  const close = () => {
    setOpen(false);
    setQuery('');
    onBlur?.();
  };

  return (
    <View className="gap-2">
      <Label>{label}</Label>
      <View
        className={cn(
          'overflow-hidden rounded-lg border bg-card',
          error ? 'border-destructive' : open ? 'border-primary' : 'border-input'
        )}>
        <Pressable
          onPress={() => (open ? close() : setOpen(true))}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${label}: ${value || 'not chosen'}`}
          className="h-14 flex-row items-center gap-3 px-4">
          <Icon as={MapIcon} size={18} className="text-muted-foreground" />
          <Text numberOfLines={1} className={cn('flex-1', !value && 'text-muted-foreground')}>
            {value || 'Choose your state'}
          </Text>
          <Icon as={open ? ChevronUp : ChevronDown} size={18} className="text-muted-foreground" />
        </Pressable>
        {open ? (
          <>
            <View className="h-12 flex-row items-center gap-3 border-t border-input px-4">
              <Icon as={Search} size={16} className="text-muted-foreground" />
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search states"
                accessibilityLabel="Search states"
                autoCorrect={false}
                className="h-full flex-1 rounded-none border-0 bg-transparent px-0"
              />
            </View>
            <ScrollView
              className="max-h-56 border-t border-input"
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled">
              {matches.map((state) => (
                <Pressable
                  key={state}
                  onPress={() => {
                    onChange(state);
                    close();
                  }}
                  role="option"
                  aria-selected={state === value}
                  className="h-11 justify-center px-4 active:bg-accent">
                  <Text className={cn(state === value && 'font-medium text-primary')}>{state}</Text>
                </Pressable>
              ))}
              {matches.length === 0 ? (
                <Text variant="muted" className="px-4 py-3">
                  No state matches "{query.trim()}".
                </Text>
              ) : null}
            </ScrollView>
          </>
        ) : null}
      </View>
      {error ? <Text variant="error">{error}</Text> : null}
    </View>
  );
}
