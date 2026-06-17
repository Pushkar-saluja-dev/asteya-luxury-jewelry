import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  /** Surface identifier printed in the console + shown in the fallback. */
  name: string;
  children: ReactNode;
  /**
   * Optional fallback. When omitted, a minimal materialised message renders
   * so an isolated sub-tree doesn't disappear silently (which is what was
   * happening on iOS Safari).
   */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Minimal React error boundary used during the iOS Safari debug pass.
 *
 * Each homepage surface (Header, Hero, GalleryAtelier, AITryOnPromo, Footer)
 * is wrapped with one of these. If a sub-tree throws during render — e.g. an
 * external script (`model-viewer`, MediaPipe face mesh) failed to load and an
 * `AITryOnStudio` import crashes — the boundary:
 *   1. Logs the failure with the surface name so we can see WHICH surface dies.
 *   2. Renders a non-blocking fallback so the rest of the page keeps working.
 *
 * Temporary diagnostic — to be removed once the fix is verified on a real
 * device.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.name}] crashed:`, error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div
          role="alert"
          data-boundary={this.props.name}
          className="border border-red-500/30 bg-red-950/30 text-red-200 font-mono text-[11px] p-4 m-4 rounded-sm"
        >
          <div className="uppercase tracking-widest text-red-300 mb-1">
            surface unavailable — {this.props.name}
         </div>
          <div>{this.state.error?.message ?? "Unknown render error"}</div>
       </div>
      );
    }
    return this.props.children;
  }
}
