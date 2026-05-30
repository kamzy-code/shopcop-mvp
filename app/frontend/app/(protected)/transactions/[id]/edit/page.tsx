'use client';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft, LuPackage, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { useTransaction, useUpdateTransaction } from '@/app/_hooks/transaction';
import { useProducts } from '@/app/_hooks/vendor';
import { Product } from '@/app/_types';
import { TransactionEditData, transactionEditSchema } from '@/app/validators/transactionschema';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { formatCurrency } from '@/app/_lib/transactionHelpers';

const DELIVERY_METHODS = [
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'WAYBILL', label: 'Waybill' },
] as const;

// ─── Catalog picker ────────────────────────────────────────────────────────────

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

        <Box px={4} py={3} borderBottomWidth="1px" borderColor="border">
          <Input
            placeholder="Search products..."
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

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

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: tx, isLoading } = useTransaction(id);
  const { data: products = [] } = useProducts();
  const updateMutation = useUpdateTransaction();
  const [showCatalog, setShowCatalog] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', description: '' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionEditData>({
    resolver: zodResolver(transactionEditSchema) as unknown as Resolver<TransactionEditData>,
    defaultValues: {
      delivery_method: 'PICKUP',
      expected_delivery_start: '',
      expected_delivery_end: '',
      items: [],
      delivery_fee: 0,
      discount_amount: 0,
      order_notes: '',
      vendor_notes: '',
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

  // Pre-populate form once transaction loads
  useEffect(() => {
    if (tx) {
      reset({
        delivery_method: tx.delivery_method as 'PICKUP' | 'DISPATCH' | 'WAYBILL',
        expected_delivery_start: tx.expected_delivery_start
          ? tx.expected_delivery_start.slice(0, 10)
          : '',
        expected_delivery_end: tx.expected_delivery_end
          ? tx.expected_delivery_end.slice(0, 10)
          : '',
        items: tx.items.map((item) => ({
          product_id: item.product_id ?? undefined,
          item_name: item.item_name,
          item_price: item.item_price,
          quantity: item.quantity,
          description: item.description ?? '',
        })),
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
          expected_delivery_start: data.expected_delivery_start || undefined,
          expected_delivery_end: data.expected_delivery_end || undefined,
          items: data.items.map((i) => ({
            product_id: i.product_id || undefined,
            item_name: i.item_name,
            item_price: Number(i.item_price),
            quantity: Number(i.quantity),
            description: i.description || undefined,
          })),
          delivery_fee: Number(data.delivery_fee) || 0,
          discount_amount: Number(data.discount_amount) || 0,
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
        >
          <Stack gap={5}>
            {/* ── Order Items ──────────────────────────────────────────── */}
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
                ORDER ITEMS
              </Text>

              <Stack gap={3}>
                {fields.length === 0 && (
                  <Flex
                    align="center"
                    justify="center"
                    h="80px"
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor="border"
                    borderRadius="lg"
                  >
                    <Text textStyle="sm" color="fg.subtle">
                      No items yet — add from catalog or manually
                    </Text>
                  </Flex>
                )}

                {fields.map((field, index) => (
                  <Box
                    key={field.id}
                    p={3}
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="lg"
                    bg="bg.subtle"
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
                            mt={6}
                          >
                            <LuTrash2 size={14} />
                          </Button>
                        </Grid>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Field.Root invalid={!!errors.items?.[index]?.item_price}>
                            <Field.Label>Price (₦)</Field.Label>
                            <Input
                              {...register(`items.${index}.item_price`, { valueAsNumber: true })}
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
                  </Box>
                ))}

                {errors.items?.root && (
                  <Text textStyle="xs" color="red.500" _dark={{ color: 'red.400' }}>
                    {errors.items.root.message}
                  </Text>
                )}

                {/* Add buttons */}
                <Flex gap={2}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    flex={1}
                    colorPalette="primary"
                    onClick={() => setShowCatalog(true)}
                  >
                    <LuPlus size={14} />
                    Add from Catalog
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    flex={1}
                    colorPalette="gray"
                    onClick={() =>
                      append({ product_id: undefined, item_name: '', item_price: 0, quantity: 1, description: '' })
                    }
                  >
                    <LuPlus size={14} />
                    Add Manual Item
                  </Button>
                </Flex>

                {/* Running subtotal */}
                {fields.length > 0 && (
                  <Flex justify="space-between" pt={1} borderTopWidth="1px" borderColor="border">
                    <Text textStyle="sm" color="fg.muted">
                      Subtotal
                    </Text>
                    <Text textStyle="sm" fontWeight="semibold">
                      {formatCurrency(subtotal)}
                    </Text>
                  </Flex>
                )}
              </Stack>
            </Box>

            {/* ── Delivery Details ─────────────────────────────────────── */}
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
                DELIVERY DETAILS
              </Text>
              <Stack gap={4}>
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

                <Flex gap={3}>
                  <Field.Root flex={1}>
                    <Field.Label textStyle="sm" fontWeight="medium">
                      Delivery Start
                    </Field.Label>
                    <Input type="date" {...register('expected_delivery_start')} />
                  </Field.Root>
                  <Field.Root flex={1}>
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
              <Stack gap={3}>
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

                {/* Live total */}
                <Flex
                  justify="space-between"
                  pt={2}
                  borderTopWidth="1px"
                  borderColor="border"
                  align="center"
                >
                  <Text textStyle="sm" fontWeight="bold">
                    Total
                  </Text>
                  <Text textStyle="md" fontWeight="bold" color="primary.fg">
                    {formatCurrency(total)}
                  </Text>
                </Flex>
              </Stack>
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
