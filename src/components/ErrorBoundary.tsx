
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        // Clear everything and try to reload
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-white/50 backdrop-blur-sm text-center">
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
                        <p className="text-gray-600 mb-8 max-w-xs mx-auto">
                            The application encountered an unexpected error. Don't worry, we can fix this.
                        </p>

                        <div className="space-y-4">
                            <Button
                                onClick={this.handleReset}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-12 text-lg font-medium"
                            >
                                <RotateCcw className="h-5 w-5" />
                                Reload & Repair
                            </Button>
                            <p className="text-xs text-gray-400">
                                This will clear the app cache and returning you to the login screen.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 text-left p-4 bg-slate-50 rounded-lg overflow-auto max-h-32">
                                <p className="text-xs font-mono text-red-600 whitespace-pre-wrap">
                                    {this.state.error?.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
