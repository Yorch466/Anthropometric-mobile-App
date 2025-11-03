import React, { ReactNode } from 'react';
import { Alert } from 'react-native';

type Props = { children?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: unknown): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log útil en dev; en prod puedes enviar a un logger remoto
    console.error('GlobalError:', error, info);
    Alert.alert('Ups', 'Ocurrió un error inesperado.');
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render alternativo si quieres mostrar una UI de fallback
      return null;
    }
    return this.props.children ?? null;
  }
}

export default ErrorBoundary;
