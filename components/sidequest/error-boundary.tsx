import { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to reporting service (e.g., Sentry)
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <SafeAreaView className="flex-1" style={{ backgroundColor: '#222' }}>
                    <View className="flex-1 items-center justify-center px-6">
                        <View
                            className="h-20 w-20 items-center justify-center rounded-full mb-4"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                            <Text className="text-4xl">⚠️</Text>
                        </View>
                        <Text className="text-xl font-semibold text-white mb-2">Something went wrong</Text>
                        <Text className="text-sm text-center text-[#888] mb-6">
                            We encountered an unexpected error. Please try again.
                        </Text>
                        <Pressable
                            onPress={this.handleRetry}
                            className="rounded-2xl px-6 py-3"
                            style={{ backgroundColor: '#0F8' }}
                        >
                            <Text className="font-semibold text-black">Try Again</Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}
