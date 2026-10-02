import { ApiError } from '@/lib/api/client';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

// Puts server field errors under their inputs; anything else becomes the form-level message.
export function showServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Path<T>[]
) {
  if (!(error instanceof ApiError)) {
    setError('root.server', { message: 'Something went wrong. Please try again.' });
    return;
  }

  const matched = Object.entries(error.fields).filter(([field]) =>
    fields.includes(field as Path<T>)
  );
  matched.forEach(([field, message]) => setError(field as Path<T>, { message }));
  if (matched.length === 0) setError('root.server', { message: error.message });
}
