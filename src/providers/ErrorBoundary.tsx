import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              Oops! Something went wrong.
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 mb-8 text-center">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </Text>
            <TouchableOpacity 
              onPress={this.handleReset}
              className="bg-blue-600 px-6 py-3 rounded-full active:bg-blue-700"
            >
              <Text className="text-white font-semibold text-lg">Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
