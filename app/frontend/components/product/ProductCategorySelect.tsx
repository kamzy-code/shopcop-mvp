'use client';
import { Field, Flex, Spinner, Text } from '@chakra-ui/react';
import { UseFormSetValue, UseFormClearErrors, FieldErrors } from 'react-hook-form';
import { ProductFormData } from '@/app/validators/vendorSchema';

interface Category {
  id: string;
  name: string;
}

interface ProductCategorySelectProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: boolean;
  selectedCategory: string;
  errors: FieldErrors<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  clearErrors: UseFormClearErrors<ProductFormData>;
}

export function ProductCategorySelect({
  categories,
  categoriesLoading,
  categoriesError,
  selectedCategory,
  errors,
  setValue,
  clearErrors,
}: ProductCategorySelectProps) {
  return (
    <Field.Root invalid={!!errors.category} required>
      <Field.Label color="fg">Category</Field.Label>
      {categoriesLoading && <Spinner size="sm" colorPalette="primary" />}
      {categoriesError && (
        <Text color="red.fg" textStyle="xs">Failed to load categories. Please refresh the page.</Text>
      )}
      {!categoriesLoading && !categoriesError && categories.length === 0 && (
        <Text color="fg.muted" textStyle="xs">No categories available.</Text>
      )}
      {!categoriesLoading && !categoriesError && categories.length > 0 && (
        <Flex gap={2} flexWrap="wrap" pt={1}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <Flex
                key={cat.id}
                role="button"
                tabIndex={0}
                onClick={() => { setValue('category', cat.name, { shouldValidate: true }); clearErrors('category'); }}
                onKeyDown={(e) => e.key === 'Enter' && setValue('category', cat.name, { shouldValidate: true })}
                align="center"
                px={3}
                py={1.5}
                borderRadius="full"
                borderWidth="1.5px"
                borderColor={isSelected ? 'primary.500' : 'border'}
                bg={isSelected ? 'primary.subtle' : 'transparent'}
                color={isSelected ? 'primary.fg' : 'fg.muted'}
                cursor="pointer"
                fontWeight={isSelected ? 'medium' : 'normal'}
                transition="all 0.15s"
                userSelect="none"
                _hover={isSelected ? {} : { borderColor: 'primary.400', color: 'fg' }}
              >
                <Text textStyle="xs">{cat.name}</Text>
              </Flex>
            );
          })}
        </Flex>
      )}
      <Field.ErrorText>{errors.category?.message}</Field.ErrorText>
    </Field.Root>
  );
}
