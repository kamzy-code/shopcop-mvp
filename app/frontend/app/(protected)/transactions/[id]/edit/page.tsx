'use client';
import { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { useTransaction, useUpdateTransaction } from '@/app/_hooks/transaction';
import { TransactionEditData, transactionEditSchema } from '@/app/validators/transactionschema';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { useState } from 'react';

const DELIVERY_METHODS = [
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'WAYBILL', label: 'Waybill' },
] as const;

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: tx, isLoading } = useTransaction(id);
  const updateMutation = useUpdateTransaction();
  const [errorModal, setErrorModal] = useState({ open: false, title: '', description: '' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionEditData>({
    resolver: zodResolver(transactionEditSchema) as unknown as Resolver<TransactionEditData>,
    defaultValues: {
      delivery_method: 'PICKUP',
      buyer_email: '',
      expected_delivery_start: '',
      expected_delivery_end: '',
      delivery_fee: 0,
      discount_amount: 0,
      order_notes: '',
      vendor_notes: '',
    },
  });

  // Pre-populate form once transaction loads
  useEffect(() => {
    if (tx) {
      reset({
        delivery_method: tx.delivery_method as 'PICKUP' | 'DISPATCH' | 'WAYBILL',
        buyer_email: tx.buyer_email ?? '',
        expected_delivery_start: tx.expected_delivery_start
          ? tx.expected_delivery_start.slice(0, 10)
          : '',
        expected_delivery_end: tx.expected_delivery_end
          ? tx.expected_delivery_end.slice(0, 10)
          : '',
        delivery_fee: tx.delivery_fee ?? 0,
        discount_amount: tx.discount_amount ?? 0,
        order_notes: tx.order_notes ?? '',
        vendor_notes: tx.vendor_notes ?? '',
      });
    }
  }, [tx, reset]);

  // Redirect away if not PENDING
  useEffect(() => {
    if (tx && tx.status !== 'PENDING') {
      router.replace(`/transactions/${id}`);
    }
  }, [tx, id, router]);

  const onSubmit = async (data: TransactionEditData) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          delivery_method: data.delivery_method,
          buyer_email: data.buyer_email || undefined,
          expected_delivery_start: data.expected_delivery_start || undefined,
          expected_delivery_end: data.expected_delivery_end || undefined,
          delivery_fee: data.delivery_fee,
          discount_amount: data.discount_amount,
          order_notes: data.order_notes || undefined,
          vendor_notes: data.vendor_notes || undefined,
        },
      });
      toaster.create({ title: 'Transaction updated', type: 'success' });
      router.push(`/transactions/${id}`);
    } catch (err) {
      setErrorModal({
        open: true,
        title: 'Failed to update transaction',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <FullPageSpinner />
      </AppShell>
    );
  }

  if (!tx) {
    return (
      <AppShell>
        <Box textAlign="center" py={16}>
          <Text color="fg.muted">Transaction not found.</Text>
          <Button mt={4} variant="outline" onClick={() => router.push('/transactions')}>
            Back to Transactions
          </Button>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        description={errorModal.description}
        type="error"
      />

      <Box maxW="560px" mx="auto">
        {/* Header */}
        <Flex align="center" gap={3} mb={6}>
          <Button
            variant="ghost"
            size="sm"
            colorPalette="gray"
            onClick={() => router.push(`/transactions/${id}`)}
          >
            <LuArrowLeft />
          </Button>
          <Box>
            <Heading textStyle="xl" fontWeight="bold" color="fg">
              Edit Transaction
            </Heading>
            <Text textStyle="xs" color="fg.muted">
              {tx.reference}
            </Text>
          </Box>
        </Flex>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={5}>
            {/* ── Delivery Details ─────────────────────────────────────── */}
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
                DELIVERY DETAILS
              </Text>
              <Stack gap={4}>
                {/* Delivery method */}
                <Field.Root invalid={!!errors.delivery_method}>
                  <Field.Label textStyle="sm" fontWeight="medium">
                    Delivery Method
                  </Field.Label>
                  <Controller
                    name="delivery_method"
                    control={control}
                    render={({ field }) => (
                      <Flex gap={2}>
                        {DELIVERY_METHODS.map((m) => (
                          <Button
                            key={m.value}
                            type="button"
                            size="sm"
                            flex={1}
                            variant={field.value === m.value ? 'solid' : 'outline'}
                            colorPalette={field.value === m.value ? 'primary' : 'gray'}
                            onClick={() => field.onChange(m.value)}
                          >
                            {m.label}
                          </Button>
                        ))}
                      </Flex>
                    )}
                  />
                  {errors.delivery_method && (
                    <Field.ErrorText>{errors.delivery_method.message}</Field.ErrorText>
                  )}
                </Field.Root>

                {/* Buyer email */}
                <Field.Root invalid={!!errors.buyer_email}>
                  <Field.Label textStyle="sm" fontWeight="medium">
                    Buyer Email{' '}
                    <Text as="span" color="fg.subtle" fontWeight="normal">
                      (optional)
                    </Text>
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder="buyer@example.com"
                    {...register('buyer_email')}
                  />
                  {errors.buyer_email && (
                    <Field.ErrorText>{errors.buyer_email.message}</Field.ErrorText>
                  )}
                </Field.Root>

                {/* Expected delivery window */}
                <Flex gap={3}>
                  <Field.Root flex={1} invalid={!!errors.expected_delivery_start}>
                    <Field.Label textStyle="sm" fontWeight="medium">
                      Delivery Start
                    </Field.Label>
                    <Input type="date" {...register('expected_delivery_start')} />
                  </Field.Root>
                  <Field.Root flex={1} invalid={!!errors.expected_delivery_end}>
                    <Field.Label textStyle="sm" fontWeight="medium">
                      Delivery End
                    </Field.Label>
                    <Input type="date" {...register('expected_delivery_end')} />
                  </Field.Root>
                </Flex>
              </Stack>
            </Box>

            {/* ── Pricing ──────────────────────────────────────────────── */}
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
                PRICING
              </Text>
              <Flex gap={3}>
                <Field.Root flex={1} invalid={!!errors.delivery_fee}>
                  <Field.Label textStyle="sm" fontWeight="medium">
                    Delivery Fee (₦)
                  </Field.Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    {...register('delivery_fee', { valueAsNumber: true })}
                  />
                  {errors.delivery_fee && (
                    <Field.ErrorText>{errors.delivery_fee.message}</Field.ErrorText>
                  )}
                </Field.Root>
                <Field.Root flex={1} invalid={!!errors.discount_amount}>
                  <Field.Label textStyle="sm" fontWeight="medium">
                    Discount (₦)
                  </Field.Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    {...register('discount_amount', { valueAsNumber: true })}
                  />
                  {errors.discount_amount && (
                    <Field.ErrorText>{errors.discount_amount.message}</Field.ErrorText>
                  )}
                </Field.Root>
              </Flex>
            </Box>

            {/* ── Notes ────────────────────────────────────────────────── */}
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
                NOTES
              </Text>
              <Stack gap={4}>
                <Field.Root invalid={!!errors.order_notes}>
                  <Field.Label textStyle="sm" fontWeight="medium">
                    Order Notes{' '}
                    <Text as="span" color="fg.subtle" fontWeight="normal">
                      (visible to buyer)
                    </Text>
                  </Field.Label>
                  <Textarea
                    rows={3}
                    placeholder="Any information the buyer should see..."
                    {...register('order_notes')}
                  />
                </Field.Root>
                <Field.Root invalid={!!errors.vendor_notes}>
                  <Field.Label textStyle="sm" fontWeight="medium">
                    Vendor Notes{' '}
                    <Text as="span" color="fg.subtle" fontWeight="normal">
                      (internal only)
                    </Text>
                  </Field.Label>
                  <Textarea
                    rows={3}
                    placeholder="Private notes for your reference..."
                    {...register('vendor_notes')}
                  />
                </Field.Root>
              </Stack>
            </Box>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <Flex gap={3} justify="flex-end">
              <Button
                type="button"
                variant="outline"
                colorPalette="gray"
                onClick={() => router.push(`/transactions/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" colorPalette="primary" loading={isSubmitting}>
                Save Changes
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </AppShell>
  );
}
