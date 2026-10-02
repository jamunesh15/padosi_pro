import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(cn('text-base text-foreground', Platform.select({ web: 'select-text' })), {
  variants: {
    variant: {
      default: '',
      title: 'font-heading text-[30px] leading-9',
      heading: 'font-heading text-lg leading-6',
      lead: 'text-base leading-6 text-muted-foreground',
      label: 'text-[13px] font-medium text-muted-foreground',
      eyebrow: 'text-[11px] font-bold tracking-[1px] text-muted-foreground',
      small: 'text-sm font-medium',
      muted: 'text-sm leading-5 text-muted-foreground',
      error: 'text-sm leading-5 text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  title: 'heading',
  heading: 'heading',
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  title: '1',
  heading: '2',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
