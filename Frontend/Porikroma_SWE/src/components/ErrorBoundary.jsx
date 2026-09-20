import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white text-center px-6">
          <h1 className="text-2xl font-serif text-navy">Something went wrong</h1>
          <p className="text-sm text-navy/60 max-w-sm">
            An unexpected error stopped this page from loading. You can try going back to the home screen.
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-lg bg-teal-primary text-white text-sm font-semibold hover:bg-teal-primary/90 transition-colors"
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
