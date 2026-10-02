import { TextField, type TextFieldProps } from '@/components/text-field';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

type FormFieldProps<T extends FieldValues> = Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'error'
> & {
  control: Control<T>;
  name: Path<T>;
  transform?: (text: string) => string;
};

// Binds a TextField to react-hook-form so each field shows its own error inline.
export function FormField<T extends FieldValues>({
  control,
  name,
  transform,
  ...fieldProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...fieldProps}
          ref={field.ref}
          value={field.value}
          onChangeText={(text) => field.onChange(transform ? transform(text) : text)}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
