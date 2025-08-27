// src/components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Aquí podrías enviar el error a un servicio (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    const { hasError, error } = this.state;
    const { fallback } = this.props;
    if (hasError) {
      if (fallback) return fallback;
      return (
        <div className="text-red-400">
          Ha ocurrido un error en este bloque: {String(error && error.message)}
        </div>
      );
    }
    return this.props.children;
  }
}
