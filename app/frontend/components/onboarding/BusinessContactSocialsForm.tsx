import { Field, Flex, Input, Text } from '@chakra-ui/react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { BusinessInfoFormData, CONTACT_OPTIONS } from '@/app/validators/vendorSchema';
import { SingleChipSelect } from '@/components/shared/chipSelect';
import { SectionHeader } from '../shared/formCard';

interface BusinessContactSocialsFormProps {
  register: UseFormRegister<BusinessInfoFormData>;
  errors: FieldErrors<BusinessInfoFormData>;
  setValue: UseFormSetValue<BusinessInfoFormData>;
  availableContactOptions: (typeof CONTACT_OPTIONS)[number][];
  currentPrimaryContact: string | undefined;
}

export function BusinessContactSocialsForm({
  register,
  errors,
  setValue,
  availableContactOptions,
  currentPrimaryContact,
}: BusinessContactSocialsFormProps) {
  return (
    <>
    <SectionHeader title="Contact & Socials" description="At least one contact is required so buyers can reach you. Fill in the ones you use and pick which is primary." />
      <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
        <Field.Root invalid={!!errors.instagram_handle} flex={1}>
          <Field.Label color="fg">Instagram </Field.Label>
          <Input
            {...register('instagram_handle')}
            placeholder="https://instagram.com/..."
            size="lg"
            colorPalette="primary"
          />
          <Field.ErrorText>{errors.instagram_handle?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.tiktok_handle} flex={1}>
          <Field.Label color="fg">TikTok </Field.Label>
          <Input
            {...register('tiktok_handle')}
            placeholder="https://tiktok.com/@..."
            size="lg"
            colorPalette="primary"
          />
          <Field.ErrorText>{errors.tiktok_handle?.message}</Field.ErrorText>
        </Field.Root>
      </Flex>

      <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
        <Field.Root invalid={!!errors.facebook_url} flex={1}>
          <Field.Label color="fg">Facebook </Field.Label>
          <Input
            {...register('facebook_url')}
            placeholder="https://facebook.com/..."
            size="lg"
            colorPalette="primary"
          />
          <Field.ErrorText>{errors.facebook_url?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.whatsapp_number} flex={1}>
          <Field.Label color="fg">WhatsApp </Field.Label>
          <Input
            {...register('whatsapp_number')}
            placeholder="08012345678"
            size="lg"
            colorPalette="primary"
            type="tel"
          />
          <Field.ErrorText>{errors.whatsapp_number?.message}</Field.ErrorText>
        </Field.Root>
      </Flex>

      {availableContactOptions.length > 0 && (
        <Field.Root invalid={!!errors.primary_contact}>
          <Field.Label color="fg">Primary Contact </Field.Label>
          <Field.HelperText color="fg.subtle" textStyle="xs">
            Which channel should buyers use to contact you first?
          </Field.HelperText>
          <SingleChipSelect
            options={availableContactOptions.map((o) => ({ value: o.value, label: o.label }))}
            value={currentPrimaryContact ?? ''}
            onChange={(v) =>
              setValue('primary_contact', v as BusinessInfoFormData['primary_contact'], {
                shouldValidate: true,
              })
            }
          />
          <Field.ErrorText>{errors.primary_contact?.message}</Field.ErrorText>
        </Field.Root>
      )}
    </>
  );
}
