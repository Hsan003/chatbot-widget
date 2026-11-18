/**
 * Error Boundary component
 * 
 * Catches React rendering errors and displays a graceful fallback
 * Prevents entire widget from crashing silently
 */

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "[ChatAssistant] Widget error:",
      error,
      "Component stack:",
      errorInfo.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "16px",
            background: "#f5f5f5",
            borderRadius: "8px",
            color: "#333",
            fontSize: "13px",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            lineHeight: "1.5",
          }}
        >
          <strong style={{ display: "block", marginBottom: "8px" }}>
            Chat widget encountered an error
          </strong>
          <p
            style={{
              margin: "0",
              fontSize: "12px",
              opacity: "0.7",
            }}
          >
            Please refresh the page or contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
