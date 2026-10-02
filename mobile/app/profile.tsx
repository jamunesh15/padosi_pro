import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { StateField } from '@/components/state-field';
import { SubmitButton } from '@/components/submit-button';
import { accountApi } from '@/lib/api/account';
import { showServerError } from '@/lib/form-errors';
import { useSession } from '@/lib/session';
import { profileSchema, type ProfileValues } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Briefcase, Building2, Hash, Landmark, MapPin, Phone, User } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

// Keeps the 10 local digits, so a pasted "+91 98765 43210" or "098765 43210" still fits after the +91 prefix.
const toLocalMobile = (text: string) => {
  const digits = text.replace(/\D/g, '');
  return (digits.length > 10 ? digits.replace(/^(91|0)/, '') : digits).slice(0, 10);
};

const toPincode = (text: string) => text.replace(/\D/g, '').slice(0, 6);

const SERVER_FIELDS: (keyof ProfileValues)[] = [
  'name',
  'mobile',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pincode',
  'businessName',
];

// Shown once, straight after the first login; saving it flips profileCompleted and the guard moves on.
export default function ProfileScreen() {
  const { setUser } = useSession();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      mobile: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      businessName: '',
    },
  });
  const { name, mobile, addressLine1, city, state, pincode } = form.watch();
  const filled = [name, mobile, addressLine1, city, state, pincode].every(Boolean);

  const save = useMutation({
    mutationFn: accountApi.saveProfile,
    onSuccess: ({ user }) => setUser(user),
    onError: (error) => showServerError(error, form.setError, SERVER_FIELDS),
  });

  const submit = form.handleSubmit((values) =>
    save.mutate({
      ...values,
      addressLine2: values.addressLine2 || undefined,
      businessName: values.businessName || undefined,
    })
  );

  return (
    <Screen
      footer={
        <SubmitButton
          label="Save and continue"
          pending={save.isPending}
          disabled={!filled}
          onPress={submit}
        />
      }>
      <ScreenHeader
        title="Tell us about you"
        subtitle="Your Lifestyle Manager uses these details to reach you and plan visits."
      />
      <View className="gap-5">
        <FormMessage message={form.formState.errors.root?.server?.message} />
        <FormField
          control={form.control}
          name="name"
          label="Name"
          icon={User}
          placeholder="Your full name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => form.setFocus('mobile')}
        />
        <FormField
          control={form.control}
          name="mobile"
          label="Mobile number"
          icon={Phone}
          prefix="+91"
          placeholder="98765 43210"
          keyboardType="number-pad"
          autoComplete="tel-national"
          textContentType="telephoneNumber"
          transform={toLocalMobile}
          returnKeyType="next"
          onSubmitEditing={() => form.setFocus('addressLine1')}
        />
        <FormField
          control={form.control}
          name="addressLine1"
          label="Address line 1"
          icon={MapPin}
          placeholder="Flat, building, street"
          autoComplete="address-line1"
          textContentType="streetAddressLine1"
          returnKeyType="next"
          onSubmitEditing={() => form.setFocus('addressLine2')}
        />
        <FormField
          control={form.control}
          name="addressLine2"
          label="Address line 2"
          optional
          icon={Landmark}
          placeholder="Area, landmark"
          autoComplete="address-line2"
          textContentType="streetAddressLine2"
          returnKeyType="next"
          onSubmitEditing={() => form.setFocus('city')}
        />
        <FormField
          control={form.control}
          name="city"
          label="City"
          icon={Building2}
          placeholder="e.g. Pune"
          autoCapitalize="words"
          textContentType="addressCity"
          returnKeyType="done"
        />
        <Controller
          control={form.control}
          name="state"
          render={({ field, fieldState }) => (
            <StateField
              label="State"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <FormField
          control={form.control}
          name="pincode"
          label="PIN code"
          icon={Hash}
          placeholder="411045"
          keyboardType="number-pad"
          autoComplete="postal-code"
          textContentType="postalCode"
          transform={toPincode}
          returnKeyType="next"
          onSubmitEditing={() => form.setFocus('businessName')}
        />
        <FormField
          control={form.control}
          name="businessName"
          label="Business name"
          optional
          icon={Briefcase}
          placeholder="If you run a business"
          hint="Only needed if you'd like help with work errands too."
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </View>
    </Screen>
  );
}
