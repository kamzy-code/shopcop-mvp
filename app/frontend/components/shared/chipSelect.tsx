'use client';
import { Flex, Stack, Text } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipItemProps {
  label: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  direction: 'row' | 'column';
  showCheck: boolean;
  stretch: boolean;
}

function ChipItem({ label, isSelected, isDisabled, onClick, direction, showCheck, stretch }: ChipItemProps) {
  const isRow = direction === 'row';
  return (
    <Flex
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={() => !isDisabled && onClick()}
      onKeyDown={(e) => e.key === 'Enter' && !isDisabled && onClick()}
      align="center"
      justify={stretch ? 'center' : undefined}
      gap={showCheck ? 1.5 : undefined}
      px={stretch ? 4 : isRow ? 3 : 4}
      py={stretch ? 2 : isRow ? 1.5 : 3}
      borderRadius={isRow ? 'full' : 'lg'}
      borderWidth="1.5px"
      borderColor={isSelected ? 'primary.500' : 'border'}
      bg={isSelected ? 'primary.subtle' : 'transparent'}
      color={isSelected ? 'primary.fg' : 'fg.muted'}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      opacity={isDisabled ? 0.4 : 1}
      transition="all 0.15s"
      fontWeight={isSelected ? 'medium' : 'normal'}
      userSelect="none"
      flex={stretch ? 1 : undefined}
      _hover={isDisabled ? {} : { borderColor: 'primary.400', color: 'fg' }}
    >
      {showCheck && isSelected && <LuCheck size={12} />}
      <Text textStyle={stretch || !isRow ? 'sm' : 'xs'}>{label}</Text>
    </Flex>
  );
}

interface SingleChipSelectProps {
  options: ChipOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  direction?: 'row' | 'column';
  showCheck?: boolean;
  stretch?: boolean;
}

export function SingleChipSelect({
  options,
  value,
  onChange,
  direction = 'row',
  showCheck,
  stretch = false,
}: SingleChipSelectProps) {
  const resolvedShowCheck = showCheck ?? direction === 'row';
  const isRow = direction === 'row';

  const chips = options.map((opt) => (
    <ChipItem
      key={opt.value}
      label={opt.label}
      isSelected={value === opt.value}
      onClick={() => onChange(opt.value)}
      direction={direction}
      showCheck={resolvedShowCheck}
      stretch={stretch}
    />
  ));

  return isRow ? (
    <Flex gap={2} flexWrap="wrap" pt={1}>{chips}</Flex>
  ) : (
    <Stack gap={2} pt={1}>{chips}</Stack>
  );
}

interface MultiChipSelectProps {
  options: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  direction?: 'row' | 'column';
  showCheck?: boolean;
  stretch?: boolean;
  max?: number;
}

export function MultiChipSelect({
  options,
  value,
  onChange,
  direction = 'row',
  showCheck,
  stretch = false,
  max,
}: MultiChipSelectProps) {
  const resolvedShowCheck = showCheck ?? direction === 'row';
  const isRow = direction === 'row';

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else if (!max || value.length < max) {
      onChange([...value, optValue]);
    }
  };

  const chips = options.map((opt) => {
    const isSelected = value.includes(opt.value);
    const isDisabled = !isSelected && !!max && value.length >= max;
    return (
      <ChipItem
        key={opt.value}
        label={opt.label}
        isSelected={isSelected}
        isDisabled={isDisabled}
        onClick={() => toggle(opt.value)}
        direction={direction}
        showCheck={resolvedShowCheck}
        stretch={stretch}
      />
    );
  });

  return (
    <>
      {isRow ? (
        <Flex gap={2} flexWrap="wrap" pt={1}>{chips}</Flex>
      ) : (
        <Stack gap={2} pt={1}>{chips}</Stack>
      )}
      {max && value.length > 0 && (
        <Text textStyle="xs" color="fg.muted">
          {value.length} of {max} selected
        </Text>
      )}
    </>
  );
}
