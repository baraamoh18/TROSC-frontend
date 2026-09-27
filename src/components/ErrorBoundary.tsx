import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  hasError: boolean;
}

/** Last-resort screen so a render error never leaves a blank page. */
class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-light px-4 pt-16 text-center">
        <div>
          <h1 className="mb-3 text-2xl font-bold text-neutral-darker">Something went wrong</h1>
          <p className="mb-6 text-neutral-dark">
            The page failed to load. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary-dark px-6 py-2.5 font-bold text-white transition-colors hover:bg-primary-dark-hover"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
