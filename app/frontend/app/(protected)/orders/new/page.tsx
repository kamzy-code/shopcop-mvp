'use client';
import { useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Flex, Heading } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { useCreateOrder } from '@/app/_hooks/order';
import { useProducts } from '@/app/_hooks/vendor';
import { OrderFormData, orderFormSchema } from '@/app/validators/orderSchema';
import { StepHeader } from '@/components/order/StepHeader';
import { CatalogPickerPanel } from '@/components/order/CatalogPickerPanel';
import { OrderItemsStep } from '@/components/order/OrderItemsStep';
import { OrderDeliveryStep } from '@/components/order/OrderDeliveryStep';
import { OrderSummaryStep } from '@/components/order/OrderSummaryStep';

const STEPS = ['Order Items', 'Delivery Details', 'Review & Submit'];

const STEP_FIELDS: (keyof OrderFormData)[][] = [
  ['items'],
  ['delivery_method', 'expected_delivery_start', 'expected_delivery_end'],
  ['delivery_fee', 'discount_amount', 'order_notes', 'vendor_notes'],
];

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showCatalog, setShowCatalog] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', description: '' });

  const { data: productsPage } = useProducts();
  const products = productsPage?.data ?? [];
  const createMutation = useCreateOrder();

  const { register, handleSubmit, watch, control, trigger, setValue, formState: { errors } } =
    useForm<OrderFormData>({
      resolver: zodResolver(orderFormSchema) as unknown as Resolver<OrderFormData>,
      defaultValues: {
        delivery_method: 'PICKUP',
        items: [],
        delivery_fee: 0,
        discount_amount: 0,
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchItems = watch('items');
  const watchDeliveryFee = watch('delivery_fee') || 0;
  const watchDiscount = watch('discount_amount') || 0;

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (Number(item.item_price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const total = Math.max(0, subtotal + Number(watchDeliveryFee) - Number(watchDiscount));

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step] as (keyof OrderFormData)[]);
    if (valid) setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => s - 1);

  const onSubmit = async (data: unknown) => {
    const d = data as OrderFormData;
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
      toaster.create({ title: 'Order created', type: 'success' });
      router.push(`/orders/${result.data.id}`);
    } catch (err) {
      setErrorModal({
        open: true,
        title: 'Failed to create order',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

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
        <Flex align="center" gap={3} mb={6}>
          <Button variant="ghost" size="sm" onClick={() => router.push('/orders')} colorPalette="gray">
            <LuArrowLeft />
          </Button>
          <Heading textStyle="xl" fontWeight="bold" color="fg">
            New Order
          </Heading>
        </Flex>

        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="2xl" p={6}>
          <StepHeader step={step} total={STEPS.length} />

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 0 && (
              <OrderItemsStep
                fields={fields}
                register={register}
                errors={errors}
                watchItems={watchItems}
                subtotal={subtotal}
                products={products}
                onRemove={remove}
                onAppend={append}
                onOpenCatalog={() => setShowCatalog(true)}
              />
            )}

            {step === 1 && (
              <OrderDeliveryStep
                register={register}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}

            {step === 2 && (
              <OrderSummaryStep
                register={register}
                watchItems={watchItems}
                watchDeliveryFee={Number(watchDeliveryFee)}
                watchDiscount={Number(watchDiscount)}
                subtotal={subtotal}
                total={total}
              />
            )}

            <Flex mt={6} gap={3} justify="space-between">
              {step > 0 ? (
                <Button variant="outline" onClick={goBack} colorPalette="gray" type="button">
                  <LuArrowLeft />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => router.push('/orders')}
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
                  Create Order
                </Button>
              )}
            </Flex>
          </form>
        </Box>
      </Box>
    </AppShell>
  );
}
