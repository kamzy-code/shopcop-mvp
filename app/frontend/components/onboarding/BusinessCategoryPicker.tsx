'use client';
import { Field, Spinner, Text } from '@chakra-ui/react';
import { UseFormSetValue, FieldErrors } from 'react-hook-form';
import { BusinessInfoFormData } from '@/app/validators/vendorSchema';
import { SingleChipSelect, MultiChipSelect } from '@/components/shared/chipSelect';
import { SectionHeader } from '../shared/formCard';

interface Category {
  name: string;
  subcategories: string[];
}

interface BusinessCategoryPickerProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: boolean;
  selectedPrimaryCategory: string;
  selectedSubcategories: string[];
  errors: FieldErrors<BusinessInfoFormData>;
  setValue: UseFormSetValue<BusinessInfoFormData>;
}

export function BusinessCategoryPicker({
  categories,
  categoriesLoading,
  categoriesError,
  selectedPrimaryCategory,
  selectedSubcategories,
  errors,
  setValue,
}: BusinessCategoryPickerProps) {
  const selectedCategoryData = categories.find((c) => c.name === selectedPrimaryCategory);
  const subcategoryOptions =
    selectedCategoryData?.subcategories.map((s) => ({ value: s, label: s })) ?? [];

  return (
    <>
      <SectionHeader
        title="Category"
        description="Help buyers discover your products in the right section of the marketplace."
      />
      <Field.Root invalid={!!errors.primary_category} required>
        <Field.Label color="fg">Primary Category</Field.Label>
        {categoriesLoading && <Spinner size="sm" colorPalette="primary" />}
        {categoriesError && (
          <Text color="red.fg" textStyle="xs">
            Failed to load categories. Please refresh the page.
          </Text>
        )}
        {!categoriesLoading && !categoriesError && (
          <SingleChipSelect
            options={categories.map((c) => ({ value: c.name, label: c.name }))}
            value={selectedPrimaryCategory}
            onChange={(v) => {
              setValue('primary_category', v, { shouldValidate: true });
              setValue('subcategories', []);
            }}
          />
        )}
        <Field.ErrorText>{errors.primary_category?.message}</Field.ErrorText>
      </Field.Root>

      <Field.Root invalid={!!errors.subcategories} required>
        <Field.Label color="fg">
          Subcategories{' '}
          <Text as="span" color="fg.muted" fontWeight="normal">
            (select up to 3)
          </Text>
        </Field.Label>
        {categoriesLoading && <Spinner size="sm" colorPalette="primary" />}
        {categoriesError && (
          <Text color="red.fg" textStyle="xs">
            Failed to load subcategories. Please refresh the page.
          </Text>
        )}
        {!categoriesLoading && !categoriesError && (
          <>
            {!selectedPrimaryCategory ? (
              <Text color="fg.subtle" textStyle="xs">
                Select a primary category first to see subcategories.
              </Text>
            ) : (
              <MultiChipSelect
                options={subcategoryOptions}
                value={selectedSubcategories}
                onChange={(v) => setValue('subcategories', v, { shouldValidate: true })}
                max={3}
              />
            )}
          </>
        )}
        <Field.ErrorText>{errors.subcategories?.message}</Field.ErrorText>
      </Field.Root>
    </>
  );
}
