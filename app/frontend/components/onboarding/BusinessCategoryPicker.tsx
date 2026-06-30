'use client';
import { useState, useEffect } from 'react';
import { Button, Field, Flex, Input, Spinner, Text } from '@chakra-ui/react';
import { UseFormSetValue, FieldErrors } from 'react-hook-form';
import { BusinessInfoFormData } from '@/app/validators/vendorSchema';
import { SingleChipSelect, MultiChipSelect } from '@/components/shared/chipSelect';
import { SectionHeader } from '../shared/formCard';

const OTHER_SENTINEL = '__other__';

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
  const isCuratedCategory = categories.some((c) => c.name === selectedPrimaryCategory);
  const [customCategoryMode, setCustomCategoryMode] = useState(
    !!selectedPrimaryCategory && !isCuratedCategory
  );

  // Sync mode when form is reset externally with a saved custom category value.
  useEffect(() => {
    if (categories.length > 0 && selectedPrimaryCategory) {
      setCustomCategoryMode(!categories.some((c) => c.name === selectedPrimaryCategory));
    }
  }, [selectedPrimaryCategory, categories]);
  const [subcategoryInput, setSubcategoryInput] = useState('');

  const selectedCategoryData = categories.find((c) => c.name === selectedPrimaryCategory);
  const presetSubcategoryOptions = selectedCategoryData?.subcategories.map((s) => ({ value: s, label: s })) ?? [];
  // Keep any already-selected custom subcategories visible as chips alongside the preset list.
  const subcategoryOptions = [
    ...presetSubcategoryOptions,
    ...selectedSubcategories
      .filter((s) => !presetSubcategoryOptions.some((opt) => opt.value === s))
      .map((s) => ({ value: s, label: s })),
  ];

  const handleAddCustomSubcategory = () => {
    const trimmed = subcategoryInput.trim();
    if (!trimmed || selectedSubcategories.includes(trimmed) || selectedSubcategories.length >= 3) return;
    setValue('subcategories', [...selectedSubcategories, trimmed], { shouldValidate: true });
    setSubcategoryInput('');
  };

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
          <>
            <SingleChipSelect
              options={[
                ...categories.map((c) => ({ value: c.name, label: c.name })),
                { value: OTHER_SENTINEL, label: 'Other' },
              ]}
              value={customCategoryMode ? OTHER_SENTINEL : selectedPrimaryCategory}
              onChange={(v) => {
                if (v === OTHER_SENTINEL) {
                  setCustomCategoryMode(true);
                  setValue('primary_category', '');
                } else {
                  setCustomCategoryMode(false);
                  setValue('primary_category', v, { shouldValidate: true });
                }
                setValue('subcategories', []);
              }}
            />
            {customCategoryMode && (
              <Input
                mt={2}
                size="sm"
                placeholder="Type your business category"
                value={selectedPrimaryCategory}
                onChange={(e) => setValue('primary_category', e.target.value, { shouldValidate: true })}
              />
            )}
          </>
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
              <>
                {subcategoryOptions.length > 0 && (
                  <MultiChipSelect
                    options={subcategoryOptions}
                    value={selectedSubcategories}
                    onChange={(v) => setValue('subcategories', v, { shouldValidate: true })}
                    max={3}
                  />
                )}
                {selectedSubcategories.length < 3 && (
                  <Flex gap={2} mt={2}>
                    <Input
                      size="sm"
                      placeholder="Add a custom subcategory"
                      value={subcategoryInput}
                      onChange={(e) => setSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSubcategory();
                        }
                      }}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddCustomSubcategory}>
                      Add
                    </Button>
                  </Flex>
                )}
              </>
            )}
          </>
        )}
        <Field.ErrorText>{errors.subcategories?.message}</Field.ErrorText>
      </Field.Root>
    </>
  );
}
