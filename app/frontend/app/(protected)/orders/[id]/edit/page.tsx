'use client';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft, LuPackage, LuX } from 'react-icons/lu';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { useOrder, useUpdateOrder } from '@/app/_hooks/order';
import { useProducts } from '@/app/_hooks/vendor';
import { Product } from '@/app/_types';
import { OrderEditData, orderEditSchema } from '@/app/validators/orderSchema';
import { formatCurrency } from '@/app/_lib/orderHelpers';
import { OrderEditForm } from '@/components/order/OrderEditForm';
import { CatalogPickerPanel } from '@/components/order/CatalogPickerPanel';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: tx, isLoading } = useOrder(id);
  const { data: productsPage } = useProducts();
  const products = productsPage?.data ?? [];
  const updateMutation = useUpdateOrder();
  const [showCatalog, setShowCatalog] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', description: '' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderEditData>({
    resolver: zodResolver(orderEditSchema) as unknown as Resolver<OrderEditData>,
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

  useEffect(() => {
    if (tx && tx.status !== 'PENDING') {
      router.replace(`/orders/${id}`);
    }
  }, [tx, id, router]);

  const onSubmit = async (data: OrderEditData) => {
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
      toaster.create({ title: 'Order updated', type: 'success' });
      router.push(`/orders/${id}`);
    } catch (err) {
      setErrorModal({
        open: true,
        title: 'Failed to update order',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      
        <Stack gap={6}>
          <Flex align="center" gap={3}>
            <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
            <Box w="180px" h={6} bg="bg.subtle" borderRadius="md" />
          </Flex>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={6}>
            <Stack gap={5}>
              <Box w="160px" h={6} bg="bg.subtle" borderRadius="md" />
              <Box w="full" h="40px" bg="bg.subtle" borderRadius="lg" />
              <Flex gap={4}>
                <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
                <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
              </Flex>
              <Box w="full" h="100px" bg="bg.subtle" borderRadius="lg" />
            </Stack>
          </Box>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={6}>
            <Stack gap={3}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Flex key={i} align="center" gap={4} p={3} bg="bg.subtle" borderRadius="lg">
                  <Box w={10} h={10} borderRadius="md" bg="bg.panel" />
                  <Box flex={1}>
                    <Box w="40%" h={3} bg="bg.panel" borderRadius="md" mb={1.5} />
                    <Box w="25%" h={3} bg="bg.panel" borderRadius="md" />
                  </Box>
                  <Box w="80px" h={3} bg="bg.panel" borderRadius="md" />
                </Flex>
              ))}
            </Stack>
          </Box>
        </Stack>
      
    );
  }

  if (!tx) {
    return (
      
        <Box textAlign="center" py={16}>
          <Text color="fg.muted">Order not found.</Text>
          <Button mt={4} variant="outline" onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </Box>
      
    );
  }

  return (
    <>
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
        <Flex align="center" gap={3} mb={6}>
          <Button
            variant="ghost"
            size="sm"
            colorPalette="gray"
            onClick={() => router.push(`/orders/${id}`)}
          >
            <LuArrowLeft />
          </Button>
          <Box>
            <Heading textStyle="xl" fontWeight="bold" color="fg">
              Edit Order
            </Heading>
            <Text textStyle="xs" color="fg.muted">
              {tx.reference}
            </Text>
          </Box>
        </Flex>

        <OrderEditForm
          fields={fields}
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          control={control}
          isSubmitting={isSubmitting}
          subtotal={subtotal}
          total={total}
          onSubmit={onSubmit}
          onRemoveItem={remove}
          onAddManualItem={() =>
            append({
              product_id: undefined,
              item_name: '',
              item_price: 0,
              quantity: 1,
              description: '',
            })
          }
          onOpenCatalog={() => setShowCatalog(true)}
          onCancel={() => router.push(`/orders/${id}`)}
        />
      </Box>
    </>
  );
}
