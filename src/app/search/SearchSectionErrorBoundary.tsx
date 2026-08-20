'use client';

import { Component, type ReactNode } from 'react';

interface SearchSectionErrorBoundaryProps {
  title: string;
  children: ReactNode;
}

interface SearchSectionErrorBoundaryState {
  failed: boolean;
}

export class SearchSectionErrorBoundary extends Component<
  SearchSectionErrorBoundaryProps,
  SearchSectionErrorBoundaryState
> {
  state: SearchSectionErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SearchSectionErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="rounded-lg border border-line bg-panel">
          <h2 className="border-b border-line px-4 py-2 font-display text-lg text-paper">
            {this.props.title}
          </h2>
          <p role="alert" className="px-4 py-6 text-sm text-amber-300">
            {this.props.title} search is unavailable right now.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}
