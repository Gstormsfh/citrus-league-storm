import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-4 border border-red-200 bg-red-50 rounded text-red-500 text-xs">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="font-bold">Render Error</span>
          </div>
          <pre className="text-[10px] bg-white p-2 rounded border overflow-auto max-w-full">
            {this.state.error?.message}
            {this.state.error?.stack?.slice(0, 200)}...
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

