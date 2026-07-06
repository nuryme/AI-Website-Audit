import { Component } from 'react';
import ErrorPage from './ErrorPage.jsx';

// React error boundaries must be class components — no hook equivalent exists.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    return this.state.hasError ? <ErrorPage /> : this.props.children;
  }
}
