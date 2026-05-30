'use client';
import { useState } from 'react';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuPackage, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { useCreateTransaction } from '@/app/_hooks/transaction';
import { useProducts } from '@/app/_hooks/vendor';
import { Product } from '@/app/_types';
import { TransactionFormData, transactionFormSchema } from '@/app/validators/transactionschema';
import { formatCurrency } from '@/app/_lib/transactionHelpers';

const STEPS = ['Order Items', 'Delivery Details', 'Review & Submit'];

// ─── Step progress ─────────────────────────────────────────────────────────────

function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <Stack gap={2} mb={6}>
      <Flex gap={1}>
        {Array.from({ length: total }).map((_, i) => (
          <Box
            key={i}
            flex={1}
            h={1.5}
            borderRadius="full"
            bg={i <= step ? 'primary.500' : 'bg.subtle'}
            transition="background 0.2s"
          />
        ))}
      </Flex>
      <Text textStyle="xs" color="fg.muted">
        Step {step + 1} of {total} — {STEPS[step]}
      </Text>
    </Stack>
  );
}

// ─── Catalog picker (inline) ───────────────────────────────────────────────────

function CatalogPickerPanel({
  products,
  onSelect,
  onClose,
}: {
  products: Product[];
  onSelect: (p: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box position="fixed" top={0} left={0} right={0} bottom={0} zIndex={50}>
      <Box position="absolute" inset={0} bg="rgba(0,0,0,0.5)" onClick={onClose} />
      <Box
        position="absolute"
        top={{ base: '10%', md: '5%' }}
        left="50%"
        transform="translateX(-50%)"
        w={{ base: '95vw', md: '480px' }}
        maxH="80vh"
        bg="bg.panel"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        zIndex={1}
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          p={4}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Heading textStyle="md" fontWeight="semibold">
            Select from Catalog
          </Heading>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <LuX />
          </Button>
        </Flex>

        {/* Search */}
        <Box px={4} py={3} borderBottomWidth="1px" borderColor="border">
          <Input
            placeholder="Search products..."
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        {/* List */}
        <Box flex={1} overflow="auto" p={2}>
          {filtered.length === 0 ? (
            <Flex align="center" justify="center" h="120px">
              <Text textStyle="sm" color="fg.muted">
                No products found
              </Text>
            </Flex>
          ) : (
            <Stack gap={1}>
              {filtered.map((p) => (
                <Flex
                  key={p.id}
                  align="center"
                  gap={3}
                  p={3}
                  borderRadius="lg"
                  cursor="pointer"
                  _hover={{ bg: 'bg.subtle' }}
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                >
                  <Box
                    w={10}
                    h={10}
                    borderRadius="lg"
                    bg="bg.subtle"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    {!p.media?.[0] ? (
                      <Flex h="full" align="center" justify="center" color="fg.subtle">
                        <LuPackage size={16} />
                      </Flex>
                    ) : p.media[0].media_type === 'VIDEO' ? (
                      <video
                        src={p.media[0].media_url}
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <img
                        src={p.media[0].media_url}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </Box>
                  <Box flex={1} overflow="hidden">
                    <Text textStyle="sm" fontWeight="medium" truncate>
                      {p.name}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {formatCurrency(p.price)}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTransactionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showCatalog, setShowCatalog] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', description: '' });

  const { data: products = [] } = useProducts();
  const createMutation = useCreateTransaction();

  const {
    register,
    handleSubmit,
    watch,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema) as unknown as Resolver<TransactionFormData>,
    defaultValues: {
      delivery_method: 'PICKUP',
      items: [],
      delivery_fee: 0,
      discount_amount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchItems = watch('items');
  const watchDeliveryFee = watch('delivery_fee') ?? 0;
  const watchDiscount = watch('discount_amount') ?? 0;

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (Number(item.item_price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const total = Math.max(0, subtotal + Number(watchDeliveryFee) - Number(watchDiscount));

  // ─── Step validation ─────────────────────────────────────────────────────────

  const STEP_FIELDS: (keyof TransactionFormData)[][] = [
    ['items'],
    ['delivery_method', 'expected_delivery_start', 'expected_delivery_end'],
    ['delivery_fee', 'discount_amount', 'order_notes', 'vendor_notes'],
  ];

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step] as (keyof TransactionFormData)[]);
    if (valid) setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => s - 1);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: unknown) => {
    const d = data as TransactionFormData;
    try {
      const result = await createMutation.mutateAsync({
        delivery_method: d.delivery_method,
        expected_delivery_start: d.expected_delivery_start || undefined,
        expected_delivery_end: d.expected_delivery_end || undefined,
        items: d.items.map((i) => ({
          product_id: i.product_id || undefined,
          item_name: i.item_name,
          item_price: Number(i.item_price),
          quantity: Number(i.quantity),
          description: i.description || undefined,
        })),
        delivery_fee: Number(d.delivery_fee) || undefined,
        discount_amount: Number(d.discount_amount) || undefined,
        order_notes: d.order_notes || undefined,
        vendor_notes: d.vendor_notes || undefined,
      });
      toaster.create({ title: 'Transaction created', type: 'success' });
      router.push(`/transactions/${result.data.id}`);
    } catch (err) {
      setErrorModal({
        open: true,
        title: 'Failed to create transaction',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        description={errorModal.description}
        type="error"
      />

      {showCatalog && (
        <CatalogPickerPanel
          products={products}
          onSelect={(p) =>
            append({
              product_id: p.id,
              item_name: p.name,
              item_price: p.price,
              quantity: 1,
              description: p.description ?? '',
            })
          }
          onClose={() => setShowCatalog(false)}
        />
      )}

      <Box maxW="600px" mx="auto">
        {/* Page header */}
        <Flex align="center" gap={3} mb={6}>
          <Button variant="ghost" size="sm" onClick={() => router.back()} colorPalette="gray">
            <LuArrowLeft />
          </Button>
          <Heading textStyle="xl" fontWeight="bold" color="fg">
            New Transaction
          </Heading>
        </Flex>

        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="2xl" p={6}>
          <StepHeader step={step} total={STEPS.length} />

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ── Step 0: Order Items ──────────────────────────────────────── */}
            {step === 0 && (
              <Stack gap={4}>
                {errors.items?.root && (
                  <Box bg="red.subtle" borderRadius="lg" px={3} py={2}>
                    <Text textStyle="xs" color="red.600" _dark={{ color: 'red.400' }}>
                      {errors.items.root.message}
                    </Text>
                  </Box>
                )}

                {/* Item list */}
                {fields.length > 0 && (
                  <Stack gap={3}>
                    {fields.map((field, index) => (
                      <Box
                        key={field.id}
                        p={3}
                        bg="bg.subtle"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="border"
                      >
                        <Flex align="flex-start" gap={2} mb={2}>
                          <Text textStyle="xs" color="fg.muted" pt={0.5} flexShrink={0}>
                            #{index + 1}
                          </Text>
                          <Stack gap={2} flex={1}>
                            <Grid templateColumns="1fr auto" gap={2}>
                              <Field.Root invalid={!!errors.items?.[index]?.item_name}>
                                <Field.Label>Item Name</Field.Label>
                                <Input
                                  {...register(`items.${index}.item_name`)}
                                  placeholder="Item name"
                                  size="sm"
                                />
                                {errors.items?.[index]?.item_name && (
                                  <Field.ErrorText>
                                    {errors.items[index].item_name?.message}
                                  </Field.ErrorText>
                                )}
                              </Field.Root>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                colorPalette="red"
                                onClick={() => remove(index)}
                              >
                                <LuTrash2 size={14} />
                              </Button>
                            </Grid>
                            <Grid templateColumns="1fr 1fr" gap={2}>
                              <Field.Root invalid={!!errors.items?.[index]?.item_price}>
                                <Field.Label>Price (₦)</Field.Label>
                                <Input
                                  {...register(`items.${index}.item_price`, {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="0"
                                  size="sm"
                                  type="number"
                                  min={1}
                                />
                                {errors.items?.[index]?.item_price && (
                                  <Field.ErrorText>
                                    {errors.items[index].item_price?.message}
                                  </Field.ErrorText>
                                )}
                              </Field.Root>
                              <Field.Root invalid={!!errors.items?.[index]?.quantity}>
                                <Field.Label>Quantity</Field.Label>
                                <Input
                                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                  placeholder="1"
                                  size="sm"
                                  type="number"
                                  min={1}
                                />
                                {errors.items?.[index]?.quantity && (
                                  <Field.ErrorText>
                                    {errors.items[index].quantity?.message}
                                  </Field.ErrorText>
                                )}
                              </Field.Root>
                            </Grid>
                            <Field.Root>
                              <Field.Label>
                                Description{' '}
                                <Text as="span" color="fg.muted" textStyle="xs">
                                  (optional)
                                </Text>
                              </Field.Label>
                              <Input
                                {...register(`items.${index}.description`)}
                                placeholder="Size, colour, notes, etc."
                                size="sm"
                              />
                            </Field.Root>
                          </Stack>
                        </Flex>
                        {watchItems[index] && (
                          <Flex justify="flex-end">
                            <Text textStyle="xs" color="primary.fg" fontWeight="semibold">
                              Subtotal:{' '}
                              {formatCurrency(
                                (Number(watchItems[index]?.item_price) || 0) *
                                  (Number(watchItems[index]?.quantity) || 0)
                              )}
                            </Text>
                          </Flex>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}

                {/* Add buttons */}
                <Flex gap={2} flexWrap="wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    colorPalette="primary"
                    onClick={() => setShowCatalog(true)}
                    disabled={products.length === 0}
                  >
                    <LuPackage size={14} />
                    Add from Catalog
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    colorPalette="gray"
                    onClick={() =>
                      append({
                        product_id: undefined,
                        item_name: '',
                        item_price: 0,
                        quantity: 1,
                        description: '',
                      })
                    }
                  >
                    <LuPlus size={14} />
                    Add Manual Item
                  </Button>
                </Flex>

                {fields.length > 0 && (
                  <Flex justify="space-between" p={3} bg="primary.subtle" borderRadius="lg">
                    <Text textStyle="sm" color="primary.fg" fontWeight="medium">
                      Items Subtotal
                    </Text>
                    <Text textStyle="sm" color="primary.fg" fontWeight="bold">
                      {formatCurrency(subtotal)}
                    </Text>
                  </Flex>
                )}
              </Stack>
            )}

            {/* ── Step 1: Delivery details ───────────────────────────────── */}
            {step === 1 && (
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
                      min={new Date().toISOString().split('T')[0]}
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
            )}

            {/* ── Step 2: Summary ────────────────────────────────────────── */}
            {step === 2 && (
              <Stack gap={4}>
                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Field.Root>
                    <Field.Label>Delivery Fee (₦) <Text as="span" color="fg.muted" textStyle="xs">(optional)</Text></Field.Label>
                    <Input
                      {...register('delivery_fee', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      placeholder="0"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Discount (₦) <Text as="span" color="fg.muted" textStyle="xs">(optional)</Text></Field.Label>
                    <Input
                      {...register('discount_amount', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      placeholder="0"
                    />
                  </Field.Root>
                </Grid>

                {/* Total breakdown */}
                <Box bg="bg.subtle" borderRadius="xl" p={4} borderWidth="1px" borderColor="border">
                  <Stack gap={2}>
                    <Flex justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        Items subtotal
                      </Text>
                      <Text textStyle="sm" color="fg">
                        {formatCurrency(subtotal)}
                      </Text>
                    </Flex>
                    {Number(watchDeliveryFee) > 0 && (
                      <Flex justify="space-between">
                        <Text textStyle="sm" color="fg.muted">
                          Delivery fee
                        </Text>
                        <Text textStyle="sm" color="fg">
                          +{formatCurrency(Number(watchDeliveryFee))}
                        </Text>
                      </Flex>
                    )}
                    {Number(watchDiscount) > 0 && (
                      <Flex justify="space-between">
                        <Text textStyle="sm" color="fg.muted">
                          Discount
                        </Text>
                        <Text textStyle="sm" color="green.600" _dark={{ color: 'green.400' }}>
                          −{formatCurrency(Number(watchDiscount))}
                        </Text>
                      </Flex>
                    )}
                    <Box borderTopWidth="1px" borderColor="border" pt={2}>
                      <Flex justify="space-between">
                        <Text textStyle="md" fontWeight="bold" color="fg">
                          Total
                        </Text>
                        <Text textStyle="md" fontWeight="bold" color="primary.fg">
                          {formatCurrency(total)}
                        </Text>
                      </Flex>
                    </Box>
                  </Stack>
                </Box>

                <Field.Root>
                  <Field.Label>Order Notes (visible to buyer) <Text as="span" color="fg.muted" textStyle="xs">(optional)</Text></Field.Label>
                  <Textarea
                    {...register('order_notes')}
                    placeholder="Any notes you'd like the buyer to see..."
                    rows={2}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Vendor Notes (internal only) <Text as="span" color="fg.muted" textStyle="xs">(optional)</Text></Field.Label>
                  <Textarea
                    {...register('vendor_notes')}
                    placeholder="Private notes for yourself..."
                    rows={2}
                  />
                </Field.Root>

                {/* Item summary */}
                <Box>
                  <Text textStyle="sm" fontWeight="medium" color="fg" mb={2}>
                    {watchItems.length} {watchItems.length === 1 ? 'item' : 'items'}
                  </Text>
                  <Stack gap={1}>
                    {watchItems.map((item, i) => (
                      <Flex key={i} justify="space-between" align="center">
                        <Text textStyle="xs" color="fg.muted" truncate flex={1}>
                          {item.item_name} {item.description ? `(${item.description})` : ''} ×{' '}
                          {item.quantity}
                        </Text>
                        <Text textStyle="xs" color="fg" fontWeight="medium" ml={3} flexShrink={0}>
                          {formatCurrency(
                            (Number(item.item_price) || 0) * (Number(item.quantity) || 0)
                          )}
                        </Text>
                      </Flex>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}

            {/* ── Navigation ─────────────────────────────────────────────── */}
            <Flex mt={6} gap={3} justify="space-between">
              {step > 0 ? (
                <Button variant="outline" onClick={goBack} colorPalette="gray" type="button">
                  <LuArrowLeft />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  colorPalette="gray"
                  type="button"
                >
                  Cancel
                </Button>
              )}

              {step < STEPS.length - 1 && (
                <Button colorPalette="primary" onClick={goNext} type="button">
                  Next
                  <LuArrowRight />
                </Button>
              )}

              {step === STEPS.length - 1 && (
                <Button
                  colorPalette="primary"
                  type="submit"
                  loading={createMutation.isPending}
                  disabled={createMutation.isPending || watchItems.length === 0}
                >
                  Create Transaction
                </Button>
              )}
            </Flex>
          </form>
        </Box>
      </Box>
    </AppShell>
  );
}
