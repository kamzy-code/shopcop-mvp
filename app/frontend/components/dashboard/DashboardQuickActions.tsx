'use client';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuPackage, LuShoppingCart, LuShieldCheck } from 'react-icons/lu';

export function DashboardQuickActions() {
  const router = useRouter();
  return (
    <Box>
      <Text
        textStyle="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={4}
      >
        Quick Actions
      </Text>
      <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" display="flex" flexDirection="column">
          <Flex w={10} h={10} borderRadius="lg" bg="primary.subtle" align="center" justify="center" mb={4} color="primary.fg">
            <LuPackage size={18} />
          </Flex>
          <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>Add Product</Text>
          <Text color="fg.muted" textStyle="xs" flex={1}>List a new product in your store.</Text>
          <Button mt={4} size="sm" colorPalette="primary" variant="outline" w="full" onClick={() => router.push('/products/new')}>
            Add now
          </Button>
        </Box>

        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" display="flex" flexDirection="column">
          <Flex w={10} h={10} borderRadius="lg" bg="warning.subtle" align="center" justify="center" mb={4} color="warning.fg">
            <LuShoppingCart size={18} />
          </Flex>
          <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>New Order</Text>
          <Text color="fg.muted" textStyle="xs" flex={1}>Create and send a new order to a buyer.</Text>
          <Button mt={4} size="sm" colorPalette="warning" variant="outline" w="full" onClick={() => router.push('/orders/new')}>
            Create
          </Button>
        </Box>

        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" display="flex" flexDirection="column" gridColumn={{ base: '1 / -1', md: 'auto' }}>
          <Flex w={10} h={10} borderRadius="lg" bg="success.subtle" align="center" justify="center" mb={4} color="success.fg">
            <LuShieldCheck size={18} />
          </Flex>
          <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>Get Verified</Text>
          <Text color="fg.muted" textStyle="xs" flex={1}>Verify your identity and business to upgrade your tier and increase buyer trust.</Text>
          <Button mt={4} size="sm" colorPalette="success" variant="outline" w="full" onClick={() => router.push('/verifications')}>
            View verifications
          </Button>
        </Box>
      </Grid>
    </Box>
  );
}
