'use client';
import { Box } from '@chakra-ui/react';
import { FeatureCard, type FeatureCardProps } from './FeatureCard';

const STICKY_TOP_BASE = 96;
const STICKY_TOP_STEP = 16;
// Dwell space after each card before the next one slides up and covers it. All
// cards share the same parent Box, so a card only unsticks once the *whole*
// stack's bottom is reached — that's what keeps earlier cards pinned in place
// underneath as later ones stack on top, instead of each one scrolling away
// before the next arrives. The last card needs this too (even though nothing
// stacks on top of it) — without trailing space after it, the container's
// bottom sits right at its own bottom, so it would unstick the instant it
// started sticking and never actually pin in place.
const CARD_DWELL_HEIGHT = '55vh';
const LAST_CARD_DWELL_HEIGHT = '30vh';

interface StackedFeatureCardsProps {
  features: FeatureCardProps[];
}

export function StackedFeatureCards({ features }: StackedFeatureCardsProps) {
  return (
    <Box>
      {features.map((feature, index) => {
        const isLast = index === features.length - 1;
        return (
          <Box
            key={feature.number}
            position={{ base: 'static', md: 'sticky' }}
            top={{ md: `${STICKY_TOP_BASE + index * STICKY_TOP_STEP}px` }}
            zIndex={index + 1}
            mb={{ base: 8, md: isLast ? LAST_CARD_DWELL_HEIGHT : CARD_DWELL_HEIGHT }}
          >
            <FeatureCard {...feature} />
          </Box>
        );
      })}
    </Box>
  );
}
