"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin Error Boundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    
    // Show toast notification
    toast("An unexpected error occurred. Please try refreshing the page.", "error");
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  An unexpected error occurred while loading this page. This has been logged and we'll look into it.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button
                onClick={() => (window.location.href = "/admin")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

