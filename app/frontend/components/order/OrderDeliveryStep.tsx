'use client';
import { Button, Field, Flex, Grid, Input, Stack, Text } from '@chakra-ui/react';
import { UseFormRegister, FieldErrors, Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form';
import { OrderFormData } from '@/app/validators/orderSchema';

interface OrderDeliveryStepProps {
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  control: Control<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
}

export function OrderDeliveryStep({ register, errors, control, setValue }: OrderDeliveryStepProps) {
  const deliveryStart = useWatch({ control, name: 'expected_delivery_start' });
  const todayStr = new Date().toISOString().split('T')[0];
  const endMin = deliveryStart || todayStr;

  return (
    <Stack gap={4}>
      <Field.Root invalid={!!errors.delivery_method}>
        <Field.Label>
          Delivery Method{' '}
          <Text as="span" color="red.500">
            *
          </Text>
        </Field.Label>
        <Controller
          control={control}
          name="delivery_method"
          render={({ field }) => (
            <Flex gap={2} flexWrap="wrap">
              {(['PICKUP', 'DISPATCH', 'WAYBILL'] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant="outline"
                  size="sm"
                  px={4}
                  py={2}
                  borderWidth="1.5px"
                  borderColor={field.value === m ? 'primary.500' : 'border'}
                  bg={field.value === m ? 'primary.subtle' : 'bg.panel'}
                  color={field.value === m ? 'primary.fg' : 'fg.muted'}
                  fontWeight={field.value === m ? 'semibold' : 'normal'}
                  onClick={() => field.onChange(m)}
                >
                  {m === 'PICKUP' ? 'Pickup' : m === 'DISPATCH' ? 'Dispatch' : 'Waybill'}
                </Button>
              ))}
            </Flex>
          )}
        />
      </Field.Root>

      <Text textStyle="xs" color="fg.muted">
        Expected delivery window (optional)
      </Text>

      <Grid templateColumns="1fr 1fr" gap={4}>
        <Field.Root invalid={!!errors.expected_delivery_start}>
          <Field.Label>Start Date</Field.Label>
          <Input
            {...register('expected_delivery_start')}
            type="date"
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.expected_delivery_start && (
            <Field.ErrorText>{errors.expected_delivery_start.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={!!errors.expected_delivery_end}>
          <Field.Label>End Date</Field.Label>
          <Input
            {...register('expected_delivery_end')}
            type="date"
            min={endMin}
          />
          {errors.expected_delivery_end && (
            <Field.ErrorText>{errors.expected_delivery_end.message}</Field.ErrorText>
          )}
        </Field.Root>
      </Grid>

      <Flex gap={2} flexWrap="wrap">
        {[
          { label: 'Today', days: 0 },
          { label: 'Tomorrow', days: 1 },
          { label: '+2 days', days: 2 },
          { label: '+3 days', days: 3 },
          { label: '1 week', days: 7 },
        ].map(({ label, days }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="xs"
            colorPalette="gray"
            borderRadius="full"
            onClick={() => {
              const start = new Date();
              start.setDate(start.getDate() + days);
              const end = new Date(start);
              end.setDate(end.getDate() + 1);
              const fmt = (d: Date) => d.toISOString().split('T')[0];
              setValue('expected_delivery_start', fmt(start));
              setValue('expected_delivery_end', fmt(end));
            }}
          >
            {label}
          </Button>
        ))}
      </Flex>
    </Stack>
  );
}
