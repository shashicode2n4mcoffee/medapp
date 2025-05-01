import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Text, View } from 'react-native';
import logger from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { 
    hasError: false, 
    error: null 
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log both error details in a grouped log
    logger.group('App Error', false, () => {
      logger.error('Error', error);
      logger.error('Error Info', errorInfo);
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong.
          </Text>
          <Text style={{ textAlign: 'center' }}>
            {this.state.error?.toString()}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;