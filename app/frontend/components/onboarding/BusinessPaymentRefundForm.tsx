'use client';
import { useState } from 'react';
import { Box, Button, Field, Flex, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import {
  BusinessInfoFormData,
  PAYMENT_MODEL_OPTIONS,
  REFUND_POLICY_OPTIONS,
  REFUND_DURATION_OPTIONS,
  COMMON_REFUND_CONDITIONS,
} from '@/app/validators/vendorSchema';
import { SingleChipSelect, MultiChipSelect } from '@/components/shared/chipSelect';
import { SectionHeader } from '../shared/formCard';

interface BusinessPaymentRefundFormProps {
  register: UseFormRegister<BusinessInfoFormData>;
  errors: FieldErrors<BusinessInfoFormData>;
  setValue: UseFormSetValue<BusinessInfoFormData>;
  selectedPaymentModels: string[];
  selectedRefundPolicy: string;
  selectedConditions: string[];
  notesValue: string;
}

export function BusinessPaymentRefundForm({
  register,
  errors,
  setValue,
  selectedPaymentModels,
  selectedRefundPolicy,
  selectedConditions,
  notesValue,
}: BusinessPaymentRefundFormProps) {
  const [customConditionInput, setCustomConditionInput] = useState('');

  return (
    <>
      <SectionHeader
        title="Payment & Banking"
        description="Your bank details for receiving payouts and the payment types you accept from buyers."
      />

      <Field.Root invalid={!!errors.bank_name} required>
        <Field.Label color="fg">Bank Name</Field.Label>
        <Input
          {...register('bank_name')}
          placeholder="e.g. First Bank of Nigeria"
          size="lg"
          colorPalette="primary"
        />
        <Field.ErrorText>{errors.bank_name?.message}</Field.ErrorText>
      </Field.Root>

      <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
        <Field.Root invalid={!!errors.account_number} required flex={1}>
          <Field.Label color="fg">Account Number</Field.Label>
          <Input
            {...register('account_number')}
            placeholder="10-digit account number"
            size="lg"
            colorPalette="primary"
            maxLength={10}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <Field.ErrorText>{errors.account_number?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.account_name} required flex={1}>
          <Field.Label color="fg">Account Name</Field.Label>
          <Input
            {...register('account_name')}
            placeholder="As shown on bank records"
            size="lg"
            colorPalette="primary"
          />
          <Field.ErrorText>{errors.account_name?.message}</Field.ErrorText>
        </Field.Root>
      </Flex>

      <Field.Root invalid={!!errors.payment_models} required>
        <Field.Label color="fg">Accepted Payment Methods</Field.Label>
        <MultiChipSelect
          options={[...PAYMENT_MODEL_OPTIONS]}
          value={selectedPaymentModels}
          onChange={(v) =>
            setValue('payment_models', v as BusinessInfoFormData['payment_models'], {
              shouldValidate: true,
            })
          }
        />
        <Field.ErrorText>{errors.payment_models?.message}</Field.ErrorText>
      </Field.Root>

      <SectionHeader
        title="Refund Policy"
        description="Set clear expectations for buyers about returns and exchanges."
      />
      <Field.Root invalid={!!errors.refund_policy_type} required>
        <Field.Label color="fg">Refund Policy</Field.Label>
        <SingleChipSelect
          options={[...REFUND_POLICY_OPTIONS]}
          value={selectedRefundPolicy}
          onChange={(v) =>
            setValue('refund_policy_type', v as BusinessInfoFormData['refund_policy_type'], {
              shouldValidate: true,
            })
          }
        />
        <Field.ErrorText>{errors.refund_policy_type?.message}</Field.ErrorText>
      </Field.Root>

      {selectedRefundPolicy && selectedRefundPolicy !== 'NO_REFUNDS' && (
        <>
          <Field.Root invalid={!!errors.refund_duration_days}>
            <Field.Label color="fg">
              Refund Window{' '}
              <Text as="span" color="fg.muted" fontWeight="normal">
                (optional)
              </Text>
            </Field.Label>
            <Box
              as="select"
              {...register('refund_duration_days', {
                setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
              })}
              h="48px"
              px={3}
              borderRadius="md"
              borderWidth="1px"
              borderColor={errors.refund_duration_days ? 'red.500' : 'border'}
              bg="bg"
              color="fg"
              fontSize="md"
              _focus={{
                outline: 'none',
                borderColor: 'primary.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
              }}
            >
              <option value="">Select refund window</option>
              {REFUND_DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Box>
            <Field.ErrorText>{errors.refund_duration_days?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.refund_conditions}>
            <Field.Label color="fg">
              Refund Conditions{' '}
              <Text as="span" color="fg.muted" fontWeight="normal">
                (optional, up to 10)
              </Text>
            </Field.Label>

            <Stack gap={2} mt={1}>
              {COMMON_REFUND_CONDITIONS.map((condition) => {
                const isChecked = selectedConditions.includes(condition);
                return (
                  <Box
                    key={condition}
                    as="label"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    cursor="pointer"
                    color="fg"
                    fontSize="sm"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const next = isChecked
                          ? selectedConditions.filter((c) => c !== condition)
                          : selectedConditions.length < 10
                            ? [...selectedConditions, condition]
                            : selectedConditions;
                        setValue('refund_conditions', next, { shouldValidate: true });
                      }}
                      style={{
                        accentColor: 'var(--chakra-colors-primary-500)',
                        width: '1rem',
                        height: '1rem',
                        flexShrink: 0,
                        cursor: 'pointer',
                      }}
                    />
                    {condition}
                  </Box>
                );
              })}
            </Stack>

            {selectedConditions
              .filter((c) => !(COMMON_REFUND_CONDITIONS as readonly string[]).includes(c))
              .map((custom) => (
                <Flex
                  key={custom}
                  align="center"
                  gap={2}
                  mt={2}
                  px={3}
                  py={2}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border"
                  bg="bg.subtle"
                >
                  <Text fontSize="sm" color="fg" flex={1}>
                    {custom}
                  </Text>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    color="fg.muted"
                    onClick={() =>
                      setValue(
                        'refund_conditions',
                        selectedConditions.filter((c) => c !== custom),
                        { shouldValidate: true }
                      )
                    }
                    aria-label="Remove condition"
                  >
                    ×
                  </Button>
                </Flex>
              ))}

            {selectedConditions.length < 10 && (
              <Flex gap={2} mt={2}>
                <Input
                  value={customConditionInput}
                  onChange={(e) => setCustomConditionInput(e.target.value)}
                  placeholder="Add a custom condition..."
                  size="md"
                  colorPalette="primary"
                  maxLength={200}
                />
                <Button
                  type="button"
                  colorPalette="primary"
                  variant="outline"
                  size="md"
                  flexShrink={0}
                  disabled={!customConditionInput.trim()}
                  onClick={() => {
                    const trimmed = customConditionInput.trim();
                    if (!trimmed || selectedConditions.length >= 10) return;
                    setValue('refund_conditions', [...selectedConditions, trimmed], {
                      shouldValidate: true,
                    });
                    setCustomConditionInput('');
                  }}
                >
                  Add
                </Button>
              </Flex>
            )}
            {selectedConditions.length >= 10 && (
              <Text textStyle="xs" color="fg.subtle" mt={1}>
                Maximum of 10 conditions reached.
              </Text>
            )}

            <Field.ErrorText>{errors.refund_conditions?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.refund_custom_notes}>
            <Field.Label color="fg">
              Additional Notes{' '}
              <Text as="span" color="fg.muted" fontWeight="normal">
                (optional)
              </Text>
            </Field.Label>
            <Textarea
              {...register('refund_custom_notes')}
              placeholder="Any additional details about your refund process..."
              size="lg"
              colorPalette="primary"
              rows={3}
              resize="none"
            />
            <Flex justify="space-between">
              <Field.ErrorText>{errors.refund_custom_notes?.message}</Field.ErrorText>
              <Text textStyle="xs" color="fg.subtle" ml="auto">
                {notesValue.length}/500
              </Text>
            </Flex>
          </Field.Root>
        </>
      )}
    </>
  );
}
