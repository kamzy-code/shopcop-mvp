'use client';
import React from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Flex minH="60vh" align="center" justify="center" p={8}>
          <Box textAlign="center" maxW="sm">
            <Text fontWeight="semibold" color="fg" mb={2}>
              Something went wrong
            </Text>
            <Text textStyle="sm" color="fg.muted" mb={6}>
              {this.state.error?.message ?? 'An unexpected error occurred. Please refresh the page.'}
            </Text>
            <Button
              colorPalette="primary"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Refresh Page
            </Button>
          </Box>
        </Flex>
      );
    }
    return this.props.children;
  }
}
